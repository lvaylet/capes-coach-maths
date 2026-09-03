import Dexie, { type Table } from 'dexie';
import type { SessionDEntrainement, PageImage } from '../types/domain';

export interface StoredImageRecord {
  id: string;
  sessionId: string;
  typeDoc: 'enonce' | 'copie';
  ordre: number;
  rotation: number;
  nomFichier: string;
  blob: Blob;
}

export interface StoredSessionRecord {
  id: string;
  titre: string;
  dateCreation: string;
  domaine: string;
  epreuve: string;
  enonceTexte?: string;
  rapport?: any;
  messagesRemediation: any[];
}

export class MathsAssistantDatabase extends Dexie {
  sessions!: Table<StoredSessionRecord, string>;
  images!: Table<StoredImageRecord, string>;

  constructor() {
    super('MathsAssistantDB');
    this.version(1).stores({
      sessions: 'id, dateCreation, domaine, epreuve',
      images: 'id, sessionId, typeDoc, ordre',
    });
  }
}

export const db = new MathsAssistantDatabase();

/**
 * Sauvegarde une session complète avec ses images dans IndexedDB
 */
export async function sauvegarderSession(session: SessionDEntrainement): Promise<string> {
  const sessionId = session.id || crypto.randomUUID();

  await db.transaction('rw', db.sessions, db.images, async () => {
    // 1. Sauvegarder les métadonnées de la session
    const sessionRecord: StoredSessionRecord = {
      id: sessionId,
      titre: session.titre,
      dateCreation: session.dateCreation || new Date().toISOString(),
      domaine: session.domaine,
      epreuve: session.epreuve,
      enonceTexte: session.enonce.texteOptionnel,
      rapport: session.rapport,
      messagesRemediation: session.messagesRemediation,
    };
    await db.sessions.put(sessionRecord);

    // 2. Nettoyer les anciennes images de cette session
    await db.images.where('sessionId').equals(sessionId).delete();

    // 3. Sauvegarder les images d'énoncé
    for (const page of session.enonce.pages) {
      await db.images.put({
        id: page.id || crypto.randomUUID(),
        sessionId,
        typeDoc: 'enonce',
        ordre: page.ordre,
        rotation: page.rotation,
        nomFichier: page.nomFichier,
        blob: page.blob,
      });
    }

    // 4. Sauvegarder les images de copie
    for (const page of session.copie.pages) {
      await db.images.put({
        id: page.id || crypto.randomUUID(),
        sessionId,
        typeDoc: 'copie',
        ordre: page.ordre,
        rotation: page.rotation,
        nomFichier: page.nomFichier,
        blob: page.blob,
      });
    }
  });

  return sessionId;
}

/**
 * Charge une session complète par ID et reconstitue les URLs de prévisualisation
 */
export async function chargerSession(sessionId: string): Promise<SessionDEntrainement | null> {
  const record = await db.sessions.get(sessionId);
  if (!record) return null;

  const imageRecords = await db.images.where('sessionId').equals(sessionId).toArray();

  const enoncePages: PageImage[] = imageRecords
    .filter((img) => img.typeDoc === 'enonce')
    .sort((a, b) => a.ordre - b.ordre)
    .map((img) => ({
      id: img.id,
      blob: img.blob,
      previewUrl: URL.createObjectURL(img.blob),
      nomFichier: img.nomFichier,
      rotation: img.rotation,
      ordre: img.ordre,
    }));

  const copiePages: PageImage[] = imageRecords
    .filter((img) => img.typeDoc === 'copie')
    .sort((a, b) => a.ordre - b.ordre)
    .map((img) => ({
      id: img.id,
      blob: img.blob,
      previewUrl: URL.createObjectURL(img.blob),
      nomFichier: img.nomFichier,
      rotation: img.rotation,
      ordre: img.ordre,
    }));

  return {
    id: record.id,
    titre: record.titre,
    dateCreation: record.dateCreation,
    domaine: record.domaine as any,
    epreuve: record.epreuve as any,
    enonce: {
      id: `${record.id}-enonce`,
      pages: enoncePages,
      texteOptionnel: record.enonceTexte,
    },
    copie: {
      id: `${record.id}-copie`,
      pages: copiePages,
    },
    rapport: record.rapport,
    messagesRemediation: record.messagesRemediation || [],
  };
}

/**
 * Récupère la liste de toutes les sessions
 */
export async function listerSessions(): Promise<StoredSessionRecord[]> {
  return await db.sessions.orderBy('dateCreation').reverse().toArray();
}

/**
 * Supprime une session et ses images
 */
export async function supprimerSession(sessionId: string): Promise<void> {
  await db.transaction('rw', db.sessions, db.images, async () => {
    await db.images.where('sessionId').equals(sessionId).delete();
    await db.sessions.delete(sessionId);
  });
}
