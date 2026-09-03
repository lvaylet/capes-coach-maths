# Architecture PWA Local-First avec clé API utilisateur (BYOK)

L'application est conçue comme une Progressive Web App (PWA) fonctionnant entièrement côté client (local-first). Les énoncés, copies numérisées, rapports de correction et historiques sont persistés localement dans le navigateur (IndexedDB), et les appels à l'API Gemini sont effectués directement avec la clé API fournie par le candidat.

Cette approche élimine tout coût d'infrastructure serveur, garantit la confidentialité absolue des copies manuscrites du candidat, et permet une utilisation immédiate sans création de compte sur mobile comme sur ordinateur, au prix de l'absence de synchronisation automatique native entre plusieurs appareils distincts.
