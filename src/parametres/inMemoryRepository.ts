import type { ParametresCandidat } from "../types/domain";
import {
  DEFAULT_PARAMETRES,
  type ParametresRepository,
  type ResultatValidationCle,
} from "./types";

/**
 * Adaptateur simulé en mémoire pour les tests unitaires et environnements hors-navigateur
 */
export class InMemoryParametresRepository implements ParametresRepository {
  private parametres: ParametresCandidat;

  constructor(parametresInitiaux?: Partial<ParametresCandidat>) {
    this.parametres = {
      ...DEFAULT_PARAMETRES,
      ...parametresInitiaux,
    };
  }

  obtenirValeursParDefaut(): ParametresCandidat {
    return { ...DEFAULT_PARAMETRES };
  }

  validerCleApi(cle: string): ResultatValidationCle {
    const trimmed = cle ? cle.trim() : "";
    if (!trimmed) {
      return {
        valide: true,
        avertissement: "Mode simulation actif : aucune clé API renseignée.",
      };
    }
    if (!trimmed.startsWith("AIzaSy")) {
      return {
        valide: true,
        avertissement:
          "Attention : les clés API Gemini officielles débutent généralement par 'AIzaSy'.",
      };
    }
    return { valide: true };
  }

  chargerParametres(): ParametresCandidat {
    return { ...this.parametres };
  }

  sauvegarderParametres(params: ParametresCandidat): void {
    this.parametres = {
      cleApiGemini: params.cleApiGemini ? params.cleApiGemini.trim() : "",
      modeleGemini:
        params.modeleGemini && params.modeleGemini.trim()
          ? params.modeleGemini.trim()
          : DEFAULT_PARAMETRES.modeleGemini,
      consignesPersonnalisees: params.consignesPersonnalisees
        ? params.consignesPersonnalisees.trim()
        : "",
    };
  }

  reinitialiserParametres(): ParametresCandidat {
    this.parametres = { ...DEFAULT_PARAMETRES };
    return { ...this.parametres };
  }
}
