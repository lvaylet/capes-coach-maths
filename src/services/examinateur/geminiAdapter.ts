import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import type { RapportDeCorrection } from "../../types/domain";
import { type ImageIngestionPipeline, imagePipeline } from "../../utils/image";
import type {
  ExaminateurJury,
  OptionsEvaluation,
  OptionsRemediation,
} from "./types";
import {
  DEFAULT_MODEL,
  construirePromptSysteme,
  construirePromptRemediation,
} from "./prompt";
import { extraireEtParserRapport } from "./parser";

/**
 * Adaptateur de production connectant l'application à l'API Google Gemini
 * via le SDK officiel @google/generative-ai.
 */
export class GeminiExaminateurAdapter implements ExaminateurJury {
  readonly estModeSimulation = false;
  private genAI: GoogleGenerativeAI;

  constructor(
    cleApi: string,
    private modele: string = DEFAULT_MODEL,
    private pipeline: ImageIngestionPipeline = imagePipeline
  ) {
    if (!cleApi) {
      throw new Error(
        "Une clé API Gemini est requise pour initialiser l'adaptateur de production."
      );
    }
    this.genAI = new GoogleGenerativeAI(cleApi);
  }

  async evaluerCopie(options: OptionsEvaluation): Promise<RapportDeCorrection> {
    const {
      epreuve,
      enoncePages,
      enonceTexte,
      copiePages,
      consignesSupplementaires,
    } = options;

    if (copiePages.length === 0) {
      throw new Error(
        "Veuillez fournir au moins une photo de votre copie manuscrite."
      );
    }

    const promptSysteme = construirePromptSysteme(
      epreuve,
      consignesSupplementaires
    );

    const parts: Part[] = [];

    // Message contextuel initial
    let messageInitial = `Voici la demande de correction pour le concours du CAPES de Mathématiques.\n\n`;
    if (enonceTexte?.trim()) {
      messageInitial += `Énoncé (transcription textuelle) :\n${enonceTexte.trim()}\n\n`;
    }
    messageInitial += `Ci-joint les photos de l'ÉNONCÉ puis les photos de la COPIE MANUSCRITE du candidat. Veuillez procéder à l'évaluation rigoureuse selon les consignes du jury.`;
    parts.push({ text: messageInitial });

    // Encodage des pages d'énoncé
    for (let i = 0; i < enoncePages.length; i++) {
      const page = enoncePages[i];
      const imageApi = await this.pipeline.preparerPourApi(page);
      parts.push({ text: `[ÉNONCÉ - Page ${i + 1}/${enoncePages.length}]` });
      parts.push({
        inlineData: {
          mimeType: imageApi.mimeType,
          data: imageApi.data,
        },
      });
    }

    // Encodage des pages de copie manuscrite
    for (let i = 0; i < copiePages.length; i++) {
      const page = copiePages[i];
      const imageApi = await this.pipeline.preparerPourApi(page);
      parts.push({
        text: `[COPIE MANUSCRITE DU CANDIDAT - Page ${i + 1}/${copiePages.length}]`,
      });
      parts.push({
        inlineData: {
          mimeType: imageApi.mimeType,
          data: imageApi.data,
        },
      });
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modele,
        systemInstruction: promptSysteme,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2, // Rigueur mathématique maximale
        },
      });

      const result = await model.generateContent(parts);
      const rawText = result.response.text();

      return extraireEtParserRapport(rawText);
    } catch (err) {
      const errorMsg = (err as Error).message || String(err);
      if (errorMsg.includes("API_KEY_INVALID") || errorMsg.includes("403")) {
        throw new Error(
          "Clé API Gemini invalide ou non autorisée. Vérifiez votre clé dans les réglages."
        );
      }
      if (errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("429")) {
        throw new Error(
          "Quota d'appels API Gemini dépassé. Veuillez réessayer dans quelques instants."
        );
      }
      throw new Error(`Erreur lors de l'évaluation Gemini : ${errorMsg}`);
    }
  }

  async poserQuestionRemediation(options: OptionsRemediation): Promise<string> {
    const { rapport, historiqueMessages, nouvelleQuestion } = options;
    const promptSysteme = construirePromptRemediation(rapport);

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modele,
        systemInstruction: promptSysteme,
        generationConfig: {
          temperature: 0.3,
        },
      });

      const contents = [
        ...historiqueMessages.map((msg) => ({
          role: msg.auteur === "candidat" ? "user" : "model",
          parts: [{ text: msg.contenu }],
        })),
        {
          role: "user",
          parts: [{ text: nouvelleQuestion }],
        },
      ];

      const result = await model.generateContent({ contents });
      return result.response.text() || "Aucune réponse reçue du jury.";
    } catch (err) {
      throw new Error(
        `Erreur lors de la remédiation : ${(err as Error).message}`
      );
    }
  }
}
