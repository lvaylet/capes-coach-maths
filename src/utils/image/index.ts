export * from "./types";
export * from "./canvasProcessor";
export * from "./pipeline";

import type { CanvasProcessor, ImageIngestionPipeline } from "./types";
import { DefaultImageIngestionPipeline } from "./pipeline";

/**
 * Fabrique pour instancier un pipeline d'ingestion d'images,
 * avec possibilité d'injecter un CanvasProcessor personnalisé (ex: MockCanvasProcessor pour les tests).
 */
export function creerPipelineImages(
  canvasProcessor?: CanvasProcessor
): ImageIngestionPipeline {
  return new DefaultImageIngestionPipeline(canvasProcessor);
}

/**
 * Instance singleton du pipeline pour l'environnement de production standard
 */
export const imagePipeline: ImageIngestionPipeline = creerPipelineImages();
