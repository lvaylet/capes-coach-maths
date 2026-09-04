import { describe, it, expect } from "vitest";
import {
  creerExaminateur,
  construirePromptSysteme,
  extraireEtParserRapport,
  FakeExaminateurAdapter,
  GeminiExaminateurAdapter,
} from "./index";

describe("Module Approfondi ExaminateurJury", () => {
  describe("Prompting du Jury (prompt.ts)", () => {
    it("doit inclure les critères disciplinaires stricts pour l'épreuve 1", () => {
      const prompt = construirePromptSysteme("epreuve-1");
      expect(prompt).toContain("ÉPREUVE 1 du CAPES");
      expect(prompt).toContain("Rigueur formelle absolue");
      expect(prompt).toContain("RIGUEUR DE LA QUANTIFICATION");
      expect(prompt).toContain("CONNECTEURS LOGIQUES ET RÉDACTION");
      expect(prompt).toContain("VÉRIFICATION DES HYPOTHÈSES");
    });

    it("doit inclure les critères de didactique et Python pour l'épreuve 2", () => {
      const prompt = construirePromptSysteme("epreuve-2");
      expect(prompt).toContain("ÉPREUVE 2 du CAPES");
      expect(prompt).toContain("Clarté didactique");
      expect(prompt).toContain("Python");
    });

    it("doit injecter les consignes spécifiques transmises par le candidat", () => {
      const consigne =
        "Pénaliser sévèrement l'absence de quantificateurs universels.";
      const prompt = construirePromptSysteme("epreuve-1", consigne);
      expect(prompt).toContain(consigne);
    });
  });

  describe("Résilience du Parsing JSON (parser.ts)", () => {
    it("doit parser un JSON brut propre sans balises markdown", () => {
      const raw = JSON.stringify({
        transcription: "Soit x un réel...",
        verdict: { appreciationGlobale: "Bon travail." },
        fond: { validiteDemonstrations: "Démonstrations solides." },
        forme: { qualiteRedactionnelle: "Bien rédigé." },
        redactionModele: "$$x^2 + 1 > 0$$",
      });

      const rapport = extraireEtParserRapport(raw);
      expect(rapport.transcription).toBe("Soit x un réel...");
      expect(rapport.verdict.appreciationGlobale).toBe("Bon travail.");
      expect(rapport.redactionModele).toBe("$$x^2 + 1 > 0$$");
      expect(rapport.dateGeneration).toBeDefined();
    });

    it("doit extraire et parser le JSON encadré par des balises Markdown ```json", () => {
      const wrapped = `
Voici l'évaluation détaillée :
\`\`\`json
{
  "transcription": "Calcul de la dérivée...",
  "verdict": {
    "appreciationGlobale": "Prestation convaincante.",
    "pointsForts": ["Calculs exacts"],
    "erreursCritiques": []
  },
  "fond": {
    "analyseDetaillee": "Étapes respectées.",
    "theoremesEtHypotheses": ["Continuité vérifiée"],
    "validiteDemonstrations": "Valide."
  },
  "forme": {
    "analyseDetaillee": "Très lisible.",
    "rigueurNotationsEtQuantificateurs": "Excellente.",
    "qualiteRedactionnelle": "Formelle.",
    "respectDesNormesDuJury": "Conforme."
  },
  "redactionModele": "Rédaction modèle complète."
}
\`\`\`
En espérant que ce retour vous soit utile pour le concours.
`;

      const rapport = extraireEtParserRapport(wrapped);
      expect(rapport.transcription).toBe("Calcul de la dérivée...");
      expect(rapport.verdict.pointsForts).toContain("Calculs exacts");
      expect(rapport.fond.theoremesEtHypotheses).toContain(
        "Continuité vérifiée"
      );
    });

    it("doit lever une erreur explicite si aucun objet JSON n'est détecté", () => {
      const invalid = "Je suis désolé, je ne peux pas traiter ces images.";
      expect(() => extraireEtParserRapport(invalid)).toThrowError(
        /aucun objet JSON détecté/
      );
    });
  });

  describe("Adaptateur Simulé (fakeAdapter.ts)", () => {
    it("doit fournir un rapport de jury complet et conforme avec KaTeX par défaut", async () => {
      const fake = new FakeExaminateurAdapter();
      expect(fake.estModeSimulation).toBe(true);

      const rapport = await fake.evaluerCopie({
        epreuve: "epreuve-1",
        enoncePages: [],
        copiePages: [
          {
            id: "1",
            nomFichier: "page1.jpg",
            rotation: 0,
            blob: new Blob(["fake"]),
            previewUrl: "",
            ordre: 1,
          },
        ],
      });

      expect(rapport.verdict.pointsForts.length).toBeGreaterThan(0);
      expect(rapport.verdict.erreursCritiques.length).toBeGreaterThan(0);
      expect(rapport.fond.analyseDetaillee).toContain("$\\mathbb{R}$");
      expect(rapport.redactionModele).toContain("$$");
    });

    it("doit permettre d'injecter une erreur simulée pour tester la résilience des appelants", async () => {
      const fake = new FakeExaminateurAdapter(
        0,
        new Error("Simulation d'erreur de quota")
      );
      await expect(
        fake.evaluerCopie({
          epreuve: "epreuve-1",
          enoncePages: [],
          copiePages: [],
        })
      ).rejects.toThrow("Simulation d'erreur de quota");
    });

    it("doit générer une réponse de remédiation mathématique", async () => {
      const fake = new FakeExaminateurAdapter();
      const reponse = await fake.poserQuestionRemediation({
        rapport: {} as any,
        historiqueMessages: [],
        nouvelleQuestion: "Pourquoi l'intervalle doit-il être stable ?",
      });

      expect(reponse).toContain("stable par $f$");
      expect(reponse).toContain("$$");
    });
  });

  describe("Fabrique creerExaminateur (index.ts)", () => {
    it("doit instancier le FakeExaminateurAdapter si aucune clé API n'est transmise", () => {
      const examinateur = creerExaminateur();
      expect(examinateur.estModeSimulation).toBe(true);
      expect(examinateur).toBeInstanceOf(FakeExaminateurAdapter);
    });

    it("doit instancier le FakeExaminateurAdapter si forcerSimulation est vrai même avec une clé", () => {
      const examinateur = creerExaminateur({
        cleApi: "fake-key-123",
        forcerSimulation: true,
      });
      expect(examinateur.estModeSimulation).toBe(true);
      expect(examinateur).toBeInstanceOf(FakeExaminateurAdapter);
    });

    it("doit instancier le GeminiExaminateurAdapter si une clé API valide est fournie", () => {
      const examinateur = creerExaminateur({ cleApi: "AIzaSyActualKey..." });
      expect(examinateur.estModeSimulation).toBe(false);
      expect(examinateur).toBeInstanceOf(GeminiExaminateurAdapter);
    });
  });
});
