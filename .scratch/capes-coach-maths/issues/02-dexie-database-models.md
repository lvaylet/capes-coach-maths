# Modèles de données et persistance IndexedDB avec Dexie.js

Status: resolved

## Objectif

Implémenter la couche de données locale basée sur Dexie.js pour stocker les sessions d'entraînement, les images d'énoncés et de copies, et les préférences de l'utilisateur.

## Critères d'acceptation

- [x] Schéma Dexie avec tables pour les `sessions` et les `images` (Blobs).
- [x] Typage TypeScript strict pour `SessionDEntrainement`, `Enonce`, `Copie`, `RapportDeCorrection`, `MessageRemediation`.
- [x] Fonctions CRUD avec tests unitaires vérifiant la persistance et la récupération des sessions.

## Comments

- Schéma `CapesCoachMathsDB` implémenté dans `src/db/db.ts` avec support des Blobs d'images volumineux.
- Fonctions `sauvegarderSession`, `chargerSession`, `listerSessions` et `supprimerSession` opérationnelles.
- Tests unitaires validés dans `src/db/db.test.ts`.
