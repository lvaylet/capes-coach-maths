/**
 * Façade de rétrocompatibilité réexportant le pipeline d'ingestion et ses utilitaires
 */
export * from "./image/index";
export { blobVersBase64 as blobToBase64 } from "./image/canvasProcessor";
