import type { ParametresCandidat } from "../types/domain";
import {
  DEFAULT_PARAMETRES,
  STORAGE_KEY_PARAMETRES,
  type ParametresRepository,
  type ResultatValidationCle,
} from "./types";

/**
 * Adaptateur de production persistant les réglages du candidat dans localStorage
 */
export class LocalStorageParametresRepository implements ParametresRepository {
  private customStorage?: Storage;

  constructor(customStorage?: Storage) {
    this.customStorage = customStorage;
  }

  private get storage(): Storage | null {
    if (this.customStorage) {
      return this.customStorage;
    }
    if (typeof localStorage !== "undefined") {
      return localStorage;
    }
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
    return null;
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
    const storage = this.storage;
    if (!storage) {
      return this.obtenirValeursParDefaut();
    }

    try {
      const brut = storage.getItem(STORAGE_KEY_PARAMETRES);
      if (!brut) return this.obtenirValeursParDefaut();

      const parsed = JSON.parse(brut);
      if (typeof parsed !== "object" || parsed === null) {
        return this.obtenirValeursParDefaut();
      }

      return {
        cleApiGemini:
          typeof parsed.cleApiGemini === "string"
            ? parsed.cleApiGemini.trim()
            : "",
        modeleGemini:
          typeof parsed.modeleGemini === "string" && parsed.modeleGemini.trim()
            ? parsed.modeleGemini.trim()
            : DEFAULT_PARAMETRES.modeleGemini,
        consignesPersonnalisees:
          typeof parsed.consignesPersonnalisees === "string"
            ? parsed.consignesPersonnalisees.trim()
            : "",
      };
    } catch {
      return this.obtenirValeursParDefaut();
    }
  }

  sauvegarderParametres(params: ParametresCandidat): void {
    const storage = this.storage;
    if (!storage) return;

    try {
      const clean: ParametresCandidat = {
        cleApiGemini: params.cleApiGemini ? params.cleApiGemini.trim() : "",
        modeleGemini:
          params.modeleGemini && params.modeleGemini.trim()
            ? params.modeleGemini.trim()
            : DEFAULT_PARAMETRES.modeleGemini,
        consignesPersonnalisees: params.consignesPersonnalisees
          ? params.consignesPersonnalisees.trim()
          : "",
      };
      storage.setItem(STORAGE_KEY_PARAMETRES, JSON.stringify(clean));
    } catch (err) {
      console.warn(
        "Échec de l'enregistrement des paramètres dans localStorage :",
        err
      );
    }
  }

  reinitialiserParametres(): ParametresCandidat {
    const storage = this.storage;
    if (storage) {
      try {
        storage.removeItem(STORAGE_KEY_PARAMETRES);
      } catch {
        // Ignorer
      }
    }
    return this.obtenirValeursParDefaut();
  }
}
