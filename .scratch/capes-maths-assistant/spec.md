# Spécification : Assistant de préparation au CAPES de Mathématiques

Status: ready-for-agent

## Problem Statement

Les candidats préparant le CAPES de Mathématiques s'entraînent régulièrement sur des énoncés de concours ou d'exercices universitaires et rédigent leurs solutions de manière manuscrite. Obtenir des corrections individualisées, rapides et exigeantes — conformes aux attentes pointilleuses des jurys de concours (fond mathématique irréprochable et forme rédactionnelle impeccable) — est difficile sans tuteur humain. Les candidats ont besoin d'un outil mobile et web leur permettant de photographier énoncé et copie manuscrite, puis d'obtenir un rapport de correction sévère, rigoureux et constructif simulant un membre du jury, complété par une proposition de rédaction modèle et un échange interactif de remédiation.

## Solution

Une application PWA réactive, 100% *local-first*, développée avec Vite, React, TypeScript, Tailwind CSS, Dexie.js (IndexedDB) et le SDK Google Gemini. L'application permet :
1. De capturer ou téléverser plusieurs photos (ou PDF) d'un énoncé et d'une copie manuscrite.
2. D'effectuer un prétraitement côté client (rotation 90°, recadrage, compression automatique, réordonnancement des pages).
3. D'évaluer la copie via un modèle Gemini multimodal (ex: `gemini-2.5-flash`) incarnant un examinateur du jury du CAPES (tenant compte des rapports de jury et de l'épreuve cible : Épreuve 1 ou Épreuve 2).
4. De restituer un rapport de correction structuré avec rendu KaTeX (Transcription OCR de contrôle, Synthèse & Verdict, Analyse du Fond, Analyse de la Forme, Rédaction Modèle exemplaire).
5. De poursuivre l'apprentissage via un fil de remédiation interactif.
6. De gérer son historique de sessions d'entraînement par domaine mathématique avec export Markdown/PDF.

## User Stories

1. En tant que candidat, je veux pouvoir saisir et enregistrer ma clé API Gemini dans l'application, afin que mes requêtes soient traitées directement sans passer par un serveur tiers.
2. En tant que candidat, je veux téléverser ou prendre en photo les pages d'un énoncé, afin de définir le contexte exact du travail à évaluer.
3. En tant que candidat, je veux téléverser ou prendre en photo les pages de ma copie manuscrite, afin de soumettre ma démonstration.
4. En tant que candidat, je veux pouvoir faire pivoter de 90° chaque photo et réorganiser l'ordre des pages, afin de corriger les mauvaises orientations de capture sur smartphone.
5. En tant que candidat, je veux choisir le contexte d'épreuve (Épreuve 1 - Mathématiques générales, Épreuve 2 - Mathématiques appliquées et didactique, ou Auto-détection), afin d'adapter les exigences de correction du jury.
6. En tant que candidat, je veux que l'application compresse les images localement avant envoi, afin d'accélérer l'analyse et de minimiser le transfert de données.
7. En tant que candidat, je veux consulter la transcription synthétique déchiffrée par l'IA, afin de vérifier qu'aucune ambiguïté d'écriture manuscrite n'a faussé le jugement.
8. En tant que candidat, je veux visualiser une analyse détaillée du Fond (rigueur des théorèmes, hypothèses vérifiées, cohérence logique), afin d'identifier mes erreurs mathématiques.
9. En tant que candidat, je veux visualiser une analyse détaillée de la Forme (quantification, connecteurs logiques, propreté, pédagogie), afin de respecter scrupuleusement les exigences des rapports de jury.
10. En tant que candidat, je veux lire une Rédaction Modèle rédigée en KaTeX, afin d'observer la démonstration idéale attendue par le jury.
11. En tant que candidat, je veux échanger avec l'examinateur IA via une zone de remédiation interactive, afin de clarifier une critique ou approfondir un point de cours.
12. En tant que candidat, je veux catégoriser chaque session par domaine mathématique (Algèbre, Analyse, Géométrie, Probabilités/Stats), afin de suivre mes révisions par thème.
13. En tant que candidat, je veux pouvoir exporter un rapport de correction en Markdown ou l'imprimer en PDF, afin de relire mes fiches de correction hors ligne.
14. En tant que candidat, je veux retrouver l'ensemble de mes sessions d'entraînement précédentes conservées localement dans IndexedDB, afin de mesurer ma progression sans dépendre d'un compte en ligne.

## Implementation Decisions

- **Framework & Bundler** : Vite + React 19 + TypeScript + Tailwind CSS pour une application web/PWA ultra-rapide, statique et entièrement exécutable côté client.
- **Persistance** : Dexie.js pour la gestion d'IndexedDB, stockant les sessions (`id`, `date`, `domaine`, `epreuve`, `rapport`, `messagesRemediation`) et les Blobs des images d'énoncés et de copies.
- **Gestion des Clés & Paramètres** : `localStorage` pour la clé API Gemini et les préférences (modèle Gemini par défaut, consignes personnalisées de prompt).
- **Ingénierie du Prompt Jury** : Prompt système formalisant la posture d'un correcteur intransigeant du jury du CAPES de Mathématiques, intégrant les recommandations explicites des rapports de jury récents et structurant la réponse en JSON strict pour un affichage granulaire et fiable.
- **Rendu Mathématique** : KaTeX intégré via un composant React dédié pour formuler les expressions mathématiques inline (`$...$`) et display (`$$...$$`).
- **Prétraitement d'images** : Utilisation d'un utilitaire Canvas côté navigateur pour la rotation sans perte de qualité et le redimensionnement/compression adaptative en JPEG/WebP.
- **Seam de test** : Le service d'évaluation et le client Gemini acceptent une interface injectable (permettant de tester l'analyse et le parsing sans appel réel à l'API Google).

## Testing Decisions

- Tests unitaires et d'intégration avec Vitest sur les modules profonds :
  1. Module de prétraitement d'images (calcul des dimensions, compression, rotations).
  2. Module de formatage et parsing du rapport de correction du jury (validation de structure, tolérance aux blocs de code).
  3. Module de persistance Dexie (CRUD des sessions, intégrité des données).
  4. Module de rendu des formules mathématiques KaTeX.

## Out of Scope

- Synchronisation automatique cloud multi-comptes avec backend propriétaire.
- Forum ou partage communautaire de copies entre plusieurs candidats.
- Reconnaissance manuscrite temps réel au stylet sur tablette (l'accent est mis sur la photo de copies réelles sur papier).

## Further Notes

- Se conformer strictement au glossaire défini dans `CONTEXT.md` et aux décisions architecturales consignées dans `docs/adr/`.
