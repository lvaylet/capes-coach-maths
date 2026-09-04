# Architecture Ports & Adapters pour le module d'évaluation (ExaminateurJury)

Le service d'évaluation et de remédiation par le jury du CAPES est structuré selon le motif architectural Ports & Adapters (_Hexagonal Architecture_) autour d'une interface unique `ExaminateurJury`.

Deux adaptateurs satisfont ce _seam_ :

1. `GeminiExaminateurAdapter` : Adaptateur de production s'appuyant sur le SDK officiel `@google/generative-ai` pour orchestrer les requêtes multimodales vers Gemini avec nettoyage et parsing JSON résilient aux balises Markdown.
2. `FakeExaminateurAdapter` : Adaptateur simulé configurable fournissant des rapports de correction réalistes conformes aux critères du CAPES sans appel réseau, servant à la suite de tests automatisés et au mode démonstration hors-ligne lorsque le candidat n'a pas encore renseigné de clé API.

Ce choix permet d'isoler entièrement la logique métier de l'évaluation vis-à-vis du transport réseau, d'éliminer tout recours à des mocks fragiles de `globalThis.fetch` dans les tests, et de garantir une exécution instantanée, déterministe et gratuite de la suite de tests.
