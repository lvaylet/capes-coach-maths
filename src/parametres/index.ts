import { LocalStorageParametresRepository } from "./localStorageRepository";
import { InMemoryParametresRepository } from "./inMemoryRepository";
import type { ParametresRepository } from "./types";

export * from "./types";
export * from "./localStorageRepository";
export * from "./inMemoryRepository";
export * from "./useParametresCandidat";

/**
 * Fabrique créant une instance de ParametresRepository selon l'environnement souhaité.
 */
export function creerParametresRepository(
  type: "localStorage" | "inMemory" = "localStorage"
): ParametresRepository {
  if (type === "inMemory") {
    return new InMemoryParametresRepository();
  }
  return new LocalStorageParametresRepository();
}

/**
 * Instance par défaut (singleton) connectée au localStorage du navigateur.
 */
export const parametresRepository: ParametresRepository =
  new LocalStorageParametresRepository();
