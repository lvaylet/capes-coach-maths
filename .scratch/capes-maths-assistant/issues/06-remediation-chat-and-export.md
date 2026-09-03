# Module de remédiation interactive, historique et export

Status: resolved

## Objectif

Implémenter la messagerie interactive de remédiation pour continuer la discussion avec l'examinateur, la vue d'historique filtrable par domaine mathématique, et la fonction d'export Markdown / impression PDF.

## Critères d'acceptation

- [x] Fil de remédiation interactif permettant au candidat de poser des questions et d'obtenir des explications complémentaires de Gemini sur sa copie.
- [x] Liste des sessions d'entraînement passées avec filtres par domaine (Algèbre, Analyse, etc.).
- [x] Bouton d'export Markdown et impression PDF propre.
- [x] Écran de configuration pour gérer la clé API Gemini et les préférences du prompt.

## Comments

- `src/components/RemediationChat.tsx` avec suggestions rapides et rendu KaTeX.
- `src/components/HistoryDrawer.tsx` avec filtrage par domaine mathématique et gestion des suppressions.
- `src/components/SettingsModal.tsx` avec champ de clé masqué, test et choix de modèle.
- Export Markdown et déclencheur d'impression intégrés dans `ReportViewer.tsx`.
