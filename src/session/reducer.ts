import type { EtatSession, ActionSession } from "./types";

/**
 * Crée l'état initial par défaut pour une nouvelle session d'entraînement
 */
export function creerEtatInitial(dateRef: Date = new Date()): EtatSession {
  return {
    sessionId: undefined,
    titre: `Entraînement ${dateRef.toLocaleDateString("fr-FR")}`,
    domaine: "Analyse",
    epreuve: "epreuve-1",
    enoncePages: [],
    enonceTexte: "",
    copiePages: [],
    sessionActive: null,
    enEvaluation: false,
    enRemediation: false,
    erreur: null,
    listeHistorique: [],
  };
}

/**
 * Machine d'états pure gérant les transitions d'une session d'entraînement
 */
export function sessionReducer(
  state: EtatSession,
  action: ActionSession
): EtatSession {
  switch (action.type) {
    case "SET_TITRE":
      return { ...state, titre: action.titre };

    case "SET_DOMAINE":
      return { ...state, domaine: action.domaine };

    case "SET_EPREUVE":
      return { ...state, epreuve: action.epreuve };

    case "SET_ENONCE_PAGES":
      return { ...state, enoncePages: action.pages };

    case "SET_ENONCE_TEXTE":
      return { ...state, enonceTexte: action.texte };

    case "SET_COPIE_PAGES":
      return { ...state, copiePages: action.pages };

    case "DEBUT_EVALUATION":
      return { ...state, enEvaluation: true, erreur: null };

    case "SUCCES_EVALUATION":
      return {
        ...state,
        enEvaluation: false,
        sessionActive: action.session,
        sessionId: action.session.id,
        erreur: null,
      };

    case "ERREUR_EVALUATION":
      return { ...state, enEvaluation: false, erreur: action.erreur };

    case "DEBUT_REMEDIATION":
      if (!state.sessionActive) return state;
      return {
        ...state,
        enRemediation: true,
        erreur: null,
        sessionActive: {
          ...state.sessionActive,
          messagesRemediation: [
            ...state.sessionActive.messagesRemediation,
            action.messageCandidat,
          ],
        },
      };

    case "SUCCES_REMEDIATION":
      return {
        ...state,
        enRemediation: false,
        sessionActive: action.session,
        erreur: null,
      };

    case "ERREUR_REMEDIATION":
      return { ...state, enRemediation: false, erreur: action.erreur };

    case "CHARGER_SESSION":
      return {
        ...state,
        sessionActive: action.session,
        sessionId: action.session.id,
        titre: action.session.titre,
        domaine: action.session.domaine,
        epreuve: action.session.epreuve,
        enoncePages: action.session.enonce.pages,
        enonceTexte: action.session.enonce.texteOptionnel || "",
        copiePages: action.session.copie.pages,
        erreur: null,
        enEvaluation: false,
        enRemediation: false,
      };

    case "REINITIALISER_SESSION":
      return {
        ...creerEtatInitial(),
        listeHistorique: state.listeHistorique,
      };

    case "SET_HISTORIQUE":
      return { ...state, listeHistorique: action.historique };

    case "EFFACER_ERREUR":
      return { ...state, erreur: null };

    default:
      return state;
  }
}
