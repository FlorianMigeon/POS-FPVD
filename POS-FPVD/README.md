# Catalogue POS — FPVD

Catalogue interactif des objets promotionnels et publicitaires du groupe, à usage interne
(commerciaux et administration des ventes).

## Fonctionnalités

- **Consultation** de l'ensemble des articles, avec filtrage par marque et recherche libre
  (nom, sous-élément, code article).
- **Catalogue PDF** : le bouton « Catalogue PDF » génère une version mise en page de la
  sélection en cours (une marque, une recherche, ou tout le catalogue) via la boîte de
  dialogue d'impression du navigateur → choisir « Enregistrer au format PDF ».
- **Photos** : chaque article affiche sa photo si elle existe, sinon un visuel d'attente.

## Structure du dépôt

```
data/catalogue.json     Base de données des articles (générée depuis l'Excel)
images/                 Photos des articles, nommées par code article
scripts/excel_to_json.py  Script de conversion Excel → JSON
index.html, css/, js/   L'application (site statique, aucun serveur requis)
```

## Ajouter les photos

Déposer les photos dans le dossier `images/`, nommées avec le **code article** :

```
images/71302.jpg
images/PROMO169.png
```

Formats acceptés : `.jpg`, `.png`, `.webp`. Les articles sans photo (ou sans code article
pour l'instant) affichent automatiquement le visuel d'attente.

## Mettre à jour les données

À chaque nouvelle version du fichier Excel « Point POS » :

```bash
pip install openpyxl   # une seule fois
python3 scripts/excel_to_json.py chemin/vers/Point_POS.xlsx
```

Le script régénère `data/catalogue.json`. Il lit les colonnes A à M de la première
feuille (Marque, POS, Sous-élément, Commentaires, UVC, Visuel, PR, PV, Dernier
Fournisseur, Appartenance, Dépôt, Code Article, Service). Toutes les colonnes sont
conservées dans le JSON, mais l'interface n'affiche que la vue commerciale : visuel,
marque, nom, sous-élément, UVC, prix de vente et code article.

Committer puis pousser le JSON (et les nouvelles photos) : le site en ligne est à jour.

## Publication (GitHub Pages)

Dans les réglages du dépôt GitHub : **Settings → Pages → Source : Deploy from a branch**,
choisir la branche principale et le dossier `/ (root)`. Le catalogue est alors accessible
à l'adresse `https://<utilisateur>.github.io/POS-FPVD/`.

> Pour le consulter en local, lancer un petit serveur dans le dossier du projet :
> `python3 -m http.server` puis ouvrir <http://localhost:8000> (l'ouverture directe du
> fichier `index.html` est bloquée par le navigateur pour le chargement du JSON).
