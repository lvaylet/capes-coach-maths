import { describe, it, expect, beforeEach } from "vitest";
import {
  DefaultFormateurRapport,
  MockTelechargeur,
  creerFormateurRapport,
} from "./index";
import type { RapportDeCorrection } from "../types/domain";

describe("Module de Formatage et Export de Rapport (src/rapport)", () => {
  let mockTelechargeur: MockTelechargeur;
  let formateur: DefaultFormateurRapport;

  const rapportTest: RapportDeCorrection = {
    transcription: "Soit E un espace vectoriel de dimension finie...",
    verdict: {
      noteIndicative: "16/20",
      appreciationGlobale: "Excellente copie, rigueur mathématique exemplaire.",
      pointsForts: [
        "Quantification impeccable",
        "Hypothèses des théorèmes toujours vérifiées",
      ],
      erreursCritiques: ["Légère imprécision à la question 2.b"],
    },
    fond: {
      analyseDetaillee: "Le candidat maîtrise les théorèmes de réduction.",
      theoremesEtHypotheses: [
        "Théorème spectral pour les endomorphismes symétriques",
        "Caractérisation de la diagonalisabilité",
      ],
      validiteDemonstrations: "Démonstrations valides et structurées.",
    },
    forme: {
      analyseDetaillee: "Rédaction exemplaire.",
      rigueurNotationsEtQuantificateurs:
        "Parfaite maîtrise de $\\forall$ et $\\exists$.",
      qualiteRedactionnelle: "Fluide et concise.",
      respectDesNormesDuJury:
        "Conforme aux recommandations du rapport du jury.",
    },
    redactionModele: "$$\\text{Sp}(u) \\subset \\mathbb{R} \\implies \\dots$$",
    dateGeneration: "2026-09-04T10:00:00.000Z",
  };

  beforeEach(() => {
    mockTelechargeur = new MockTelechargeur();
    formateur = new DefaultFormateurRapport(mockTelechargeur);
  });

  describe("Génération du nom de fichier (genererNomFichier)", () => {
    it("génère un nom slugifié propre sans caractères spéciaux ni accents", () => {
      const nom1 = formateur.genererNomFichier(
        "Épreuve 1 - Algèbre & Géométrie 2026"
      );
      expect(nom1).toBe("rapport-capes-epreuve-1-algebre-geometrie-2026.md");

      const nom2 = formateur.genererNomFichier("Session CAPES");
      expect(nom2).toBe("rapport-capes-session-capes.md");
    });

    it("accepte une extension personnalisée", () => {
      const nom = formateur.genererNomFichier("Session", "txt");
      expect(nom).toBe("rapport-capes-session.txt");
    });

    it("gère les titres vides ou composés uniquement de symboles", () => {
      const nom = formateur.genererNomFichier("   ???   ");
      expect(nom).toBe("rapport-capes-session.md");
    });
  });

  describe("Synthèse Markdown (genererMarkdown)", () => {
    it("génère un document Markdown complet contenant toutes les sections de domaine", () => {
      const md = formateur.genererMarkdown(rapportTest, "Session Test 2026");

      // Titre et date
      expect(md).toContain(
        "# Rapport d'évaluation CAPES de Mathématiques - Session Test 2026"
      );
      expect(md).toContain("Date :");

      // Verdict
      expect(md).toContain("## Verdict");
      expect(md).toContain("- Note indicative : 16/20");
      expect(md).toContain(
        "Excellente copie, rigueur mathématique exemplaire."
      );
      expect(md).toContain("- Quantification impeccable");
      expect(md).toContain("- Légère imprécision à la question 2.b");

      // Fond
      expect(md).toContain("## Analyse du Fond");
      expect(md).toContain(
        "Théorème spectral pour les endomorphismes symétriques"
      );
      expect(md).toContain("Démonstrations valides et structurées.");

      // Forme
      expect(md).toContain("## Analyse de la Forme");
      expect(md).toContain("Parfaite maîtrise de $\\forall$ et $\\exists$.");
      expect(md).toContain("Conforme aux recommandations du rapport du jury.");

      // Rédaction Modèle et Transcription
      expect(md).toContain("## Rédaction Modèle du Jury");
      expect(md).toContain("$$\\text{Sp}(u) \\subset \\mathbb{R}");
      expect(md).toContain("## Transcription manuscrite déchiffrée");
      expect(md).toContain("Soit E un espace vectoriel");
    });

    it("gère les listes vides sans planter", () => {
      const rapportVide: RapportDeCorrection = {
        ...rapportTest,
        verdict: {
          noteIndicative: undefined,
          appreciationGlobale: "Travail partiel.",
          pointsForts: [],
          erreursCritiques: [],
        },
        fond: {
          ...rapportTest.fond,
          theoremesEtHypotheses: [],
        },
      };

      const md = formateur.genererMarkdown(rapportVide);
      expect(md).toContain("- Note indicative : Non noté");
      expect(md).toContain("- Aucun point fort spécifique relevé.");
      expect(md).toContain("- Aucune erreur critique majeure constatée.");
      expect(md).toContain("- Aucun théorème spécifique listé.");
    });
  });

  describe("Téléchargement du fichier (telechargerMarkdown)", () => {
    it("délègue le téléchargement au TelechargeurFichier avec le bon nom et type MIME", async () => {
      await formateur.telechargerMarkdown(rapportTest, "Analyse 2026");

      expect(mockTelechargeur.appelsTelechargement).toHaveLength(1);
      const appel = mockTelechargeur.appelsTelechargement[0];

      expect(appel.nomFichier).toBe("rapport-capes-analyse-2026.md");
      expect(appel.typeMime).toBe("text/markdown;charset=utf-8;");
      expect(appel.contenu).toContain(
        "# Rapport d'évaluation CAPES de Mathématiques - Analyse 2026"
      );
    });
  });

  describe("Presse-papier (copierDansPressePapier)", () => {
    it("délègue la copie textuelle au TelechargeurFichier", async () => {
      const succes = await formateur.copierDansPressePapier(
        rapportTest,
        "Session"
      );

      expect(succes).toBe(true);
      expect(mockTelechargeur.appelsCopie).toHaveLength(1);
      expect(mockTelechargeur.appelsCopie[0]).toContain("## Verdict");
    });

    it("retourne false en cas d'échec de la copie", async () => {
      const failingTelechargeur = new MockTelechargeur({
        simulerEchecCopie: true,
      });
      const failingFormateur = new DefaultFormateurRapport(failingTelechargeur);

      const succes = await failingFormateur.copierDansPressePapier(rapportTest);
      expect(succes).toBe(false);
    });
  });

  describe("Fabrique creerFormateurRapport", () => {
    it("instancie un FormateurRapport avec processeur injecté", () => {
      const instance = creerFormateurRapport(mockTelechargeur);
      expect(instance).toBeInstanceOf(DefaultFormateurRapport);
    });
  });
});
