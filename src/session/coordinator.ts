import type { SessionDEntrainement, MessageRemediation } from "../types/domain";
import type { SessionRepository } from "../db/types";
import type { ExaminateurJury } from "../services/examinateur/types";
import type { ActionSession, EtatSession } from "./types";

function genererId(prefixe: string): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `${prefixe}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Coordonnateur de domaine pilotant le cycle de vie d'une Session d'entraînement
 * en reliant l'état, l'examinateur du jury et le dépôt de persistance.
 */
export class SessionCoordinator {
  constructor(
    private examinateur: ExaminateurJury,
    private repository: SessionRepository
  ) {}

  /**
   * Lance l'évaluation d'une copie par l'examinateur du jury
   */
  async lancerEvaluation(
    state: EtatSession,
    dispatch: (action: ActionSession) => void,
    consignesSupplementaires?: string
  ): Promise<void> {
    if (state.copiePages.length === 0) {
      dispatch({
        type: "ERREUR_EVALUATION",
        erreur:
          "Veuillez ajouter au moins une photo de votre copie manuscrite.",
      });
      return;
    }

    dispatch({ type: "DEBUT_EVALUATION" });

    try {
      const rapport = await this.examinateur.evaluerCopie({
        epreuve: state.epreuve,
        enoncePages: state.enoncePages,
        enonceTexte: state.enonceTexte,
        copiePages: state.copiePages,
        consignesSupplementaires,
      });

      const idSession = state.sessionId || genererId("session");
      const nouvelleSession: SessionDEntrainement = {
        id: idSession,
        titre: state.titre || "Session sans titre",
        dateCreation: new Date().toISOString(),
        domaine: state.domaine,
        epreuve: state.epreuve,
        enonce: {
          id: genererId("enonce"),
          pages: state.enoncePages,
          texteOptionnel: state.enonceTexte,
        },
        copie: {
          id: genererId("copie"),
          pages: state.copiePages,
        },
        rapport,
        messagesRemediation: [],
      };

      const savedId = await this.repository.sauvegarderSession(nouvelleSession);
      nouvelleSession.id = savedId;

      dispatch({ type: "SUCCES_EVALUATION", session: nouvelleSession });
      await this.actualiserHistorique(dispatch);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de l'évaluation par le jury.";
      dispatch({ type: "ERREUR_EVALUATION", erreur: message });
    }
  }

  /**
   * Envoie une question de remédiation à l'examinateur et persiste la réponse
   */
  async envoyerRemediation(
    state: EtatSession,
    dispatch: (action: ActionSession) => void,
    texteQuestion: string
  ): Promise<void> {
    if (!state.sessionActive || !state.sessionActive.rapport) return;

    const messageCandidat: MessageRemediation = {
      id: genererId("msg-candidat"),
      auteur: "candidat",
      date: new Date().toISOString(),
      contenu: texteQuestion,
    };

    const historiqueMessages = [
      ...state.sessionActive.messagesRemediation,
      messageCandidat,
    ];

    dispatch({ type: "DEBUT_REMEDIATION", messageCandidat });

    try {
      const reponseExaminateur =
        await this.examinateur.poserQuestionRemediation({
          rapport: state.sessionActive.rapport,
          historiqueMessages,
          nouvelleQuestion: texteQuestion,
        });

      const messageExaminateur: MessageRemediation = {
        id: genererId("msg-examinateur"),
        auteur: "examinateur",
        date: new Date().toISOString(),
        contenu: reponseExaminateur,
      };

      const sessionFinale: SessionDEntrainement = {
        ...state.sessionActive,
        messagesRemediation: [...historiqueMessages, messageExaminateur],
      };

      await this.repository.sauvegarderSession(sessionFinale);
      dispatch({ type: "SUCCES_REMEDIATION", session: sessionFinale });
      await this.actualiserHistorique(dispatch);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors de la réponse de l'examinateur.";
      dispatch({ type: "ERREUR_REMEDIATION", erreur: message });
    }
  }

  /**
   * Charge une session existante depuis le dépôt
   */
  async chargerSession(
    dispatch: (action: ActionSession) => void,
    sessionId: string
  ): Promise<void> {
    try {
      const session = await this.repository.chargerSession(sessionId);
      if (session) {
        dispatch({ type: "CHARGER_SESSION", session });
      }
    } catch (err) {
      console.error("Erreur lors du chargement de la session :", err);
    }
  }

  /**
   * Supprime une session du dépôt et réinitialise si active
   */
  async supprimerSession(
    state: EtatSession,
    dispatch: (action: ActionSession) => void,
    sessionId: string
  ): Promise<void> {
    await this.repository.supprimerSession(sessionId);
    if (state.sessionId === sessionId) {
      dispatch({ type: "REINITIALISER_SESSION" });
    }
    await this.actualiserHistorique(dispatch);
  }

  /**
   * Actualise la liste des sessions disponibles dans l'historique
   */
  async actualiserHistorique(
    dispatch: (action: ActionSession) => void
  ): Promise<void> {
    try {
      const historique = await this.repository.listerSessions();
      dispatch({ type: "SET_HISTORIQUE", historique });
    } catch (err) {
      console.error("Erreur lors de l'actualisation de l'historique :", err);
    }
  }
}
