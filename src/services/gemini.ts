/**
 * Ce fichier est une façade de rétrocompatibilité.
 * Le code a été refactorisé et approfondi dans le module src/services/examinateur/
 * conformément à l'ADR-0003 (Architecture Ports & Adapters).
 */

import {
  creerExaminateur,
  construirePromptSysteme,
  construirePromptRemediation,
  extraireEtParserRapport,
  DEFAULT_MODEL,
} from "./examinateur";
import type {
  Epreuve,
  PageImage,
  RapportDeCorrection,
  MessageRemediation,
} from "../types/domain";

export * from "./examinateur";
export {
  construirePromptSysteme,
  construirePromptRemediation,
  extraireEtParserRapport,
  DEFAULT_MODEL,
};

interface EvaluerCopieParams {
  cleApi?: string;
  modele?: string;
  epreuve: Epreuve;
  enoncePages: PageImage[];
  enonceTexte?: string;
  copiePages: PageImage[];
  consignesSupplementaires?: string;
}

/**
 * @deprecated Utiliser directement creerExaminateur({ cleApi, modele }).evaluerCopie(options)
 */
export async function evaluerCopie(
  params: EvaluerCopieParams
): Promise<RapportDeCorrection> {
  const examinateur = creerExaminateur({
    cleApi: params.cleApi,
    modele: params.modele,
  });
  return examinateur.evaluerCopie({
    epreuve: params.epreuve,
    enoncePages: params.enoncePages,
    enonceTexte: params.enonceTexte,
    copiePages: params.copiePages,
    consignesSupplementaires: params.consignesSupplementaires,
  });
}

/**
 * @deprecated Utiliser directement creerExaminateur({ cleApi, modele }).poserQuestionRemediation(options)
 */
export async function poserQuestionRemediation(
  cleApi: string,
  modele: string = DEFAULT_MODEL,
  rapport: RapportDeCorrection,
  historiqueMessages: MessageRemediation[],
  nouvelleQuestion: string
): Promise<string> {
  const examinateur = creerExaminateur({ cleApi, modele });
  return examinateur.poserQuestionRemediation({
    rapport,
    historiqueMessages,
    nouvelleQuestion,
  });
}
