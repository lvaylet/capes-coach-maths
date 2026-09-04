# Pipeline unifié d'ingestion et prétraitement d'images (ImageIngestionPipeline)

Le prétraitement et la gestion des images de copies manuscrites et d'énoncés (validation de formats, aperçus, rotations, cycle de vie mémoire et encodage Base64 pour l'évaluation multimodale) sont unifiés derrière une interface de domaine `ImageIngestionPipeline`.

## Contexte et Problématique

Précédemment, la manipulation d'images reposait sur des utilitaires dispersés manipulant directement l'élément `HTMLCanvasElement` et `URL.createObjectURL` :

1. **Fuites mémoire** : Les Object URLs allouées pour les aperçus n'étaient jamais révoquées lors de la suppression ou du remplacement des pages dans l'interface.
2. **Échecs silencieux sur les PDF** : L'attribut `accept` acceptait les fichiers `.pdf`, mais l'instanciation de `new Image()` avec un Blob PDF échoue silencieusement dans le Canvas du navigateur.
3. **Déficit de couverture de tests** : La dépendance directe à l'API Canvas du navigateur empêchait l'exécution de tests unitaires automatisés dans l'environnement Node.js/Vitest sans bibliothèques binaires natives lourdes.

## Décisions d'Architecture

1. **Seam `ImageIngestionPipeline`** : Centralise la validation stricte, l'ingestion (`PageImage`), le calcul de rotation normalisé (modulo 360°), la libération explicite de la mémoire (`libererPage`) et la préparation optimisée pour l'API (`preparerPourApi`).
2. **Abstraction `CanvasProcessor`** :
   - `BrowserCanvasProcessor` : implémentation de production exploitant l'API standard Canvas du navigateur pour le redimensionnement (2048px max) et la compression JPEG (0.85).
   - `MockCanvasProcessor` : implémentation simulée déterministe permettant une couverture de test unitaire à 100% dans Vitest sans dépendance DOM.
3. **Restriction stricte aux formats matriciels** : Seuls les formats JPEG, PNG et WebP sont autorisés. Les fichiers PDF sont formellement rejetés à l'ingestion avec un message d'explication clair invitant le candidat à fournir des images ou à photographier son travail.
4. **Injection de dépendance** : L'adaptateur d'évaluation `GeminiExaminateurAdapter` reçoit `ImageIngestionPipeline` par injection, déléguant la conversion multimodale sans dépendre directement d'utilitaires graphiques bas niveau.
