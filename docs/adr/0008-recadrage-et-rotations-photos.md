# Recadrage et rotations destructives côté client

Le recadrage et la rotation des pages (copies manuscrites et énoncés) sont appliqués directement côté client par le pipeline d'ingestion pour régénérer un nouveau Blob JPEG optimisé, plutôt que de conserver des coordonnées de découpe non-destructives dans IndexedDB.

## Contexte et Problématique

Les candidats photographient souvent leurs copies manuscrites posées sur une table ou dans des orientations arbitraires selon les capteurs de smartphones. La manipulation d'images haute résolution brutes (souvent 5 à 15 Mo par cliché) dans le stockage local IndexedDB d'une PWA entraîne rapidement une saturation de la mémoire vive et du quota de stockage du navigateur.

## Décision

1. **Génération directe d'un nouveau Blob optimisé** : Lors de la validation du recadrage et de l'orientation dans l'interface, le processeur graphique Canvas extrait la région utile sélectionnée, applique la rotation angulaire modulo 360°, et produit un nouveau Blob JPEG compressé (qualité 0.85, dimension maximale 2048px).
2. **Cycle de vie et libération mémoire** : L'ancienne Object URL d'aperçu est immédiatement révoquée via `URL.revokeObjectURL` pour éviter toute fuite mémoire, et l'angle de rotation de la page est réinitialisé à 0° puisque la rotation est incrustée dans le nouveau raster.
3. **Absence de dépendance externe** : L'interaction de recadrage (`RecadrageModal`) repose sur l'API native `PointerEvents` avec capture de pointeur, assurant un support tactile fluide sur smartphone sans alourdir le bundle applicatif.
