import type { RapportDeCorrection } from "../types/domain";

/**
 * Seam d'interaction avec les API de téléchargement et du presse-papier du navigateur.
 * Permet d'isoler les effets de bord DOM pour une testabilité unitaire totale.
 */
export interface TelechargeurFichier {
  telechargerFichier(
    contenu: string,
    nomFichier: string,
    typeMime?: string
  ): Promise<void>;
  copierTexte(texte: string): Promise<boolean>;
}

/**
 * Interface du module profond FormateurRapport.
 * Centralise la mise en forme textuelle, la synthèse Markdown et la distribution
 * des rapports d'évaluation du jury du CAPES.
 */
export interface FormateurRapport {
  genererMarkdown(rapport: RapportDeCorrection, titreSession?: string): string;
  genererNomFichier(titreSession?: string, extension?: string): string;
  telechargerMarkdown(
    rapport: RapportDeCorrection,
    titreSession?: string
  ): Promise<void>;
  copierDansPressePapier(
    rapport: RapportDeCorrection,
    titreSession?: string
  ): Promise<boolean>;
}
