/**
 * SOMA — Création automatique des formulaires de collecte
 *
 * Deux fonctions à exécuter une seule fois chacune :
 *   - creerFormulaireInscription : inscription des contributeurs (attribue un identifiant CTB-…)
 *   - creerFormulaireSOMA        : déclaration des installations
 *
 * Utilisation :
 * 1. Connecté au compte Google d'OSHU, ouvrir https://script.google.com
 * 2. Nouveau projet, effacer le contenu, coller ce script, enregistrer
 * 3. Sélectionner une fonction dans la liste en haut, cliquer sur Exécuter
 * 4. Autoriser l'accès demandé (Forms, Sheets, Drive)
 * 5. Les liens s'affichent dans le journal d'exécution
 *
 * Les deux feuilles de réponses restent séparées : les coordonnées des contributeurs
 * ne sont jamais stockées avec les déclarations d'installations.
 */


// =====================================================================
// FORMULAIRE 1 — INSCRIPTION DES CONTRIBUTEURS
// =====================================================================

function creerFormulaireInscription() {
  var form = FormApp.create("SOMA — Inscription contributeur");

  form.setDescription(
    "Inscrivez-vous pour déclarer des installations solaires dans SOMA, la cartographie collaborative " +
    "des installations hors réseau portée par OSHU — Open Solar Hub.\n\n" +
    "Après inscription, vous recevez par WhatsApp votre identifiant contributeur (CTB-…). " +
    "Vos coordonnées restent confidentielles : elles ne sont jamais publiées ni associées aux installations sur la carte.\n\n" +
    "Contact : weareoshu.project@gmail.com"
  );
  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);
  form.setPublishingSummary(false);
  form.setLimitOneResponsePerUser(false);
  form.setConfirmationMessage("Merci. Votre identifiant contributeur vous sera envoyé par WhatsApp.");

  form.addMultipleChoiceItem()
    .setTitle("Vous vous inscrivez en tant que")
    .setChoiceValues(["Technicien indépendant", "Entreprise d'installation"])
    .setRequired(true);

  form.addTextItem()
    .setTitle("Nom et prénom")
    .setHelpText("Pour une entreprise : nom de la personne de contact.")
    .setRequired(true);

  form.addTextItem()
    .setTitle("Nom de l'entreprise")
    .setHelpText("Uniquement pour les entreprises.")
    .setRequired(false);

  form.addTextItem()
    .setTitle("Numéro WhatsApp")
    .setHelpText("Avec l'indicatif du pays, ex. +229 01 23 45 67 89.")
    .setRequired(true)
    .setValidation(FormApp.createTextValidation()
      .requireTextMatchesPattern("^\\+[0-9 ]{8,20}$")
      .setHelpText("Format attendu : + suivi de l'indicatif et du numéro.")
      .build());

  form.addTextItem()
    .setTitle("Adresse e-mail")
    .setRequired(false)
    .setValidation(FormApp.createTextValidation().requireTextIsEmail().build());

  form.addListItem()
    .setTitle("Pays principal d'activité")
    .setChoiceValues(["Bénin", "Togo", "Autre"])
    .setRequired(true);

  form.addTextItem()
    .setTitle("Communes où vous intervenez")
    .setHelpText("Séparées par des virgules.")
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle("Années d'expérience dans le solaire")
    .setChoiceValues(["Moins de 2 ans", "2 à 5 ans", "Plus de 5 ans"])
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle("Engagements")
    .setChoiceValues([
      "J'ai lu la politique de données SOMA : https://github.com/oshu-africa/soma/tree/main/data-policy",
      "Je déclarerai uniquement des installations dont le propriétaire a donné son accord."
    ])
    .setValidation(FormApp.createCheckboxValidation().requireSelectExactly(2)
      .setHelpText("Les deux engagements sont nécessaires pour contribuer.").build())
    .setRequired(true);

  var ss = SpreadsheetApp.create("SOMA — Contributeurs (confidentiel, ne pas partager)");
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  // Attribution automatique d'un identifiant à chaque nouvelle inscription
  ScriptApp.newTrigger("attribuerIdentifiant")
    .forSpreadsheet(ss)
    .onFormSubmit()
    .create();

  Logger.log("Formulaire d'inscription à diffuser : " + form.getPublishedUrl());
  Logger.log("Formulaire (modification) : " + form.getEditUrl());
  Logger.log("Feuille des contributeurs : " + ss.getUrl());
}

/**
 * Déclenché automatiquement à chaque inscription.
 * Ajoute un identifiant unique CTB-XXXXXX dans la colonne « Identifiant CTB ».
 * Ne pas exécuter manuellement.
 */
function attribuerIdentifiant(e) {
  var sheet = e.range.getSheet();
  var row = e.range.getRow();
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  var col = headers.indexOf("Identifiant CTB") + 1;
  if (col === 0) {
    col = lastCol + 1;
    sheet.getRange(1, col).setValue("Identifiant CTB");
    sheet.getRange(1, col + 1).setValue("Identifiant envoyé (oui/non)");
  }

  var existants = {};
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, col, sheet.getLastRow() - 1, 1).getValues()
      .forEach(function (r) { if (r[0]) existants[r[0]] = true; });
  }

  var caracteres = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // sans I ni O pour éviter les confusions
  var id;
  do {
    id = "CTB-";
    for (var i = 0; i < 6; i++) {
      id += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
  } while (existants[id]);

  sheet.getRange(row, col).setValue(id);
  sheet.getRange(row, col + 1).setValue("non");
}


// =====================================================================
// FORMULAIRE 2 — DÉCLARATION DES INSTALLATIONS
// =====================================================================

function creerFormulaireSOMA() {
  var form = FormApp.create("SOMA — Déclaration d'installation solaire");

  form.setDescription(
    "SOMA est la cartographie collaborative des installations solaires hors réseau en Afrique, portée par OSHU — Open Solar Hub.\n\n" +
    "Aucune donnée nominative sur le propriétaire n'est demandée. Les coordonnées et le quartier ne sont jamais publiés : " +
    "la carte publique n'affiche que des totaux par commune.\n\n" +
    "Politique de données : https://github.com/oshu-africa/soma/tree/main/data-policy\n" +
    "Contact : weareoshu.project@gmail.com"
  );
  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);
  form.setPublishingSummary(false);
  form.setShowLinkToRespondAgain(true);
  form.setConfirmationMessage("Merci. L'installation a été enregistrée. Vous pouvez en déclarer une autre avec le lien ci-dessous.");

  // ---------- 1. Contributeur ----------
  form.addPageBreakItem().setTitle("1. Contributeur");

  form.addTextItem()
    .setTitle("Identifiant contributeur")
    .setHelpText("Format CTB-XXXXXX, attribué par OSHU lors de votre inscription.")
    .setRequired(true)
    .setValidation(FormApp.createTextValidation()
      .requireTextMatchesPattern("^CTB-[0-9A-Z]{6}$")
      .setHelpText("Format attendu : CTB- suivi de 6 caractères (ex. CTB-00A1B2).")
      .build());

  form.addMultipleChoiceItem()
    .setTitle("Vous déclarez en tant que")
    .setChoiceValues(["Technicien", "Entreprise"])
    .setRequired(true);

  // ---------- 2. Consentement ----------
  form.addPageBreakItem().setTitle("2. Consentement du propriétaire");

  form.addCheckboxItem()
    .setTitle("Accord du propriétaire")
    .setChoiceValues(["Le propriétaire a donné son accord pour que cette installation soit déclarée dans SOMA."])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle("Forme de l'accord")
    .setChoiceValues(["Oral", "Écrit", "SMS"])
    .setRequired(true);

  form.addDateItem()
    .setTitle("Date de l'accord")
    .setRequired(true);

  // ---------- 3. Localisation ----------
  form.addPageBreakItem().setTitle("3. Localisation")
    .setHelpText("La commune est obligatoire. Les coordonnées GPS sont facultatives.");

  form.addListItem()
    .setTitle("Pays")
    .setChoiceValues(["Bénin", "Togo", "Autre"])
    .setRequired(true);

  form.addTextItem().setTitle("Département / Région").setRequired(false);

  form.addTextItem().setTitle("Commune").setRequired(true);

  form.addTextItem()
    .setTitle("Quartier ou village")
    .setHelpText("Facultatif. Jamais publié.")
    .setRequired(false);

  form.addMultipleChoiceItem()
    .setTitle("Précision de la localisation")
    .setChoiceValues([
      "GPS (coordonnées relevées)",
      "Quartier ou village connu",
      "Commune seulement"
    ])
    .setRequired(true);

  form.addTextItem()
    .setTitle("Coordonnées GPS")
    .setHelpText("Facultatif. Format : latitude, longitude (ex. 6.3703, 2.3912). Dans Google Maps, un appui long sur le lieu affiche ces chiffres.")
    .setRequired(false)
    .setValidation(FormApp.createTextValidation()
      .requireTextMatchesPattern("^-?[0-9]{1,2}\\.[0-9]+,\\s*-?[0-9]{1,2}\\.[0-9]+$")
      .setHelpText("Format attendu : 6.3703, 2.3912")
      .build());

  // ---------- 4. Installation ----------
  form.addPageBreakItem().setTitle("4. Installation");

  form.addMultipleChoiceItem()
    .setTitle("Type d'installation")
    .setChoiceValues([
      "Kit domestique",
      "Système autonome (panneaux + batterie + onduleur)",
      "Usage productif (commerce, artisanat)",
      "Pompage",
      "Institutionnel (école, centre de santé…)",
      "Mini-réseau"
    ])
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle("Usages alimentés")
    .setChoiceValues([
      "Éclairage",
      "Recharge de téléphones",
      "Audiovisuel (TV, radio)",
      "Froid (réfrigérateur, congélateur)",
      "Ventilation",
      "Commerce / artisanat",
      "Agriculture",
      "Eau",
      "Santé",
      "Éducation"
    ])
    .showOtherOption(true)
    .setRequired(true);

  form.addTextItem()
    .setTitle("Puissance totale des panneaux (Wc)")
    .setRequired(true)
    .setValidation(FormApp.createTextValidation()
      .requireNumberGreaterThan(0)
      .setHelpText("Indiquez un nombre en watts-crête, ex. 400.")
      .build());

  form.addListItem()
    .setTitle("Type de batterie")
    .setChoiceValues(["Plomb ouvert", "Plomb AGM / Gel", "LiFePO4", "Lithium (autre)", "Inconnu", "Pas de batterie"])
    .setRequired(true);

  form.addTextItem()
    .setTitle("Tension batterie (V)")
    .setHelpText("Facultatif, ex. 12, 12.8, 24, 48.")
    .setRequired(false)
    .setValidation(FormApp.createTextValidation().requireNumberGreaterThan(0).build());

  form.addTextItem()
    .setTitle("Capacité batterie (Ah)")
    .setHelpText("Facultatif, ex. 100.")
    .setRequired(false)
    .setValidation(FormApp.createTextValidation().requireNumberGreaterThan(0).build());

  form.addTextItem()
    .setTitle("Puissance de l'onduleur (W)")
    .setHelpText("Facultatif. Laisser vide s'il n'y a pas d'onduleur.")
    .setRequired(false)
    .setValidation(FormApp.createTextValidation().requireNumberGreaterThan(0).build());

  form.addParagraphTextItem()
    .setTitle("Marques et modèles des équipements")
    .setHelpText("Facultatif. Une ligne par équipement, ex. « Régulateur : EPever Tracer 2210AN ».")
    .setRequired(false);

  form.addMultipleChoiceItem()
    .setTitle("Paiement à l'usage (PAYGO)")
    .setChoiceValues(["Oui", "Non", "Ne sait pas"])
    .setRequired(true);

  // ---------- 5. État ----------
  form.addPageBreakItem().setTitle("5. État et historique");

  form.addMultipleChoiceItem()
    .setTitle("État actuel")
    .setChoiceValues(["En service", "En panne", "Hors service"])
    .setRequired(true);

  form.addTextItem()
    .setTitle("Date d'installation")
    .setHelpText("Format AAAA-MM ou AAAA-MM-JJ, ex. 2026-09.")
    .setRequired(true)
    .setValidation(FormApp.createTextValidation()
      .requireTextMatchesPattern("^[0-9]{4}-[0-9]{2}(-[0-9]{2})?$")
      .setHelpText("Format attendu : 2026-09 ou 2026-09-15")
      .build());

  form.addTextItem()
    .setTitle("Date de la dernière intervention")
    .setHelpText("Facultatif. Format AAAA-MM ou AAAA-MM-JJ.")
    .setRequired(false)
    .setValidation(FormApp.createTextValidation()
      .requireTextMatchesPattern("^[0-9]{4}-[0-9]{2}(-[0-9]{2})?$")
      .build());

  // ---------- Feuille de réponses ----------
  var ss = SpreadsheetApp.create("SOMA — Déclarations (données brutes, ne pas partager)");
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  Logger.log("Formulaire à envoyer aux techniciens : " + form.getPublishedUrl());
  Logger.log("Formulaire (modification) : " + form.getEditUrl());
  Logger.log("Feuille des réponses : " + ss.getUrl());
}
