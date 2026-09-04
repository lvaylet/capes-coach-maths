/**
 * Façade de rétrocompatibilité pour l'accès à la base de données et à la persistance.
 * Le code a été refactorisé et approfondi dans le module src/db/ (SessionRepository).
 */

export * from "./index";
export {
  db,
  sessionRepository,
  creerSessionRepository,
  sauvegarderSession,
  chargerSession,
  listerSessions,
  supprimerSession,
} from "./index";
