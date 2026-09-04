# Orchestrateur de domaine pour la Session d'entraînement (useSessionDEntrainement)

Le cycle de vie complet de la _Session d'entraînement_ (édition des métadonnées, soumission de l'énoncé et de la copie manuscrite, évaluation par le jury, échanges interactifs de remédiation et synchronisation de l'historique) est unifié au sein d'un module profond d'orchestration (`src/session/`).

## Contexte et Problématique

Précédemment, le composant racine `App.tsx` (500 lignes) concentrait 12 variables d'état distinctes (`useState`) et pilotait impérativement l'ensemble du flux :

1. **Dispersion d'état** : La réinitialisation d'une session ou le chargement d'un élément d'historique imposait de manipuler 8 setters indépendants, multipliant les risques de désynchronisation.
2. **Fuite de la persistance** : `App.tsx` assemblait manuellement les entités de domaine (`SessionDEntrainement`, `Enonce`, `Copie`, `MessageRemediation`) et déclenchait directement les écritures dans Dexie, sans seam d'orchestration.
3. **Absence de tests d'intégration** : Ce parcours utilisateur central était totalement dépourvu de tests automatisés car indissociable du composant React `App.tsx`.

## Décisions d'Architecture

1. **Machine d'états pure (`sessionReducer`)** :
   Modélise de façon déterministe et immuable toutes les transitions d'état d'une session (`SET_TITRE`, `DEBUT_EVALUATION`, `SUCCES_EVALUATION`, `DEBUT_REMEDIATION`, `CHARGER_SESSION`, `REINITIALISER_SESSION`), totalement découplée de React et du DOM.
2. **Coordonnateur asynchrone (`SessionCoordinator`)** :
   Classe de domaine pure reliant l'état aux deux _seams_ existants : `ExaminateurJury` (Ports & Adapters) et `SessionRepository` (IndexedDB). Elle garantit les invariants métier (copie obligatoire avant évaluation, rapport requis pour la remédiation) et orchestre la persistance automatique à chaque étape franchie.
3. **Hook de domaine (`useSessionDEntrainement`)** :
   Façade ergonomique pour React exposant un état consolidé et des actions typées, réduisant `App.tsx` à un rôle de vue déclarative.
4. **Testabilité unitaire à 100%** :
   L'orchestrateur est validé dans Vitest en combinant `FakeExaminateurAdapter` et `InMemorySessionRepository`, sans recours au DOM ni réseau.
