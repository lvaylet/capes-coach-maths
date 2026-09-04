import { useReducer, useEffect, useMemo, useCallback } from "react";
import type { DomaineMathematique, Epreuve, PageImage } from "../types/domain";
import { sessionRepository } from "../db";
import { creerEtatInitial, sessionReducer } from "./reducer";
import { SessionCoordinator } from "./coordinator";
import type { OptionsSessionCoordinator } from "./types";

/**
 * Hook de domaine fournissant l'interface réactive complète d'une Session d'entraînement
 */
export function useSessionDEntrainement(options: OptionsSessionCoordinator) {
  const { examinateur, repository = sessionRepository } = options;

  const [state, dispatch] = useReducer(sessionReducer, undefined, () =>
    creerEtatInitial()
  );

  const coordinator = useMemo(
    () => new SessionCoordinator(examinateur, repository),
    [examinateur, repository]
  );

  // Charger la liste d'historique au montage
  useEffect(() => {
    coordinator.actualiserHistorique(dispatch);
  }, [coordinator]);

  const setTitre = useCallback(
    (titre: string) => dispatch({ type: "SET_TITRE", titre }),
    []
  );

  const setDomaine = useCallback(
    (domaine: DomaineMathematique) =>
      dispatch({ type: "SET_DOMAINE", domaine }),
    []
  );

  const setEpreuve = useCallback(
    (epreuve: Epreuve) => dispatch({ type: "SET_EPREUVE", epreuve }),
    []
  );

  const setEnoncePages = useCallback(
    (pages: PageImage[]) => dispatch({ type: "SET_ENONCE_PAGES", pages }),
    []
  );

  const setEnonceTexte = useCallback(
    (texte: string) => dispatch({ type: "SET_ENONCE_TEXTE", texte }),
    []
  );

  const setCopiePages = useCallback(
    (pages: PageImage[]) => dispatch({ type: "SET_COPIE_PAGES", pages }),
    []
  );

  const effacerErreur = useCallback(
    () => dispatch({ type: "EFFACER_ERREUR" }),
    []
  );

  const reinitialiserSession = useCallback(
    () => dispatch({ type: "REINITIALISER_SESSION" }),
    []
  );

  const lancerEvaluation = useCallback(
    (consignesSupplementaires?: string) =>
      coordinator.lancerEvaluation(state, dispatch, consignesSupplementaires),
    [coordinator, state]
  );

  const envoyerRemediation = useCallback(
    (texte: string) => coordinator.envoyerRemediation(state, dispatch, texte),
    [coordinator, state]
  );

  const chargerSession = useCallback(
    (id: string) => coordinator.chargerSession(dispatch, id),
    [coordinator]
  );

  const supprimerSession = useCallback(
    (id: string) => coordinator.supprimerSession(state, dispatch, id),
    [coordinator, state]
  );

  const actualiserHistorique = useCallback(
    () => coordinator.actualiserHistorique(dispatch),
    [coordinator]
  );

  return {
    state,
    sessionId: state.sessionId,
    titre: state.titre,
    domaine: state.domaine,
    epreuve: state.epreuve,
    enoncePages: state.enoncePages,
    enonceTexte: state.enonceTexte,
    copiePages: state.copiePages,
    sessionActive: state.sessionActive,
    enEvaluation: state.enEvaluation,
    enRemediation: state.enRemediation,
    erreur: state.erreur,
    listeHistorique: state.listeHistorique,

    setTitre,
    setDomaine,
    setEpreuve,
    setEnoncePages,
    setEnonceTexte,
    setCopiePages,
    effacerErreur,
    reinitialiserSession,
    lancerEvaluation,
    envoyerRemediation,
    chargerSession,
    supprimerSession,
    actualiserHistorique,
  };
}
