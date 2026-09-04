import type { TelechargeurFichier } from "./types";

/**
 * Adaptateur de production exploitant les API natives du navigateur (DOM & Clipboard)
 */
export class BrowserTelechargeur implements TelechargeurFichier {
  async telechargerFichier(
    contenu: string,
    nomFichier: string,
    typeMime: string = "text/markdown;charset=utf-8;"
  ): Promise<void> {
    if (typeof document === "undefined" || typeof URL === "undefined") {
      return;
    }

    const blob = new Blob([contenu], { type: typeMime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nomFichier;

    // Déclencher le téléchargement
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Révocation propre de la ressource mémoire
    URL.revokeObjectURL(url);
  }

  async copierTexte(texte: string): Promise<boolean> {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      try {
        await navigator.clipboard.writeText(texte);
        return true;
      } catch (err) {
        console.warn(
          "Impossible de copier dans le presse-papier via Clipboard API :",
          err
        );
      }
    }
    return false;
  }
}

export interface MockTelechargeurOptions {
  simulerEchecCopie?: boolean;
}

/**
 * Adaptateur simulé pour l'environnement de test (Vitest / Node.js)
 * Enregistre les interactions d'exportation pour validation déterministe
 */
export class MockTelechargeur implements TelechargeurFichier {
  readonly appelsTelechargement: Array<{
    contenu: string;
    nomFichier: string;
    typeMime: string;
  }> = [];

  readonly appelsCopie: string[] = [];

  constructor(private options: MockTelechargeurOptions = {}) {}

  async telechargerFichier(
    contenu: string,
    nomFichier: string,
    typeMime: string = "text/markdown;charset=utf-8;"
  ): Promise<void> {
    this.appelsTelechargement.push({ contenu, nomFichier, typeMime });
  }

  async copierTexte(texte: string): Promise<boolean> {
    if (this.options.simulerEchecCopie) {
      return false;
    }
    this.appelsCopie.push(texte);
    return true;
  }
}
