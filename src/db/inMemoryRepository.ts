import type { SessionDEntrainement, PageImage } from "../types/domain";
import type {
  SessionRepository,
  StoredImageRecord,
  StoredSessionRecord,
} from "./types";

/**
 * Adaptateur de persistance en mémoire (In-Memory)
 * Idéal pour les tests unitaires purs dans Vitest sans dépendance à IndexedDB.
 */
export class InMemorySessionRepository implements SessionRepository {
  private sessions = new Map<string, StoredSessionRecord>();
  private images = new Map<string, StoredImageRecord[]>();

  async sauvegarderSession(session: SessionDEntrainement): Promise<string> {
    const sessionId = session.id || crypto.randomUUID();

    const sessionRecord: StoredSessionRecord = {
      id: sessionId,
      titre: session.titre,
      dateCreation: session.dateCreation || new Date().toISOString(),
      domaine: session.domaine,
      epreuve: session.epreuve,
      enonceTexte: session.enonce.texteOptionnel,
      rapport: session.rapport,
      messagesRemediation: session.messagesRemediation || [],
    };

    this.sessions.set(sessionId, sessionRecord);

    // Stockage des images
    const imageList: StoredImageRecord[] = [];

    for (const page of session.enonce.pages) {
      imageList.push({
        id: page.id || crypto.randomUUID(),
        sessionId,
        typeDoc: "enonce",
        ordre: page.ordre,
        rotation: page.rotation,
        nomFichier: page.nomFichier,
        blob: page.blob,
      });
    }

    for (const page of session.copie.pages) {
      imageList.push({
        id: page.id || crypto.randomUUID(),
        sessionId,
        typeDoc: "copie",
        ordre: page.ordre,
        rotation: page.rotation,
        nomFichier: page.nomFichier,
        blob: page.blob,
      });
    }

    this.images.set(sessionId, imageList);
    return sessionId;
  }

  async chargerSession(
    sessionId: string
  ): Promise<SessionDEntrainement | null> {
    const record = this.sessions.get(sessionId);
    if (!record) return null;

    const imageRecords = this.images.get(sessionId) || [];

    const reconstituer = (typeDoc: "enonce" | "copie"): PageImage[] =>
      imageRecords
        .filter((img) => img.typeDoc === typeDoc)
        .sort((a, b) => a.ordre - b.ordre)
        .map((img) => ({
          id: img.id,
          blob: img.blob,
          previewUrl: "",
          nomFichier: img.nomFichier,
          rotation: img.rotation,
          ordre: img.ordre,
        }));

    return {
      id: record.id,
      titre: record.titre,
      dateCreation: record.dateCreation,
      domaine: record.domaine,
      epreuve: record.epreuve,
      enonce: {
        id: `${record.id}-enonce`,
        pages: reconstituer("enonce"),
        texteOptionnel: record.enonceTexte,
      },
      copie: {
        id: `${record.id}-copie`,
        pages: reconstituer("copie"),
      },
      rapport: record.rapport,
      messagesRemediation: record.messagesRemediation || [],
    };
  }

  async listerSessions(): Promise<StoredSessionRecord[]> {
    return Array.from(this.sessions.values()).sort(
      (a, b) =>
        new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()
    );
  }

  async supprimerSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
    this.images.delete(sessionId);
  }

  async vider(): Promise<void> {
    this.sessions.clear();
    this.images.clear();
  }
}
