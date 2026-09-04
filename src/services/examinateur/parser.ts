import type { RapportDeCorrection } from "../../types/domain";

/**
 * Nettoie une chaîne de réponse brute du modèle et parse le JSON de façon résiliente.
 * Tolère les blocs Markdown ```json ... ``` et le texte préliminaire ou subséquent.
 */
export function extraireEtParserRapport(rawText: string): RapportDeCorrection {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("L'examinateur n'a retourné aucun contenu texte.");
  }

  let text = rawText.trim();

  // Retirer les blocs markdown ```json ... ``` ou ``` ... ```
  if (text.includes("```")) {
    text = text.replace(/```(?:json)?\s*([\s\S]*?)\s*```/gi, "$1").trim();
  }

  // Extraire la première sous-chaîne délimitée par { et }
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error(
      `Format de réponse invalide : aucun objet JSON détecté.\nExtrait reçu : ${text.slice(0, 200)}...`
    );
  }

  const jsonSubstring = text.slice(firstBrace, lastBrace + 1);

  let parsed: any;
  try {
    parsed = JSON.parse(jsonSubstring);
  } catch (err) {
    throw new Error(
      `Échec du parsing JSON du rapport : ${(err as Error).message}\nContenu : ${jsonSubstring.slice(0, 300)}...`
    );
  }

  return {
    transcription:
      typeof parsed.transcription === "string" ? parsed.transcription : "",
    verdict: {
      noteIndicative: parsed.verdict?.noteIndicative || undefined,
      appreciationGlobale:
        typeof parsed.verdict?.appreciationGlobale === "string"
          ? parsed.verdict.appreciationGlobale
          : "Évaluation complétée.",
      pointsForts: Array.isArray(parsed.verdict?.pointsForts)
        ? parsed.verdict.pointsForts
        : [],
      erreursCritiques: Array.isArray(parsed.verdict?.erreursCritiques)
        ? parsed.verdict.erreursCritiques
        : [],
    },
    fond: {
      analyseDetaillee:
        typeof parsed.fond?.analyseDetaillee === "string"
          ? parsed.fond.analyseDetaillee
          : "",
      theoremesEtHypotheses: Array.isArray(parsed.fond?.theoremesEtHypotheses)
        ? parsed.fond.theoremesEtHypotheses
        : [],
      validiteDemonstrations:
        typeof parsed.fond?.validiteDemonstrations === "string"
          ? parsed.fond.validiteDemonstrations
          : "",
    },
    forme: {
      analyseDetaillee:
        typeof parsed.forme?.analyseDetaillee === "string"
          ? parsed.forme.analyseDetaillee
          : "",
      rigueurNotationsEtQuantificateurs:
        typeof parsed.forme?.rigueurNotationsEtQuantificateurs === "string"
          ? parsed.forme.rigueurNotationsEtQuantificateurs
          : "",
      qualiteRedactionnelle:
        typeof parsed.forme?.qualiteRedactionnelle === "string"
          ? parsed.forme.qualiteRedactionnelle
          : "",
      respectDesNormesDuJury:
        typeof parsed.forme?.respectDesNormesDuJury === "string"
          ? parsed.forme.respectDesNormesDuJury
          : "",
    },
    redactionModele:
      typeof parsed.redactionModele === "string" ? parsed.redactionModele : "",
    dateGeneration: new Date().toISOString(),
  };
}
