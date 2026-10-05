**Français** | [English](README.en.md)

# SOMA — Solar Map

Cartographie collaborative des installations solaires hors réseau en Afrique.

Les techniciens et installateurs déclarent les installations qu'ils posent ou entretiennent. SOMA agrège ces déclarations pour rendre visible un parc aujourd'hui largement non recensé.

> Statut : en développement — MVP en cours.

## Pourquoi

Les installations solaires hors réseau se comptent par millions, mais leur localisation, leur puissance et leur état réel sont mal connus. Cette absence de données freine la planification publique, le ciblage des financements et le service après-vente.

## Données déclarées

| Champ | Description |
|---|---|
| Localisation | Coordonnées GPS (stockées, jamais publiées à l'adresse exacte) |
| Puissance | Puissance crête des panneaux (Wc), capacité batterie |
| Type | Kit domestique, usage productif, pompage, institutionnel… |
| Équipements | Marques et modèles (panneaux, régulateur, onduleur, batterie) |
| État | En service, en panne, hors service |
| Date | Installation, dernière intervention |

## Ce que reçoit le contributeur

- Un registre gratuit de ses installations et de leur historique d'intervention.
- Des rappels de maintenance.
- Une visibilité sur la carte publique (s'il le souhaite) auprès des clients et partenaires.

## Accès

| Utilisateur | Accès | Coût |
|---|---|---|
| Technicien indépendant | Registre personnel, carte publique | Gratuit |
| Entreprise d'installation | Tableau de bord du parc, gestion multi-techniciens | Abonnement |
| Fabricant, distributeur | Répartition du parc par équipement et par zone | Abonnement ou rapport ponctuel |
| Gouvernement, bailleur | Données agrégées par zone, rapports d'électrification | Licence de données |

## Politique de données

- **Consentement** : chaque installation est déclarée avec l'accord du propriétaire.
- **Propriété** : chaque contributeur garde la maîtrise de ses déclarations et peut les exporter ou les retirer.
- **Neutralité** : aucun acteur, y compris les fondateurs du projet, n'a d'accès privilégié aux données déclarées par des tiers. Les données d'un installateur ne sont jamais transmises nominativement à un autre.
- **Carte publique** : uniquement des données agrégées par zone (aucune position exacte, aucun nom).
- **Données agrégées avancées** : accès payant, sous conditions d'utilisation distinctes de la licence du code.
- **Conformité** : traitement conforme à la réglementation sur les données personnelles des pays couverts.

La licence AGPL-3.0 couvre le code, pas les données. Les données relèvent de cette politique.

## Périmètre du MVP

- Formulaire de déclaration mobile.
- Carte basée sur Google Maps.
- Export des données du contributeur.

## Structure du dépôt

```
soma/
├── app/            # Formulaire de déclaration et carte
├── api/            # Collecte et agrégation
├── data-policy/    # Politique de données et conditions d'accès
├── docs/
├── README.md
├── README.en.md
├── LICENSE
└── CONTRIBUTING.md
```

## Contribuer

Deux types de contribution : du code, et des déclarations d'installations. Les contributeurs de code signent un accord de contribution (CLA) avant la première fusion. Voir [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

Code sous licence [AGPL-3.0](LICENSE). Licence commerciale disponible sur demande. Contact : weareoshu.project@gmail.com.

## Projet

Fait partie de [OSHU — Open Solar Hub](https://github.com/oshu-africa).

---

© 2026 ON-Tech. Titulaire des droits sur le code.
