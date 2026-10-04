# R113-Client-serveur

TP interactif (BUT MMI1 — R1.13 Hébergement) : **TP2 Visualisation du modèle
client/serveur et des échanges HTTP**. Analyse d'une URL, rôle du DNS et des
ports, puis observation des requêtes et réponses HTTP (codes de statut,
en-têtes `User-Agent` et `Content-Type`, cookies) dans l'onglet « Réseau »
des outils de développement du navigateur.

## Utiliser ce TP en tant qu'étudiant·e

1. Ouvrir `index.html` dans un navigateur (double-clic suffit, pas besoin de
   serveur local).
2. Suivre l'ordre du menu : Préparation → URL, DNS, ports → HTTP → Livrable.
   Le Mémo rassemble ports, codes de statut, en-têtes et raccourcis.
3. S'entraîner dans les simulateurs, puis faire les observations du sujet
   dans son vrai navigateur et son vrai terminal (captures du livrable).

Les réponses, la progression, l'identité et les captures sont enregistrées
dans le navigateur (`localStorage`, préfixe `clientserveur-`, distinct de
celui du TP1) : rien n'est envoyé.

## Utiliser ce dépôt en tant qu'enseignant·e

Activer GitHub Pages sur la branche `main` (dossier racine) pour obtenir un
lien cliquable à distribuer.

## Éléments interactifs

- **Préparation** : raccourci des outils de développement selon le
  navigateur et le système (détectés automatiquement), cartes sur l'onglet
  Réseau.
- **URL décortiquée** (protocole, sous-domaine, domaine, port, chemin,
  paramètres) et **quiz des ports**.
- **Schéma animé pas à pas** : DNS, connexion sur le port 443, requête GET,
  réponse 200.
- **Terminal `ping` / `nslookup` simulé** sur des domaines d'exemple en
  `.test` et des adresses IP de documentation (RFC 5737) ; pour un vrai
  domaine, il renvoie vers le vrai terminal.
- **Faux navigateur avec onglet « Réseau »** : bouton Effacer, requêtes et
  codes 200 / 301 / 404, en-têtes de requête et de réponse (avec le vrai
  `User-Agent` de l'étudiant·e), `Set-Cookie` puis `Cookie` sur une boutique
  d'exemple. Six actions cochées automatiquement.
- **Décodeur de User-Agent** et cartes des familles de codes de statut.
- **Livrable** : prénom et nom (verrouillés dès le premier PDF), deux
  captures JPG, réponses Q1 à Q10 (ni sélection, ni copie, ni collage), puis
  **compte rendu PDF** verrouillé, avec la même mise en page que le
  certificat des exercices de `bases_de_js`, mention « INCOMPLET » s'il manque
  un élément.
- **Mémo** filtrable et quiz.

## Structure

```
R113-Client-serveur/
├── index.html         Accueil : objectif, compétence, déroulé
├── preparation.html   Configuration du navigateur (outils de développement)
├── partie1.html       Partie 1 : URL, DNS et ports (Q1 à Q5)
├── partie2.html       Partie 2 : la communication HTTP (Q6 à Q10)
├── livrable.html      Livrable : identité, captures JPG, réponses, PDF
├── memo.html          Vocabulaire, ports, codes, en-têtes, raccourcis
├── css/style.css      Feuille de style partagée (thème clair / sombre)
├── img/               Logos IUT et MMI, icône « Effacer » du sujet
└── js/
    ├── main.js            Navigation, étapes, stockage, cartes
    ├── partie1.js         URL, quiz des ports, schéma animé, terminal DNS
    ├── partie2.js         Faux navigateur + onglet Réseau, User-Agent
    ├── livrable.js        Identité, captures, réponses Q1 à Q10
    ├── compte-rendu.js    Génération du compte rendu PDF (jsPDF)
    ├── certificat-logos.js  Logos du PDF en base64 (comme bases_de_js)
    ├── memo.js            Filtre, copie, quiz
    └── vendor/            jsPDF (licence MIT, jspdf.LICENSE.txt)
```

## Licence

Support pédagogique libre de réutilisation et d'adaptation dans un cadre
d'enseignement.
