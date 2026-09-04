# Stockage local des images et sessions avec Dexie.js (IndexedDB)

Les captures d'énoncés et de copies manuscrites (pouvant comporter plusieurs mégaoctets d'images par session) ainsi que les rapports de correction et historiques sont persistés localement dans le navigateur via IndexedDB avec la bibliothèque Dexie.js.

Ce choix évite les limites strictes de capacité de stockage de `localStorage` (environ 5 Mo) en tirant parti du quota étendu d'IndexedDB pour les données binaires (Blobs d'images), tout en offrant une interface de requêtage typée en TypeScript sans nécessiter de backend de base de données.

Afin de préserver la testabilité unitaire et d'éviter tout couplage direct avec l'API IndexedDB du navigateur, l'accès aux données est encapsulé derrière l'interface `SessionRepository` (Ports & Adapters). Deux adaptateurs satisfont ce contrat :

- `DexieSessionRepository` : implémentation de production basée sur Dexie.js assurant la persistance durable et la cascade de suppression des images.
- `InMemorySessionRepository` : implémentation en mémoire sans dépendance de navigateur pour les suites de tests unitaires ultra-rapides.

Tous les enregistrements sont rigoureusement typés avec les entités de domaine (`DomaineMathematique`, `Epreuve`, `RapportDeCorrection`, `MessageRemediation`), éliminant tout usage du type `any`.
