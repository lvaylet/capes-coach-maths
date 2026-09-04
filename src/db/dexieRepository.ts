import Dexie, { type Table } from "dexie";
import type { SessionDEntrainement, PageImage } from "../types/domain";
import type {
  SessionRepository,
  StoredImageRecord,
  StoredSessionRecord,
} from "./types";

export class CapesCoachMathsDatabase extends Dexie {
  sessions!: Table<StoredSessionRecord, string>;
  images!: Table<StoredImageRecord, string>;

  constructor(databaseName: string = "CapesCoachMathsDB") {
    super(databaseName);
    this.version(1).stores({
      sessions: "id, dateCreation, domaine, epreuve",
      images: "id, sessionId, typeDoc, ordre",
    });
  }
}

/**
 * Helper privé pour stocker une collection de pages d'images (énoncé ou copie)
 */
async function stockerImages(
  database: CapesCoachMathsDatabase,
  sessionId: string,
  typeDoc: "enonce" | "copie",
  pages: PageImage[]
): Promise<void> {
  for (const page of pages) {
    await database.images.put({
      id: page.id || crypto.randomUUID(),
      sessionId,
      typeDoc,
      ordre: page.ordre,
      rotation: page.rotation,
      nomFichier: page.nomFichier,
      blob: page.blob,
    });
  }
}

/**
 * Helper privé pour filtrer, ordonner et reconstituer les PageImage avec URL de prévisualisation
 */
function reconstituerPages(
  imageRecords: StoredImageRecord[],
  typeDoc: "enonce" | "copie"
): PageImage[] {
  return imageRecords
    .filter((img) => img.typeDoc === typeDoc)
    .sort((a, b) => a.ordre - b.ordre)
    .map((img) => ({
      id: img.id,
      blob: img.blob,
      previewUrl:
        typeof URL !== "undefined" && URL.createObjectURL
          ? URL.createObjectURL(img.blob)
          : "",
      nomFichier: img.nomFichier,
      rotation: img.rotation,
      ordre: img.ordre,
    }));
}

/**
 * Adaptateur de persistance basé sur IndexedDB avec la bibliothèque Dexie.js
 */
export class DexieSessionRepository implements SessionRepository {
  readonly database: CapesCoachMathsDatabase;

  constructor(
    databaseNameOrInstance:
      string | CapesCoachMathsDatabase = "CapesCoachMathsDB"
  ) {
    if (typeof databaseNameOrInstance === "string") {
      this.database = new CapesCoachMathsDatabase(databaseNameOrInstance);
    } else {
      this.database = databaseNameOrInstance;
    }
  }

  async sauvegarderSession(session: SessionDEntrainement): Promise<string> {
    const sessionId = session.id || crypto.randomUUID();

    await this.database.transaction(
      "rw",
      this.database.sessions,
      this.database.images,
      async () => {
        // 1. Enregistrement des métadonnées et contenu typé
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
        await this.database.sessions.put(sessionRecord);

        // 2. Nettoyage des anciennes images pour réécriture idempotente
        await this.database.images
          .where("sessionId")
          .equals(sessionId)
          .delete();

        // 3. Sauvegarde factorisée des images
        await stockerImages(
          this.database,
          sessionId,
          "enonce",
          session.enonce.pages
        );
        await stockerImages(
          this.database,
          sessionId,
          "copie",
          session.copie.pages
        );
      }
    );

    return sessionId;
  }

  async chargerSession(
    sessionId: string
  ): Promise<SessionDEntrainement | null> {
    const record = await this.database.sessions.get(sessionId);
    if (!record) return null;

    const imageRecords = await this.database.images
      .where("sessionId")
      .equals(sessionId)
      .toArray();

    return {
      id: record.id,
      titre: record.titre,
      dateCreation: record.dateCreation,
      domaine: record.domaine,
      epreuve: record.epreuve,
      enonce: {
        id: `${record.id}-enonce`,
        pages: reconstituerPages(imageRecords, "enonce"),
        texteOptionnel: record.enonceTexte,
      },
      copie: {
        id: `${record.id}-copie`,
        pages: reconstituerPages(imageRecords, "copie"),
      },
      rapport: record.rapport,
      messagesRemediation: record.messagesRemediation || [],
    };
  }

  async listerSessions(): Promise<StoredSessionRecord[]> {
    return await this.database.sessions
      .orderBy("dateCreation")
      .reverse()
      .toArray();
  }

  async supprimerSession(sessionId: string): Promise<void> {
    await this.database.transaction(
      "rw",
      this.database.sessions,
      this.database.images,
      async () => {
        await this.database.images
          .where("sessionId")
          .equals(sessionId)
          .delete();
        await this.database.sessions.delete(sessionId);
      }
    );
  }

  async vider(): Promise<void> {
    await this.database.transaction(
      "rw",
      this.database.sessions,
      this.database.images,
      async () => {
        await this.database.images.clear();
        await this.database.sessions.clear();
      }
    );
  }
}
