# Prépa CAPES Maths - Correcteur Virtuel du Jury

Application web et mobile (PWA) 100% _local-first_, conçue pour aider les candidats à préparer le **CAPES de Mathématiques**.

Elle permet de photographier ou d'importer un énoncé d'exercice ainsi que sa copie manuscrite, puis de soumettre l'ensemble à l'examinateur virtuel **Google Gemini** incarnant un membre intransigeant du jury officiel du concours.

---

## Sommaire

- [Points Forts & Fonctionnalités](#points-forts--fonctionnalités)
- [Critères du Jury du CAPES](#critères-du-jury-du-capes)
- [Architecture Technique](#architecture-technique)
- [Prise en Main Rapide](#prise-en-main-rapide)
- [Configuration de la Clé API](#configuration-de-la-clé-api)
- [Scripts Disponibles](#scripts-disponibles)
- [Structure du Projet](#structure-du-projet)
- [Documentation et Références](#documentation-et-références)

---

## Points Forts & Fonctionnalités

1. **Capture et Prétraitement d'Images Côté Client** :
   - Prise de vue directe depuis l'appareil photo du smartphone ou sélection de fichiers (JPEG, PNG, WebP, PDF).
   - Support **multi-pages** pour les énoncés et les copies manuscrites étendues.
   - Outil de **rotation à 90°** par page (indispensable pour redresser les photos prises sur smartphone).
   - Réordonnancement séquentiel des pages (Page 1, 2, 3...) par glisser ou flèches de déplacement.
   - Compression et redimensionnement automatique sur Canvas pour une latence minimale tout en conservant une lisibilité mathématique optimale.

2. **Évaluation Structurée & Rendu KaTeX** :
   - **Transcription OCR déchiffrée** : affichage de ce que l'examinateur a lu de votre écriture manuscrite afin d'écarter toute mélecture.
   - **Verdict & Synthèse** : appréciation globale, estimation de note / recevabilité, points forts et erreurs critiques pénalisantes.
   - **Analyse du Fond** : validité des raisonnements, exhaustivité et vérification explicite des hypothèses de théorèmes.
   - **Analyse de la Forme** : rigueur des quantificateurs ($\forall$, $\exists$), absence de variables non introduites, clarté rédactionnelle en français (proscription de l'abus de $\Rightarrow$).
   - **Rédaction Modèle** : proposition de solution rédigée selon les canons de perfection du concours, avec formules LaTeX rendues par KaTeX.

3. **Remédiation Interactive** :
   - Fil de discussion avec l'examinateur du jury après le rapport pour lever un doute, approfondir une démonstration ou demander des conseils de rédaction.
   - Suggestions de questions rapides adaptées au niveau du concours.

4. **Historique & Organisation des Révisions** :
   - Sauvegarde automatique dans le navigateur via **IndexedDB (Dexie.js)** : stockage persistant des sessions et des images sans limite contraignante de taille.
   - Classement par **domaine mathématique** (Algèbre, Analyse, Géométrie, Probabilités & Statistiques, Arithmétique).
   - Export du rapport complet en **Markdown** ou impression / export **PDF**.

5. **Confidentialité Totale (BYOK - Bring Your Own Key)** :
   - Zéro serveur backend : les images et copies restent strictement stockées sur votre appareil.
   - La clé API Gemini est enregistrée dans le `localStorage` de votre navigateur et peut être modifiée ou effacée à tout moment.

---

## Critères du Jury du CAPES

L'ingénierie de prompt s'appuie directement sur les attendus des **rapports officiels du jury du CAPES de Mathématiques** récents :

- **Rigueur de la quantification** : toute variable doit être introduite explicitement (_« Soit $x \in \mathbb{R}$ »_). Les variables muettes orphelines sont sanctionnées.
- **Bannissement des abus de symboles logiques** : l'usage des flèches $\Rightarrow$ ou $\iff$ comme connecteurs de phrases ou puces de paragraphe est proscrit. Une démonstration doit être rédigée avec des phrases complètes (_« Or... »_, _« Puisque... »_, _« On en déduit que... »_).
- **Vérification systématique des hypothèses** : citer un théorème sans prouver au préalable la réunion de toutes ses conditions ne rapporte aucun point.
- **Sélection du contexte d'épreuve** :
  - **Épreuve 1** : Épreuve disciplinaire pure (niveau universitaire L1-L3, rigueur formelle absolue).
  - **Épreuve 2** : Épreuve disciplinaire appliquée (didactique, niveau collège/lycée, programmation Python, critique de productions d'élèves).
  - **Auto-détection** : adaptation automatique selon la nature de l'énoncé.

---

## Architecture Technique

- **Frontend & Bundler** : [Vite 6](https://vite.dev/) + [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (mode strict).
- **Feuilles de style** : [Tailwind CSS v4](https://tailwindcss.com/) avec styles typographiques et mathématiques dédiés.
- **Rendu Mathématique** : [KaTeX](https://katex.org/) pour le rendu instantané des formules inline (`$...$`) et display (`$$...$$`).
- **Persistance des données** : [Dexie.js](https://dexie.org/) (wrapper typé pour IndexedDB, support natif des Blobs d'images).
- **Intelligence Artificielle** : API multimodale Google Gemini (modèle par défaut `gemini-2.5-flash`, configurable dans les réglages).
- **Tests Unitaires** : [Vitest](https://vitest.dev/).

---

## Prise en Main Rapide

### Prérequis

- Node.js version 18 ou supérieure.
- Un navigateur web moderne (Chrome, Firefox, Safari, Edge).

### Installation

```bash
# Cloner le dépôt ou se placer dans le répertoire
git clone git@github.com:lvaylet/capes-coach-maths.git
cd capes-coach-maths

# Installer les dépendances
npm install
```

### Lancement en mode développement

```bash
npm run dev
```

L'application s'ouvre localement sur `http://localhost:5173`.

---

## Configuration de la Clé API

1. Obtenez une clé d'API Google Gemini gratuitement sur [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Dans l'application, cliquez sur l'icône de roue crantée (⚙️) en haut à droite.
3. Collez votre clé dans le champ prévu et cliquez sur **Sauvegarder**.
4. _(Optionnel)_ Vous pouvez modifier le modèle (ex: `gemini-2.5-flash`, `gemini-1.5-flash`) ou ajouter des consignes personnalisées au jury.

---

## Scripts Disponibles

| Commande             | Action                                                                |
| :------------------- | :-------------------------------------------------------------------- |
| `npm run dev`        | Lance le serveur de développement Vite                                |
| `npm run build`      | Vérifie les types (`tsc`) et compile le bundle de production optimisé |
| `npm run preview`    | Prévisualise le build de production en local                          |
| `npm test`           | Exécute la suite de tests unitaires avec Vitest                       |
| `npm run test:watch` | Exécute les tests en mode écoute continue                             |

---

## Structure du Projet

```text
capes-coach-maths/
├── index.html                  # Point d'entrée HTML
├── package.json                # Dépendances et scripts
├── tsconfig.json               # Configuration TypeScript strict
├── vite.config.ts              # Configuration Vite + Tailwind v4
├── docs/
│   ├── adr/                    # Décisions d'architecture (ADR)
│   │   ├── 0001-local-first-pwa-architecture.md
│   │   ├── 0002-indexeddb-storage-with-dexie.md
│   │   └── 0003-examinateur-jury-ports-and-adapters.md
│   └── agents/                 # Conventions pour agents IA
│       ├── domain.md
│       ├── issue-tracker.md
│       └── triage-labels.md
├── .scratch/                   # Spécification et tickets de suivi
│   └── capes-coach-maths/
│       ├── spec.md
│       └── issues/
├── src/
│   ├── main.tsx                # Montant React
│   ├── App.tsx                 # Composant racine orchestrant l'application
│   ├── index.css               # Styles Tailwind et polices KaTeX
│   ├── types/
│   │   └── domain.ts           # Types stricts du modèle de domaine
│   ├── db/
│   │   ├── db.ts               # Configuration Dexie (IndexedDB) et fonctions CRUD
│   │   └── db.test.ts          # Tests de la base de données
│   ├── utils/
│   │   ├── image.ts            # Rotation Canvas, compression et conversion Base64
│   │   ├── mathParser.ts       # Découpeur pur des formules KaTeX ($ et $$)
│   │   └── mathParser.test.ts  # Tests unitaires du parser mathématique
│   ├── services/
│   │   ├── gemini.ts           # Client Gemini, prompt du jury et parsing du rapport
│   │   └── gemini.test.ts      # Tests du prompt et des critères d'épreuve
│   └── components/
│       ├── ImageUploader.tsx   # Capture, rotation et ordonnancement des pages
│       ├── KaTeXRenderer.tsx   # Affichage typographique des formules LaTeX
│       ├── ReportViewer.tsx    # Rapport structuré en 5 volets avec export
│       ├── RemediationChat.tsx # Chat interactif de remédiation avec le jury
│       ├── HistoryDrawer.tsx   # Tiroir d'historique avec filtres par domaine
│       └── SettingsModal.tsx   # Gestion de la clé API et du modèle
└── CONTEXT.md                  # Glossaire de référence du domaine
```

---

## Documentation et Références

- [CONTEXT.md](CONTEXT.md) : Glossaire exhaustif du modèle de domaine (_Candidat_, _Énoncé_, _Copie_, _Rapport de correction_, _Fond_, _Forme_, _Remédiation_, _Rédaction modèle_, etc.).
- [ADR-0001 : Architecture Local-First](docs/adr/0001-local-first-pwa-architecture.md).
- [ADR-0002 : Persistance IndexedDB avec Dexie.js](docs/adr/0002-indexeddb-storage-with-dexie.md).
- [ADR-0003 : Architecture Ports & Adapters pour l'Examinateur](docs/adr/0003-examinateur-jury-ports-and-adapters.md).
