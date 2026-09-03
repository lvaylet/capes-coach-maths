/**
 * Modèle de domaine strict conforme à CONTEXT.md
 */

export type DomaineMathematique =
  | 'Algebre'
  | 'Analyse'
  | 'Geometrie'
  | 'Probabilites'
  | 'Arithmetique'
  | 'Autre';

export type Epreuve = 'epreuve-1' | 'epreuve-2' | 'auto';

export interface PageImage {
  id: string;
  blob: Blob;
  previewUrl: string;
  nomFichier: string;
  rotation: number; // 0, 90, 180, 270
  ordre: number;
}

export interface Enonce {
  id: string;
  titre?: string;
  pages: PageImage[];
  texteOptionnel?: string;
}

export interface Copie {
  id: string;
  pages: PageImage[];
}

export interface RapportDeCorrection {
  transcription: string;
  verdict: {
    noteIndicative?: string;
    appreciationGlobale: string;
    pointsForts: string[];
    erreursCritiques: string[];
  };
  fond: {
    analyseDetaillee: string;
    theoremesEtHypotheses: string[];
    validiteDemonstrations: string;
  };
  forme: {
    analyseDetaillee: string;
    rigueurNotationsEtQuantificateurs: string;
    qualiteRedactionnelle: string;
    respectDesNormesDuJury: string;
  };
  redactionModele: string;
  dateGeneration: string;
}

export interface MessageRemediation {
  id: string;
  auteur: 'candidat' | 'examinateur';
  date: string;
  contenu: string;
}

export interface SessionDEntrainement {
  id?: string;
  titre: string;
  dateCreation: string;
  domaine: DomaineMathematique;
  epreuve: Epreuve;
  enonce: Enonce;
  copie: Copie;
  rapport?: RapportDeCorrection;
  messagesRemediation: MessageRemediation[];
}

export interface ParametresCandidat {
  cleApiGemini: string;
  modeleGemini: string; // défaut: 'gemini-2.5-flash'
  consignesPersonnalisees?: string;
}
