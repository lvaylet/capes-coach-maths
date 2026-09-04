import type {
  SessionDEntrainement,
  DomaineMathematique,
  Epreuve,
  RapportDeCorrection,
  MessageRemediation,
} from "../types/domain";

export interface StoredImageRecord {
  id: string;
  sessionId: string;
  typeDoc: "enonce" | "copie";
  ordre: number;
  rotation: number;
  nomFichier: string;
  blob: Blob;
}

export interface StoredSessionRecord {
  id: string;
  titre: string;
  dateCreation: string;
  domaine: DomaineMathematique;
  epreuve: Epreuve;
  enonceTexte?: string;
  rapport?: RapportDeCorrection;
  messagesRemediation: MessageRemediation[];
}

export interface ResumeSession {
  id: string;
  titre: string;
  dateCreation: string;
  domaine: DomaineMathematique;
  epreuve: Epreuve;
  noteIndicative?: string;
  appreciationGlobale?: string;
}

/**
 * Interface du module de persistance des sessions d'entraînement (Seam).
 * Masque les détails de stockage (Dexie/IndexedDB vs In-Memory).
 */
export interface SessionRepository {
  sauvegarderSession(session: SessionDEntrainement): Promise<string>;
  chargerSession(sessionId: string): Promise<SessionDEntrainement | null>;
  listerSessions(): Promise<StoredSessionRecord[]>;
  supprimerSession(sessionId: string): Promise<void>;
  vider(): Promise<void>;
}
