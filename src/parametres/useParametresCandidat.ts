import { useState, useCallback } from "react";
import type { ParametresCandidat } from "../types/domain";
import { parametresRepository } from "./index";
import type { ParametresRepository, ResultatValidationCle } from "./types";

export interface UseParametresCandidatOptions {
  repository?: ParametresRepository;
}

export interface UseParametresCandidatResult {
  parametres: ParametresCandidat;
  mettreAJourParametres: (nouveauxParametres: ParametresCandidat) => void;
  reinitialiserParametres: () => void;
  validerCle: (cle: string) => ResultatValidationCle;
}

/**
 * Hook React orchestrant les paramètres du candidat (BYOK, modèle et consignes)
 * connecté au seam ParametresRepository.
 */
export function useParametresCandidat(
  options?: UseParametresCandidatOptions
): UseParametresCandidatResult {
  const repo = options?.repository ?? parametresRepository;

  const [parametres, setParametres] = useState<ParametresCandidat>(() =>
    repo.chargerParametres()
  );

  const mettreAJourParametres = useCallback(
    (nouveauxParametres: ParametresCandidat) => {
      repo.sauvegarderParametres(nouveauxParametres);
      setParametres(repo.chargerParametres());
    },
    [repo]
  );

  const reinitialiserParametres = useCallback(() => {
    const parDefaut = repo.reinitialiserParametres();
    setParametres(parDefaut);
  }, [repo]);

  const validerCle = useCallback(
    (cle: string) => {
      return repo.validerCleApi(cle);
    },
    [repo]
  );

  return {
    parametres,
    mettreAJourParametres,
    reinitialiserParametres,
    validerCle,
  };
}
