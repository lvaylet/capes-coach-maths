# Service d'évaluation Gemini et ingénierie du prompt jury CAPES

Status: resolved

## Objectif

Développer le service d'évaluation communiquant avec l'API Gemini multimodal pour analyser les images d'énoncés et de copies, et générer le rapport structuré selon les critères officiels du CAPES de Mathématiques.

## Critères d'acceptation

- [x] Configuration client Gemini avec modèle sélectionnable (ex: `gemini-2.5-flash`) et gestion de la clé API (BYOK).
- [x] Prompt système expert ancré dans les rapports récents du jury du CAPES (Épreuve 1 disciplinaire / Épreuve 2 disciplinaire appliquée).
- [x] Analyse multimodale avec support de plusieurs images d'énoncé et de copie.
- [x] Parsing et validation du format structuré du rapport en JSON strict.
- [x] Tests unitaires vérifiant la construction du prompt et l'inclusion des règles d'or.

## Comments

- Service implémenté dans `src/services/gemini.ts`.
- Tests unitaires validés dans `src/services/gemini.test.ts`.
