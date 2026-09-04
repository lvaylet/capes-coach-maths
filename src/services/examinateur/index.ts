import type { ExaminateurJury, ConfigExaminateur } from "./types";
import { FakeExaminateurAdapter } from "./fakeAdapter";
import { GeminiExaminateurAdapter } from "./geminiAdapter";

export * from "./types";
export { FakeExaminateurAdapter, FIXTURE_RAPPORT_SIMULE } from "./fakeAdapter";
export { GeminiExaminateurAdapter } from "./geminiAdapter";
export {
  construirePromptSysteme,
  construirePromptRemediation,
  DEFAULT_MODEL,
} from "./prompt";
export { extraireEtParserRapport } from "./parser";

/**
 * Fabrique principale fournissant une instance du seam ExaminateurJury.
 * Si une clé API est fournie (et que le mode simulation n'est pas forcé), instancie l'adaptateur de production Gemini.
 * Sinon, bascule automatiquement sur l'adaptateur simulé FakeExaminateurAdapter.
 */
export function creerExaminateur(
  config: ConfigExaminateur = {}
): ExaminateurJury {
  const { cleApi, modele, forcerSimulation = false } = config;

  if (cleApi && cleApi.trim().length > 0 && !forcerSimulation) {
    return new GeminiExaminateurAdapter(cleApi.trim(), modele);
  }

  return new FakeExaminateurAdapter();
}
