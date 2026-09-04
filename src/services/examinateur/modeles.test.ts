import { describe, it, expect, vi } from "vitest";
import {
  filtrerEtNormaliserModeles,
  obtenirModelesParDefaut,
  recupererModelesDepuisApi,
  type RawGeminiModel,
} from "./modeles";

describe("Gestion des modèles de l'examinateur (Gemini)", () => {
  describe("obtenirModelesParDefaut", () => {
    it("retourne une liste statique de modèles recommandés et bien structurés", () => {
      const modeles = obtenirModelesParDefaut();

      expect(modeles.length).toBeGreaterThanOrEqual(4);
      expect(modeles.some((m) => m.id === "gemini-2.5-flash")).toBe(true);
      expect(modeles.some((m) => m.id === "gemini-2.5-pro")).toBe(true);

      const defaut = modeles.find((m) => m.id === "gemini-2.5-flash");
      expect(defaut?.estRecommande).toBe(true);

      // Aucun identifiant ne doit contenir le préfixe technique models/
      for (const m of modeles) {
        expect(m.id.startsWith("models/")).toBe(false);
        expect(m.nomAffiche).toBeDefined();
      }
    });
  });

  describe("filtrerEtNormaliserModeles", () => {
    it("filtre les modèles non génératifs et retire le préfixe models/", () => {
      const rawModels: RawGeminiModel[] = [
        {
          name: "models/gemini-2.5-flash",
          displayName: "Gemini 2.5 Flash",
          description: "Modèle rapide et multimodal",
          supportedGenerationMethods: ["generateContent", "countTokens"],
        },
        {
          name: "models/text-embedding-004",
          displayName: "Text Embedding 004",
          description: "Modèle de plongements vectoriels",
          supportedGenerationMethods: ["embedContent"],
        },
        {
          name: "models/gemini-2.5-pro",
          displayName: "Gemini 2.5 Pro",
          description: "Modèle expert pour le raisonnement mathématique",
          supportedGenerationMethods: ["generateContent"],
        },
        {
          name: "models/aqa",
          displayName: "Attributed Question Answering",
          supportedGenerationMethods: ["generateAnswer"],
        },
      ];

      const resultat = filtrerEtNormaliserModeles(rawModels);

      expect(resultat).toHaveLength(2);
      expect(resultat.map((m) => m.id)).toEqual([
        "gemini-2.5-flash",
        "gemini-2.5-pro",
      ]);
      expect(resultat[0].nomAffiche).toBe("Gemini 2.5 Flash");
      expect(resultat[1].nomAffiche).toBe("Gemini 2.5 Pro");
    });

    it("identifie les modèles recommandés pour l'évaluation", () => {
      const rawModels: RawGeminiModel[] = [
        {
          name: "models/gemini-2.5-flash",
          displayName: "Gemini 2.5 Flash",
          supportedGenerationMethods: ["generateContent"],
        },
        {
          name: "models/gemini-1.5-flash-8b",
          displayName: "Gemini 1.5 Flash-8B",
          supportedGenerationMethods: ["generateContent"],
        },
      ];

      const resultat = filtrerEtNormaliserModeles(rawModels);
      const flash = resultat.find((m) => m.id === "gemini-2.5-flash");
      const flash8b = resultat.find((m) => m.id === "gemini-1.5-flash-8b");

      expect(flash?.estRecommande).toBe(true);
      expect(flash8b?.estRecommande).toBe(false);
    });
  });

  describe("recupererModelesDepuisApi", () => {
    it("renvoie la liste par défaut immédiatement si la clé API est vide", async () => {
      const mockFetch = vi.fn();
      const modeles = await recupererModelesDepuisApi(
        "",
        mockFetch as unknown as typeof fetch
      );

      expect(mockFetch).not.toHaveBeenCalled();
      expect(modeles).toEqual(obtenirModelesParDefaut());
    });

    it("interroge l'API Google avec la clé et retourne les modèles normalisés", async () => {
      const mockApiResponse = {
        models: [
          {
            name: "models/gemini-2.5-flash",
            displayName: "Gemini 2.5 Flash",
            supportedGenerationMethods: ["generateContent"],
          },
          {
            name: "models/gemini-2.5-pro",
            displayName: "Gemini 2.5 Pro",
            supportedGenerationMethods: ["generateContent"],
          },
          {
            name: "models/embedding-001",
            displayName: "Embedding",
            supportedGenerationMethods: ["embedContent"],
          },
        ],
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      });

      const modeles = await recupererModelesDepuisApi(
        "cle-test-123",
        mockFetch as unknown as typeof fetch
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "https://generativelanguage.googleapis.com/v1beta/models?key=cle-test-123"
      );
      expect(modeles).toHaveLength(2);
      expect(modeles[0].id).toBe("gemini-2.5-flash");
      expect(modeles[1].id).toBe("gemini-2.5-pro");
    });

    it("lève une exception claire en cas d'erreur HTTP de l'API", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: "Forbidden",
      });

      await expect(
        recupererModelesDepuisApi(
          "cle-invalide",
          mockFetch as unknown as typeof fetch
        )
      ).rejects.toThrow(/Clé API Gemini invalide ou accès refusé/);
    });

    it("lève une exception claire en cas d'erreur réseau", async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValue(new Error("Network connection failed"));

      await expect(
        recupererModelesDepuisApi(
          "cle-test",
          mockFetch as unknown as typeof fetch
        )
      ).rejects.toThrow(/Impossible de joindre l'API Google Gemini/);
    });
  });
});
