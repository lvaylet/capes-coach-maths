export * from "./types";
export * from "./telechargeur";
export * from "./formateur";

import type { FormateurRapport, TelechargeurFichier } from "./types";
import { DefaultFormateurRapport } from "./formateur";

/**
 * Fabrique pour instancier un FormateurRapport,
 * avec possibilité d'injecter un TelechargeurFichier (ex: MockTelechargeur en test).
 */
export function creerFormateurRapport(
  telechargeur?: TelechargeurFichier
): FormateurRapport {
  return new DefaultFormateurRapport(telechargeur);
}

/**
 * Instance singleton pour l'environnement de production standard
 */
export const formateurRapport: FormateurRapport = creerFormateurRapport();
