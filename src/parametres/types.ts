import type { ParametresCandidat } from "../types/domain";

export const STORAGE_KEY_PARAMETRES = "capes_maths_parametres";

export const DEFAULT_PARAMETRES: ParametresCandidat = {
  cleApiGemini: "",
  modeleGemini: "gemini-2.5-flash",
  consignesPersonnalisees: "",
};

export interface ResultatValidationCle {
  valide: boolean;
  avertissement?: string;
}

/**
 * Seam de persistance et de validation des réglages du candidat (BYOK).
 * Masque les mécanismes de stockage sous-jacents (LocalStorage vs InMemory).
 */
export interface ParametresRepository {
  chargerParametres(): ParametresCandidat;
  sauvegarderParametres(params: ParametresCandidat): void;
  reinitialiserParametres(): ParametresCandidat;
  validerCleApi(cle: string): ResultatValidationCle;
  obtenirValeursParDefaut(): ParametresCandidat;
}
