/**
 * SOMA — Agrégation des déclarations pour la carte publique
 *
 * À ajouter dans le même projet Apps Script que creer_formulaire_soma.gs
 * (bouton « + » à côté de « Fichiers », puis « Script », nommer le fichier agregation_carte).
 *
 * Fonctions :
 *   - publierCarte          : calcule les agrégats et met à jour la feuille publique (exécution manuelle possible)
 *   - activerMiseAJourAuto  : à exécuter une seule fois, programme publierCarte chaque nuit
 *
 * Principe :
 *   Feuille privée « Déclarations »  ──►  agrégation par commune  ──►  feuille publique « Carte publique »
 *   Seuls les totaux par commune quittent la feuille privée. Une commune n'est publiée que si elle
 *   compte au moins SEUIL_INSTALLATIONS installations déclarées par au moins SEUIL_CONTRIBUTEURS contributeurs.
 */

var SEUIL_INSTALLATIONS = 5;
var SEUIL_CONTRIBUTEURS = 2;

var NOM_DECLARATIONS = "SOMA — Déclarations (données brutes, ne pas partager)";
var NOM_CONTRIBUTEURS = "SOMA — Contributeurs (confidentiel, ne pas partager)";
var NOM_PUBLIC = "SOMA — Carte publique (agrégats)";

var COL = {
  contributeur: "Identifiant contributeur",
  pays: "Pays",
  commune: "Commune",
  puissance: "Puissance totale des panneaux (Wc)",
  etat: "État actuel",
  type: "Type d'installation"
};

// =====================================================================
// FONCTIONS À EXÉCUTER
// =====================================================================

function publierCarte() {
  var decl = feuilleAvecColonne_(ouvrirParNom_(NOM_DECLARATIONS), COL.contributeur);
  var lignes = lireTableau_(decl);
  var idsValides = lireIdentifiantsContributeurs_();

  var publicSs = ouvrirOuCreerPublic_();
  var feuilleCommunes = obtenirFeuille_(publicSs, "communes");
  var feuilleGeo = obtenirFeuille_(publicSs, "geocodage");
  var cacheGeo = lireCacheGeo_(feuilleGeo);

  var resultat = agreger(lignes, idsValides, cacheGeo.alias);

  // Coordonnées du centre de chaque commune publiée (géocodage mis en cache)
  resultat.publiees.forEach(function (z) {
    var geo = cacheGeo.coords[z.cle];
    if (!geo) {
      geo = geocoder_(z.commune, z.pays);
      cacheGeo.coords[z.cle] = geo;
      feuilleGeo.appendRow([z.cle, z.pays, z.commune, geo.lat, geo.lng, geo.lat ? "auto" : "introuvable", ""]);
    }
    z.lat = geo.lat;
    z.lng = geo.lng;
  });

  ecrirePublic_(feuilleCommunes, resultat);
  ecrireRejets_(ouvrirParNom_(NOM_DECLARATIONS), resultat.rejets);

  Logger.log(resultat.publiees.length + " commune(s) publiée(s), " +
             resultat.masquees.installations + " installation(s) dans des zones masquées, " +
             resultat.rejets.length + " déclaration(s) écartée(s).");
}

function activerMiseAJourAuto() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "publierCarte") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("publierCarte").timeBased().everyDays(1).atHour(2).create();
  Logger.log("Mise à jour automatique programmée chaque nuit vers 2 h.");
}

// =====================================================================
// LOGIQUE D'AGRÉGATION (sans accès Google, testable séparément)
// =====================================================================

/**
 * Normalise un nom de commune : minuscules, sans accents, tirets et espaces unifiés.
 * « Abomey-Calavi », « abomey calavi » et « ABOMEY CALAVI » donnent la même clé.
 */
function normaliser(texte) {
  return String(texte || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[-_'’.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * @param lignes     tableau d'objets {titre de colonne: valeur}
 * @param idsValides objet {CTB-XXXXXX: true} des contributeurs inscrits
 * @param alias      objet {cleSource: cleCible} pour regrouper des orthographes différentes
 */
function agreger(lignes, idsValides, alias) {
  alias = alias || {};
  var zones = {};
  var rejets = [];

  lignes.forEach(function (l, i) {
    var id = String(l[COL.contributeur] || "").trim().toUpperCase();
    var pays = String(l[COL.pays] || "").trim();
    var commune = String(l[COL.commune] || "").trim();
    var puissance = parseFloat(String(l[COL.puissance] || "").replace(",", "."));

    var motif = null;
    if (!idsValides[id]) motif = "identifiant contributeur inconnu";
    else if (!commune) motif = "commune vide";
    else if (!(puissance > 0)) motif = "puissance invalide";
    if (motif) { rejets.push({ ligne: i + 2, motif: motif }); return; }

    var cle = normaliser(pays) + "|" + normaliser(commune);
    while (alias[cle]) cle = alias[cle];

    if (!zones[cle]) {
      zones[cle] = {
        cle: cle, pays: pays, commune: commune, installations: 0, puissance_wc: 0,
        contributeurs: {}, en_service: 0, en_panne: 0, hors_service: 0, types: {}
      };
    }
    var z = zones[cle];
    z.installations += 1;
    z.puissance_wc += puissance;
    z.contributeurs[id] = true;

    var etat = normaliser(l[COL.etat]);
    if (etat === "en service") z.en_service += 1;
    else if (etat === "en panne") z.en_panne += 1;
    else if (etat === "hors service") z.hors_service += 1;

    var type = String(l[COL.type] || "Autre").split(" (")[0];
    z.types[type] = (z.types[type] || 0) + 1;
  });

  var publiees = [];
  var masquees = { installations: 0, puissance_wc: 0, zones: 0 };

  Object.keys(zones).forEach(function (cle) {
    var z = zones[cle];
    var nbContrib = Object.keys(z.contributeurs).length;
    delete z.contributeurs; // ne quitte jamais la fonction
    if (z.installations >= SEUIL_INSTALLATIONS && nbContrib >= SEUIL_CONTRIBUTEURS) {
      publiees.push(z);
    } else {
      masquees.installations += z.installations;
      masquees.puissance_wc += z.puissance_wc;
      masquees.zones += 1;
    }
  });

  publiees.sort(function (a, b) { return b.installations - a.installations; });
  return { publiees: publiees, masquees: masquees, rejets: rejets };
}

// =====================================================================
// ACCÈS GOOGLE (Drive, Sheets, géocodage)
// =====================================================================

function ouvrirParNom_(nom) {
  var fichiers = DriveApp.getFilesByName(nom);
  if (!fichiers.hasNext()) throw new Error("Fichier introuvable dans Google Drive : " + nom);
  return SpreadsheetApp.open(fichiers.next());
}

function ouvrirOuCreerPublic_() {
  var fichiers = DriveApp.getFilesByName(NOM_PUBLIC);
  if (fichiers.hasNext()) return SpreadsheetApp.open(fichiers.next());
  var ss = SpreadsheetApp.create(NOM_PUBLIC);
  ss.getSheets()[0].setName("communes");
  var geo = ss.insertSheet("geocodage");
  geo.appendRow(["cle", "pays", "commune", "lat", "lng", "statut", "regrouper_sous (cle cible)"]);
  return ss;
}

/** Retrouve la feuille des réponses du formulaire : celle dont l'en-tête contient la colonne indiquée. */
function feuilleAvecColonne_(ss, colonne) {
  var feuilles = ss.getSheets();
  for (var i = 0; i < feuilles.length; i++) {
    var f = feuilles[i];
    if (f.getLastColumn() === 0) continue;
    var entetes = f.getRange(1, 1, 1, f.getLastColumn()).getValues()[0];
    if (entetes.indexOf(colonne) >= 0) return f;
  }
  throw new Error("Colonne « " + colonne + " » introuvable dans " + ss.getName());
}

function obtenirFeuille_(ss, nom) {
  return ss.getSheetByName(nom) || ss.insertSheet(nom);
}

function lireTableau_(feuille) {
  var valeurs = feuille.getDataRange().getValues();
  var entetes = valeurs.shift();
  return valeurs.map(function (ligne) {
    var o = {};
    entetes.forEach(function (h, i) { o[h] = ligne[i]; });
    return o;
  });
}

function lireIdentifiantsContributeurs_() {
  var feuille = feuilleAvecColonne_(ouvrirParNom_(NOM_CONTRIBUTEURS), "Identifiant CTB");
  var valeurs = feuille.getDataRange().getValues();
  var col = valeurs[0].indexOf("Identifiant CTB");
  var ids = {};
  if (col < 0) return ids;
  for (var i = 1; i < valeurs.length; i++) {
    if (valeurs[i][col]) ids[String(valeurs[i][col]).trim().toUpperCase()] = true;
  }
  return ids; // seuls les identifiants sont lus, aucune coordonnée personnelle
}

function lireCacheGeo_(feuille) {
  var valeurs = feuille.getDataRange().getValues();
  var coords = {}, alias = {};
  for (var i = 1; i < valeurs.length; i++) {
    var cle = valeurs[i][0];
    if (!cle) continue;
    if (valeurs[i][6]) alias[cle] = String(valeurs[i][6]).trim();
    if (valeurs[i][3] !== "" && valeurs[i][4] !== "") coords[cle] = { lat: valeurs[i][3], lng: valeurs[i][4] };
  }
  return { coords: coords, alias: alias };
}

function geocoder_(commune, pays) {
  var r = Maps.newGeocoder().setLanguage("fr").geocode(commune + ", " + pays);
  if (r.status === "OK" && r.results.length) {
    var loc = r.results[0].geometry.location;
    return { lat: Math.round(loc.lat * 10000) / 10000, lng: Math.round(loc.lng * 10000) / 10000 };
  }
  return { lat: "", lng: "" };
}

function ecrirePublic_(feuille, resultat) {
  var entetes = ["pays", "commune", "lat", "lng", "installations", "puissance_kwc",
                 "en_service", "en_panne", "hors_service", "types", "mise_a_jour"];
  var date = Utilities.formatDate(new Date(), "Africa/Porto-Novo", "yyyy-MM-dd");
  var lignes = resultat.publiees
    .filter(function (z) { return z.lat !== ""; })
    .map(function (z) {
      var types = Object.keys(z.types).map(function (t) { return t + ": " + z.types[t]; }).join("; ");
      return [z.pays, z.commune, z.lat, z.lng, z.installations, Math.round(z.puissance_wc / 100) / 10,
              z.en_service, z.en_panne, z.hors_service, types, date];
    });
  // Ligne spéciale : total des zones masquées (sans localisation)
  lignes.push(["", "__zones_masquees__", "", "", resultat.masquees.installations,
               Math.round(resultat.masquees.puissance_wc / 100) / 10, "", "", "", "", date]);

  feuille.clearContents();
  feuille.getRange(1, 1, 1, entetes.length).setValues([entetes]);
  feuille.getRange(2, 1, lignes.length, entetes.length).setValues(lignes);
}

function ecrireRejets_(ssDeclarations, rejets) {
  var f = obtenirFeuille_(ssDeclarations, "A corriger");
  f.clearContents();
  f.appendRow(["Ligne de la feuille de réponses", "Motif", "Vérifié le"]);
  var date = Utilities.formatDate(new Date(), "Africa/Porto-Novo", "yyyy-MM-dd HH:mm");
  rejets.forEach(function (r) { f.appendRow([r.ligne, r.motif, date]); });
}
