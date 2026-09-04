import type {
  Epreuve,
  RapportDeCorrection,
  PageImage,
  MessageRemediation,
} from "../../types/domain";

export interface OptionsEvaluation {
  epreuve: Epreuve;
  enoncePages: PageImage[];
  enonceTexte?: string;
  copiePages: PageImage[];
  consignesSupplementaires?: string;
}

export interface OptionsRemediation {
  rapport: RapportDeCorrection;
  historiqueMessages: MessageRemediation[];
  nouvelleQuestion: string;
}

export interface ConfigExaminateur {
  cleApi?: string;
  modele?: string;
  forcerSimulation?: boolean;
}

/**
 * Interface du module ExaminateurJury représentant le seam d'évaluation.
 * Tous les appelants interagissent avec cette interface sans connaître le transport sous-jacent.
 */
export interface ExaminateurJury {
  readonly estModeSimulation: boolean;
  evaluerCopie(options: OptionsEvaluation): Promise<RapportDeCorrection>;
  poserQuestionRemediation(options: OptionsRemediation): Promise<string>;
}
