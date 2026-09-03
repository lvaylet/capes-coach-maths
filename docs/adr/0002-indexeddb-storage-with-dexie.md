# Stockage local des images et sessions avec Dexie.js (IndexedDB)

Les captures d'énoncés et de copies manuscrites (pouvant comporter plusieurs mégaoctets d'images par session) ainsi que les rapports de correction et historiques sont persistés localement dans le navigateur via IndexedDB avec la bibliothèque Dexie.js.

Ce choix évite les limites strictes de capacité de stockage de `localStorage` (environ 5 Mo) en tirant parti du quota étendu d'IndexedDB pour les données binaires (Blobs d'images), tout en offrant une interface de requêtage typée en TypeScript sans nécessiter de backend de base de données.
