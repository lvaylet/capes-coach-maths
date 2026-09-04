# Module de formatage et d'exportation du Rapport de correction (FormateurRapport)

La synthèse textuelle, la mise en forme Markdown, la copie dans le presse-papier et l'export de fichiers du _Rapport de correction_ sont unifiés au sein d'un module profond (`src/rapport/`).

## Contexte et Problématique

Précédemment, la génération du document Markdown et son téléchargement étaient codés en dur au sein du composant React [`ReportViewer.tsx`](file:///home/lvaylet/workspace/github.com/lvaylet/capes-coach-maths/src/components/ReportViewer.tsx) :

1. **Couplage vue / document** : Un gabarit de chaîne de 60 lignes et des manipulations impératives du DOM (`document.createElement('a')`, création de Blob, simulation de clic et révocation d'URL) étaient imbriqués dans le composant d'affichage.
2. **Absence de réutilisabilité** : Impossible de réutiliser la mise en forme textuelle pour d'autres fonctionnalités (comme la copie dans le presse-papier ou un export tiers) sans dupliquer le code.
3. **Déficit de testabilité** : Cette logique ne pouvait pas être testée de façon automatisée dans Vitest sans monter le composant React et simuler l'environnement DOM du navigateur.

## Décisions d'Architecture

1. **Interface `FormateurRapport`** :
   Expose une surface épurée pour générer la chaîne Markdown (`genererMarkdown`), slugifier et assainir le nom de fichier (`genererNomFichier`), déclencher le téléchargement local (`telechargerMarkdown`) ou copier le rapport dans le presse-papier (`copierDansPressePapier`).
2. **Seam `TelechargeurFichier`** :
   Isole les interactions de bas niveau avec les API du navigateur :
   - `BrowserTelechargeur` : implémentation de production assurant le téléchargement de Blob et l'accès à `navigator.clipboard`.
   - `MockTelechargeur` : implémentation simulée en mémoire pour les tests unitaires automatisés.
3. **Allègement de la vue** :
   [`ReportViewer.tsx`](file:///home/lvaylet/workspace/github.com/lvaylet/capes-coach-maths/src/components/ReportViewer.tsx) se concentre sur l'affichage et délègue l'export et la copie au module `FormateurRapport`.
