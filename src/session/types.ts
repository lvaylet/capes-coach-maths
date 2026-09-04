import type {
  SessionDEntrainement,
  DomaineMathematique,
  Epreuve,
  PageImage,
  MessageRemediation,
} from "../types/domain";
import type { StoredSessionRecord, SessionRepository } from "../db/types";
import type { ExaminateurJury } from "../services/examinateur/types";

/**
 * État consolidé de la session d'entraînement
 */
export interface EtatSession {
  sessionId?: string;
  titre: string;
  domaine: DomaineMathematique;
  epreuve: Epreuve;
  enoncePages: PageImage[];
  enonceTexte: string;
  copiePages: PageImage[];
  sessionActive: SessionDEntrainement | null;
  enEvaluation: boolean;
  enRemediation: boolean;
  erreur: string | null;
  listeHistorique: StoredSessionRecord[];
}

/**
 * Actions strictes pour la machine d'états de la session
 */
export type ActionSession =
  | { type: "SET_TITRE"; titre: string }
  | { type: "SET_DOMAINE"; domaine: DomaineMathematique }
  | { type: "SET_EPREUVE"; epreuve: Epreuve }
  | { type: "SET_ENONCE_PAGES"; pages: PageImage[] }
  | { type: "SET_ENONCE_TEXTE"; texte: string }
  | { type: "SET_COPIE_PAGES"; pages: PageImage[] }
  | { type: "DEBUT_EVALUATION" }
  | { type: "SUCCES_EVALUATION"; session: SessionDEntrainement }
  | { type: "ERREUR_EVALUATION"; erreur: string }
  | { type: "DEBUT_REMEDIATION"; messageCandidat: MessageRemediation }
  | { type: "SUCCES_REMEDIATION"; session: SessionDEntrainement }
  | { type: "ERREUR_REMEDIATION"; erreur: string }
  | { type: "CHARGER_SESSION"; session: SessionDEntrainement }
  | { type: "REINITIALISER_SESSION" }
  | { type: "SET_HISTORIQUE"; historique: StoredSessionRecord[] }
  | { type: "EFFACER_ERREUR" };

/**
 * Options d'injection pour l'orchestrateur de session
 */
export interface OptionsSessionCoordinator {
  examinateur: ExaminateurJury;
  repository?: SessionRepository;
}
