# Seam de configuration du Candidat et stockage BYOK (ParametresRepository)

La persistance, la récupération, la validation et la réinitialisation des paramètres du candidat (clé API Gemini "Bring Your Own Key", modèle d'évaluation, consignes spécifiques) sont encapsulées derrière l'interface `ParametresRepository` (`src/parametres/`).

## Contexte et Problématique

Dans l'état initial :

1. **Couplage direct avec le stockage navigateur** : Le composant racine [`App.tsx`](file:///home/lvaylet/workspace/github.com/lvaylet/capes-coach-maths/src/App.tsx) interagissait directement avec `localStorage` via la clé `"capes_maths_parametres"` et des appels impératifs `JSON.parse` et `JSON.stringify`.
2. **Vulnérabilité aux corruptions** : Un contenu `localStorage` altéré ou corrompu n'était intercepté que par un bloc `catch {}` vide, sans validation de schéma ni garanties sur les types des champs retournés.
3. **Difficulté de test et de simulation** : Tester les transitions d'état dépendantes de la configuration ou du mode simulation (sans clé API) nécessitait de manipuler les variables globales d'environnement.
4. **Non-respect du vocabulaire métier** : Le modal de paramétrage contenait des mentions non conformes au glossaire ([`CONTEXT.md`](file:///home/lvaylet/workspace/github.com/lvaylet/capes-coach-maths/CONTEXT.md)), telles que "Assistant" et "Modèle d'IA".

## Décisions d'Architecture

1. **Interface `ParametresRepository`** :
   Définit un contrat unique masquant le support de persistance :
   - `chargerParametres(): ParametresCandidat`
   - `sauvegarderParametres(params: ParametresCandidat): void`
   - `reinitialiserParametres(): ParametresCandidat`
   - `validerCleApi(cle: string): ResultatValidationCle`
   - `obtenirValeursParDefaut(): ParametresCandidat`

2. **Adaptateurs** :
   - `LocalStorageParametresRepository` : adaptateur de production résistant aux corruptions, assurant le nettoyage des entrées et le stockage local sécurisé.
   - `InMemoryParametresRepository` : adaptateur léger en mémoire pour les suites de tests unitaires, l'exécution hors-navigateur et les scénarios de démonstration isolés.

3. **Hook React `useParametresCandidat`** :
   Encapsule l'état réactif et connecte de manière transparente les composants d'interface au repository sans couplage impératif.

4. **Conformité stricte au domaine ([`CONTEXT.md`](file:///home/lvaylet/workspace/github.com/lvaylet/capes-coach-maths/CONTEXT.md))** :
   Harmonisation des libellés dans [`SettingsModal.tsx`](file:///home/lvaylet/workspace/github.com/lvaylet/capes-coach-maths/src/components/SettingsModal.tsx) ("Réglages du Candidat & API", "Modèle de l'Examinateur").
