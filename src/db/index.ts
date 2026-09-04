import type { SessionDEntrainement } from "../types/domain";
import type { SessionRepository, StoredSessionRecord } from "./types";
import {
  DexieSessionRepository,
  CapesCoachMathsDatabase,
} from "./dexieRepository";
import { InMemorySessionRepository } from "./inMemoryRepository";

export * from "./types";
export {
  DexieSessionRepository,
  CapesCoachMathsDatabase,
} from "./dexieRepository";
export { InMemorySessionRepository } from "./inMemoryRepository";

/**
 * Instance par défaut utilisée en production (IndexedDB avec Dexie)
 */
export const sessionRepository: SessionRepository =
  new DexieSessionRepository();

/**
 * Accès direct à l'instance Dexie sous-jacente pour inspection
 */
export const db: CapesCoachMathsDatabase = (
  sessionRepository as DexieSessionRepository
).database;

/**
 * Fabrique pour instancier un SessionRepository spécifique (Dexie ou InMemory)
 */
export function creerSessionRepository(
  type: "dexie" | "memory" = "dexie"
): SessionRepository {
  return type === "dexie"
    ? new DexieSessionRepository()
    : new InMemorySessionRepository();
}

// Fonctions raccourcies pour compatibilité avec l'existant
export async function sauvegarderSession(
  session: SessionDEntrainement
): Promise<string> {
  return await sessionRepository.sauvegarderSession(session);
}

export async function chargerSession(
  sessionId: string
): Promise<SessionDEntrainement | null> {
  return await sessionRepository.chargerSession(sessionId);
}

export async function listerSessions(): Promise<StoredSessionRecord[]> {
  return await sessionRepository.listerSessions();
}

export async function supprimerSession(sessionId: string): Promise<void> {
  return await sessionRepository.supprimerSession(sessionId);
}
