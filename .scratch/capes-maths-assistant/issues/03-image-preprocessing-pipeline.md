# Pipeline de capture et prétraitement d'images côté client

Status: resolved

## Objectif

Créer le module de traitement d'images permettant la sélection multi-fichiers, la prise de photo mobile, la rotation à 90°, la compression automatique et le réordonnancement des pages.

## Critères d'acceptation

- [x] Fonctions pures de rotation et redimensionnement d'image via Canvas API.
- [x] Compression adaptative pour respecter les limites recommandées pour l'API Gemini tout en conservant une lisibilité mathématique irréprochable.
- [x] Composant de gestion multi-pages avec vignettes, réorganisation et rotation individuelle.
- [x] Utilitaires d'encodage base64 pour l'API multimodale.

## Comments

- Module Canvas implémenté dans `src/utils/image.ts` avec gestion des angles 0°, 90°, 180°, 270°.
- Composant `src/components/ImageUploader.tsx` permettant la sélection de fichiers, la prise de vue directe caméra mobile, la rotation et la réorganisation par déplacement séquentiel.
