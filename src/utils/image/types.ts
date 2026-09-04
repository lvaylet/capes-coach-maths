import type { PageImage } from "../../types/domain";

export const TYPES_MIME_IMAGES_ACCEPTES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type TypeMimeImageAccepte = (typeof TYPES_MIME_IMAGES_ACCEPTES)[number];

export interface OptionsPretraitement {
  maxDimension?: number; // Défaut: 2048px (optimal pour la lisibilité mathématique et l'évaluation)
  qualiteJpeg?: number; // Défaut: 0.85
}

export interface ImagePrepareeApi {
  mimeType: string;
  data: string; // Base64 brut sans en-tête data:...
}

export type ResultatValidationFichier =
  | { valide: true; typeMime: TypeMimeImageAccepte }
  | { valide: false; erreur: string };

/**
 * Interface abstraisant le traitement graphique Canvas et l'encodage Base64
 * Permet une exécution en production (DOM Canvas) et des tests unitaires déterministes (Mock)
 */
export interface CanvasProcessor {
  traiterImage(
    blob: Blob,
    angleDegres: number,
    options?: OptionsPretraitement
  ): Promise<Blob>;
  blobVersBase64(blob: Blob): Promise<string>;
}

/**
 * Pipeline centralisant l'ingestion, la validation, la rotation, la libération mémoire
 * et la préparation API des pages de copies manuscrites et d'énoncés.
 */
export interface ImageIngestionPipeline {
  validerFichier(
    file: File | Blob,
    nomFichier?: string
  ): ResultatValidationFichier;
  ingererFichier(file: File, ordre: number): Promise<PageImage>;
  ingererFichiers(files: File[], ordreInitial?: number): Promise<PageImage[]>;
  pivoterPage(page: PageImage, angleIncrement?: number): PageImage;
  libererPage(page: PageImage): void;
  libererPages(pages: PageImage[]): void;
  preparerPourApi(
    page: PageImage,
    options?: OptionsPretraitement
  ): Promise<ImagePrepareeApi>;
}
