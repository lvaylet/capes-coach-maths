import type { Epreuve, RapportDeCorrection, PageImage, MessageRemediation } from '../types/domain';
import { pivoterEtCompresserImage, blobToBase64 } from '../utils/image';

const DEFAULT_MODEL = 'gemini-2.5-flash';

/**
 * Construit le prompt système d'expert du jury du CAPES
 */
export function construirePromptSysteme(epreuve: Epreuve, consignesSupplementaires?: string): string {
  let contexteEpreuve = '';

  if (epreuve === 'epreuve-1') {
    contexteEpreuve = `
Vous évaluez une copie pour l'ÉPREUVE 1 du CAPES (Épreuve disciplinaire - Mathématiques générales, niveau L1-L3).
Exigences spécifiques :
- Rigueur formelle absolue des démonstrations et calculs.
- Exhaustivité dans l'énoncé et la vérification des hypothèses de chaque théorème (Continuité, dérivabilité, convergence dominée, compacité, inversibilité, etc.).
- Précision des définitions d'objets (espaces vectoriels, corps de base, ensembles de définition).
`;
  } else if (epreuve === 'epreuve-2') {
    contexteEpreuve = `
Vous évaluez une copie pour l'ÉPREUVE 2 du CAPES (Épreuve disciplinaire appliquée - Didactique, enseignement secondaire collège/lycée, programmation Python).
Exigences spécifiques :
- Clarté didactique et pertinence pédagogique.
- Rigueur mathématique adaptée aux programmes du secondaire et BTS.
- Justesse de l'analyse des productions ou erreurs d'élèves si le sujet en comporte.
- Validité et élégance des algorithmes / scripts Python s'il y a lieu.
`;
  } else {
    contexteEpreuve = `
Adaptez votre niveau d'exigence (Épreuve 1 ou 2) selon la nature de l'énoncé fourni.
`;
  }

  return `Tu es un membre éminent et exigeant du jury officiel du concours du CAPES de Mathématiques en France.
Ta mission est d'évaluer avec une extrême rigueur la copie manuscrite d'un candidat à partir de l'énoncé de l'exercice fourni.

${contexteEpreuve}

RÈGLES D'OR DU JURY DU CAPES (tirées des rapports officiels de concours récents) :
1. RIGUEUR DE LA QUANTIFICATION : Toute variable doit être introduite rigoureusement ("Soit $x \\in \\mathbb{R}$", $\\forall$, $\\exists$). L'oubli de quantificateurs ou l'usage de variables muettes mal définies est sévèrement sanctionné.
2. CONNECTEURS LOGIQUES ET RÉDACTION : L'utilisation abusive des symboles d'implication $\\Rightarrow$ ou d'équivalence $\\iff$ comme simples connecteurs de phrase ou puces de paragraphe est STRICTEMENT PROHIBÉE. Une démonstration doit être rédigée en phrases grammaticalement complètes ("Or...", "Puisque...", "On en déduit que...").
3. VÉRIFICATION DES HYPOTHÈSES : Citer le nom d'un théorème sans en vérifier explicitement TOUTES les hypothèses ne rapporte aucun point.
4. DISTINCTION FOND ET FORME : Tu dois séparer nettement la validité mathématique brute (Fond) de la clarté et rigueur d'exposition (Forme).
5. FORMAT DES FORMULES : Toutes les formules mathématiques dans tes explications DOIVENT être écrites en notation LaTeX valide encadrée par $...$ pour l'inline et $$...$$ pour les blocs.

${consignesSupplementaires ? `Consignes additionnelles transmises par le candidat :\n${consignesSupplementaires}\n` : ''}

Tu DOIS répondre impérativement sous la forme d'un objet JSON strict valide conforme au schéma suivant :
{
  "transcription": "Transcription fidèle et synthétique de ce que tu as déchiffré de la copie manuscrite du candidat (étapes clefs rédigées en LaTeX) afin de dissiper toute ambiguïté de lecture manuscrite.",
  "verdict": {
    "noteIndicative": "Estimation chiffrée (ex: 13/20) ou appréciation de recevabilité au concours",
    "appreciationGlobale": "Bilan synthétique en 2-3 phrases sur la prestation globale du candidat.",
    "pointsForts": ["Point fort 1", "Point fort 2"],
    "erreursCritiques": ["Erreur ou omission pénalisante 1", "Erreur 2"]
  },
  "fond": {
    "analyseDetaillee": "Analyse approfondie de la validité mathématique, étape par étape, avec formules LaTeX $...$.",
    "theoremesEtHypotheses": ["Remarque sur les hypothèses vérifiées ou omises pour chaque théorème invoqué"],
    "validiteDemonstrations": "Évaluation de la solidité des chaînes d'arguments et de la complétude des preuves."
  },
  "forme": {
    "analyseDetaillee": "Analyse détaillée de la qualité de rédaction, de la mise en page et de l'orthographe.",
    "rigueurNotationsEtQuantificateurs": "Critique de la précision des quantificateurs et de la définition des variables.",
    "qualiteRedactionnelle": "Évaluation du style : usage de phrases en français vs abus de symboles logiques $\\\\Rightarrow$.",
    "respectDesNormesDuJury": "Conformité avec les attentes spécifiques des rapports de jury du CAPES."
  },
  "redactionModele": "Démonstration modèle complète, irréprochable et élégante, rédigée selon les canons de perfection du concours, avec explications et formules $$...$$ bien aérées."
}
`;
}

interface EvaluerCopieParams {
  cleApi: string;
  modele?: string;
  epreuve: Epreuve;
  enoncePages: PageImage[];
  enonceTexte?: string;
  copiePages: PageImage[];
  consignesSupplementaires?: string;
}

/**
 * Envoie l'énoncé et la copie manuscrite à l'API Gemini pour évaluation par le jury du CAPES
 */
export async function evaluerCopie(params: EvaluerCopieParams): Promise<RapportDeCorrection> {
  const {
    cleApi,
    modele = DEFAULT_MODEL,
    epreuve,
    enoncePages,
    enonceTexte,
    copiePages,
    consignesSupplementaires,
  } = params;

  if (!cleApi) {
    throw new Error('Veuillez renseigner votre clé API Gemini dans les réglages de l\'application.');
  }

  if (copiePages.length === 0) {
    throw new Error('Veuillez fournir au moins une photo de votre copie manuscrite.');
  }

  const promptSysteme = construirePromptSysteme(epreuve, consignesSupplementaires);

  // Prétraiter et encoder les images en base64
  const parts: any[] = [];

  // Instructions initiales
  let messageInitial = `Voici la demande de correction pour le concours du CAPES de Mathématiques.\n\n`;

  if (enonceTexte?.trim()) {
    messageInitial += `Énoncé (transcription textuelle) :\n${enonceTexte.trim()}\n\n`;
  }

  messageInitial += `Ci-joint les photos de l'ÉNONCÉ puis les photos de la COPIE MANUSCRITE du candidat. Veuillez procéder à l'évaluation rigoureuse selon les consignes du jury.`;
  parts.push({ text: messageInitial });

  // Ajouter les images de l'énoncé
  for (let i = 0; i < enoncePages.length; i++) {
    const page = enoncePages[i];
    const blobTraite = await pivoterEtCompresserImage(page.blob, page.rotation);
    const base64 = await blobToBase64(blobTraite);
    parts.push({ text: `[ÉNONCÉ - Page ${i + 1}/${enoncePages.length}]` });
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64,
      },
    });
  }

  // Ajouter les images de la copie
  for (let i = 0; i < copiePages.length; i++) {
    const page = copiePages[i];
    const blobTraite = await pivoterEtCompresserImage(page.blob, page.rotation);
    const base64 = await blobToBase64(blobTraite);
    parts.push({ text: `[COPIE MANUSCRITE DU CANDIDAT - Page ${i + 1}/${copiePages.length}]` });
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64,
      },
    });
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modele}:generateContent?key=${cleApi}`;

  const payload = {
    systemInstruction: {
      parts: [{ text: promptSysteme }],
    },
    contents: [
      {
        role: 'user',
        parts,
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2, // Faible température pour maximiser la rigueur mathématique
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage = `Erreur de l'API Gemini (${response.status} ${response.statusText})`;
    try {
      const parsed = JSON.parse(errorBody);
      if (parsed.error?.message) {
        errorMessage += `: ${parsed.error.message}`;
      }
    } catch {
      errorMessage += `: ${errorBody}`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('L\'examinateur Gemini n\'a retourné aucune réponse.');
  }

  try {
    const parsedRapport = JSON.parse(rawText);
    return {
      transcription: parsedRapport.transcription || '',
      verdict: parsedRapport.verdict || {
        appreciationGlobale: 'Évaluation terminée.',
        pointsForts: [],
        erreursCritiques: [],
      },
      fond: parsedRapport.fond || {
        analyseDetaillee: '',
        theoremesEtHypotheses: [],
        validiteDemonstrations: '',
      },
      forme: parsedRapport.forme || {
        analyseDetaillee: '',
        rigueurNotationsEtQuantificateurs: '',
        qualiteRedactionnelle: '',
        respectDesNormesDuJury: '',
      },
      redactionModele: parsedRapport.redactionModele || '',
      dateGeneration: new Date().toISOString(),
    };
  } catch (parseError) {
    throw new Error(`Échec de lecture du rapport de correction : ${(parseError as Error).message}\nContenu reçu : ${rawText.slice(0, 300)}...`);
  }
}

/**
 * Permet au candidat de converser avec l'examinateur pour approfondir la correction (Remédiation)
 */
export async function poserQuestionRemediation(
  cleApi: string,
  modele: string = DEFAULT_MODEL,
  rapport: RapportDeCorrection,
  historiqueMessages: MessageRemediation[],
  nouvelleQuestion: string
): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modele}:generateContent?key=${cleApi}`;

  const promptSysteme = `Tu es l'examinateur du jury du CAPES de Mathématiques qui vient d'évaluer la copie du candidat.
Voici le rapport d'évaluation que tu as produit :
${JSON.stringify(rapport, null, 2)}

Le candidat te pose une question pour comprendre un point de correction, approfondir une démonstration ou corriger son incompréhension.
Réponds avec bienveillance mais sans rien céder sur la rigueur mathématique et les normes du CAPES. Utilise impérativement la notation LaTeX ($...$ ou $$...$$) pour toute formule mathématique.`;

  const contents = [
    ...historiqueMessages.map((msg) => ({
      role: msg.auteur === 'candidat' ? 'user' : 'model',
      parts: [{ text: msg.contenu }],
    })),
    {
      role: 'user',
      parts: [{ text: nouvelleQuestion }],
    },
  ];

  const payload = {
    systemInstruction: {
      parts: [{ text: promptSysteme }],
    },
    contents,
    generationConfig: {
      temperature: 0.3,
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Erreur lors de la remédiation (${response.status})`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Aucune réponse reçue.';
}
