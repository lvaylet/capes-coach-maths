import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  DefaultImageIngestionPipeline,
  MockCanvasProcessor,
  creerPipelineImages,
} from "./index";
import type { PageImage } from "../../types/domain";

describe("ImageIngestionPipeline", () => {
  let mockCanvas: MockCanvasProcessor;
  let pipeline: DefaultImageIngestionPipeline;

  beforeEach(() => {
    mockCanvas = new MockCanvasProcessor({
      mockBase64: "fake-base64-data",
    });
    pipeline = new DefaultImageIngestionPipeline(mockCanvas);
  });

  describe("Validation des fichiers", () => {
    it("accepte les formats autorisés (JPEG, PNG, WebP)", () => {
      const jpeg = new File(["dummy"], "page1.jpg", { type: "image/jpeg" });
      const png = new File(["dummy"], "page2.png", { type: "image/png" });
      const webp = new File(["dummy"], "page3.webp", { type: "image/webp" });

      expect(pipeline.validerFichier(jpeg)).toEqual({
        valide: true,
        typeMime: "image/jpeg",
      });
      expect(pipeline.validerFichier(png)).toEqual({
        valide: true,
        typeMime: "image/png",
      });
      expect(pipeline.validerFichier(webp)).toEqual({
        valide: true,
        typeMime: "image/webp",
      });
    });

    it("détecte le format par extension si le type MIME est vide ou générique", () => {
      const genericJpg = new File(["dummy"], "photo.jpeg", {
        type: "application/octet-stream",
      });
      const emptyPng = new File(["dummy"], "copie.png", { type: "" });

      expect(pipeline.validerFichier(genericJpg)).toEqual({
        valide: true,
        typeMime: "image/jpeg",
      });
      expect(pipeline.validerFichier(emptyPng)).toEqual({
        valide: true,
        typeMime: "image/png",
      });
    });

    it("rejette explicitement les fichiers PDF avec un message pédagogique", () => {
      const pdf = new File(["%PDF-1.4"], "sujet.pdf", {
        type: "application/pdf",
      });
      const pdfByName = new File(["%PDF-1.4"], "sujet.PDF", { type: "" });

      const res1 = pipeline.validerFichier(pdf);
      expect(res1.valide).toBe(false);
      if (!res1.valide) {
        expect(res1.erreur).toContain("PDF");
        expect(res1.erreur).toContain("ne sont pas pris en charge directement");
      }

      const res2 = pipeline.validerFichier(pdfByName);
      expect(res2.valide).toBe(false);
      if (!res2.valide) {
        expect(res2.erreur).toContain("PDF");
      }
    });

    it("rejette les formats non pris en charge (ex: texte, word)", () => {
      const text = new File(["texte"], "notes.txt", { type: "text/plain" });
      const docx = new File(["doc"], "devoir.docx", {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      const resText = pipeline.validerFichier(text);
      expect(resText.valide).toBe(false);
      if (!resText.valide) {
        expect(resText.erreur).toContain("Format non pris en charge");
      }

      const resDocx = pipeline.validerFichier(docx);
      expect(resDocx.valide).toBe(false);
    });
  });

  describe("Ingestion de fichiers", () => {
    it("ingère un fichier image valide et retourne une PageImage bien typée", async () => {
      const file = new File(["image-bytes"], "page1.jpg", {
        type: "image/jpeg",
      });
      const page = await pipeline.ingererFichier(file, 2);

      expect(page.id).toBeDefined();
      expect(page.nomFichier).toBe("page1.jpg");
      expect(page.blob).toBe(file);
      expect(page.rotation).toBe(0);
      expect(page.ordre).toBe(2);
      expect(page.previewUrl).toBeDefined();
    });

    it("refuse d’ingérer un fichier invalide et lève une exception", async () => {
      const badFile = new File(["bad"], "doc.pdf", {
        type: "application/pdf",
      });
      await expect(pipeline.ingererFichier(badFile, 0)).rejects.toThrow(
        /PDF ne sont pas pris en charge/
      );
    });

    it("ingère un lot de fichiers séquentiellement avec incrémentation des ordres", async () => {
      const files = [
        new File(["1"], "page1.jpg", { type: "image/jpeg" }),
        new File(["2"], "page2.png", { type: "image/png" }),
      ];

      const pages = await pipeline.ingererFichiers(files, 3);

      expect(pages).toHaveLength(2);
      expect(pages[0].ordre).toBe(3);
      expect(pages[0].nomFichier).toBe("page1.jpg");
      expect(pages[1].ordre).toBe(4);
      expect(pages[1].nomFichier).toBe("page2.png");
    });
  });

  describe("Rotation des pages", () => {
    it("effectue la rotation par incréments de 90° sans muter l’objet d’origine", () => {
      const pageInitiale: PageImage = {
        id: "p1",
        blob: new Blob(["data"]),
        previewUrl: "blob:p1",
        nomFichier: "page1.jpg",
        rotation: 0,
        ordre: 0,
      };

      const page90 = pipeline.pivoterPage(pageInitiale);
      expect(page90.rotation).toBe(90);
      expect(pageInitiale.rotation).toBe(0); // Immutabilité préservée

      const page180 = pipeline.pivoterPage(page90);
      expect(page180.rotation).toBe(180);

      const page270 = pipeline.pivoterPage(page180);
      expect(page270.rotation).toBe(270);

      const page360 = pipeline.pivoterPage(page270);
      expect(page360.rotation).toBe(0); // Cycle complet normalisé à 0°
    });

    it("gère les incréments personnalisés et négatifs", () => {
      const page: PageImage = {
        id: "p1",
        blob: new Blob(["data"]),
        previewUrl: "blob:p1",
        nomFichier: "page1.jpg",
        rotation: 0,
        ordre: 0,
      };

      const rotMoins90 = pipeline.pivoterPage(page, -90);
      expect(rotMoins90.rotation).toBe(270);

      const rot180 = pipeline.pivoterPage(page, 180);
      expect(rot180.rotation).toBe(180);
    });
  });

  describe("Libération mémoire (Object URL cleanup)", () => {
    let originalRevoke: typeof URL.revokeObjectURL;

    beforeEach(() => {
      originalRevoke = URL.revokeObjectURL;
    });

    afterEach(() => {
      URL.revokeObjectURL = originalRevoke;
    });

    it("révoque l’Object URL lors de la libération d’une page", () => {
      const revokeMock = vi.fn();
      URL.revokeObjectURL = revokeMock;

      const page: PageImage = {
        id: "p1",
        blob: new Blob(["data"]),
        previewUrl: "blob:http://localhost:5173/uuid-1234",
        nomFichier: "page1.jpg",
        rotation: 0,
        ordre: 0,
      };

      pipeline.libererPage(page);
      expect(revokeMock).toHaveBeenCalledWith(
        "blob:http://localhost:5173/uuid-1234"
      );
    });

    it("libère une liste de pages", () => {
      const revokeMock = vi.fn();
      URL.revokeObjectURL = revokeMock;

      const pages: PageImage[] = [
        {
          id: "p1",
          blob: new Blob(["1"]),
          previewUrl: "blob:uuid-1",
          nomFichier: "1.jpg",
          rotation: 0,
          ordre: 0,
        },
        {
          id: "p2",
          blob: new Blob(["2"]),
          previewUrl: "blob:uuid-2",
          nomFichier: "2.jpg",
          rotation: 0,
          ordre: 1,
        },
      ];

      pipeline.libererPages(pages);
      expect(revokeMock).toHaveBeenCalledTimes(2);
      expect(revokeMock).toHaveBeenCalledWith("blob:uuid-1");
      expect(revokeMock).toHaveBeenCalledWith("blob:uuid-2");
    });

    it("ne plante pas si previewUrl n’est pas un blob URL", () => {
      const revokeMock = vi.fn();
      URL.revokeObjectURL = revokeMock;

      const page: PageImage = {
        id: "p1",
        blob: new Blob(["data"]),
        previewUrl: "https://example.com/image.jpg",
        nomFichier: "page1.jpg",
        rotation: 0,
        ordre: 0,
      };

      pipeline.libererPage(page);
      expect(revokeMock).not.toHaveBeenCalled();
    });
  });

  describe("Recadrage des pages", () => {
    let originalRevoke: typeof URL.revokeObjectURL;

    beforeEach(() => {
      originalRevoke = URL.revokeObjectURL;
    });

    afterEach(() => {
      URL.revokeObjectURL = originalRevoke;
    });

    it("délègue le recadrage et la rotation au CanvasProcessor, révoque l'ancien previewUrl et réinitialise la rotation à 0", async () => {
      const revokeMock = vi.fn();
      URL.revokeObjectURL = revokeMock;

      const initialBlob = new Blob(["initial-bytes"], { type: "image/jpeg" });
      const page: PageImage = {
        id: "p1",
        blob: initialBlob,
        previewUrl: "blob:http://localhost:5173/ancien-uuid",
        nomFichier: "page1.jpg",
        rotation: 90,
        ordre: 1,
      };

      const recadrage = { x: 0.1, y: 0.2, width: 0.8, height: 0.7 };
      const pageRecadree = await pipeline.recadrerPage(page, recadrage, 180);

      // Vérifie la révocation de l'ancienne Object URL
      expect(revokeMock).toHaveBeenCalledWith(
        "blob:http://localhost:5173/ancien-uuid"
      );

      // Vérifie l'appel au CanvasProcessor
      expect(mockCanvas.appelsRecadrerEtPivoter).toHaveLength(1);
      expect(mockCanvas.appelsRecadrerEtPivoter[0]).toEqual({
        blob: initialBlob,
        recadrage,
        angleDegres: 180,
        options: undefined,
      });

      // Vérifie les propriétés du résultat
      expect(pageRecadree.id).toBe("p1");
      expect(pageRecadree.nomFichier).toBe("page1.jpg");
      expect(pageRecadree.ordre).toBe(1);
      expect(pageRecadree.rotation).toBe(0);
      expect(pageRecadree.previewUrl).toBeDefined();
      expect(pageRecadree.previewUrl).not.toBe(
        "blob:http://localhost:5173/ancien-uuid"
      );
    });

    it("utilise la rotation actuelle de la page si aucun nouvel angle n'est précisé", async () => {
      const page: PageImage = {
        id: "p2",
        blob: new Blob(["bytes"]),
        previewUrl: "blob:url",
        nomFichier: "page2.jpg",
        rotation: 270,
        ordre: 0,
      };

      const recadrage = { x: 0, y: 0, width: 1, height: 1 };
      await pipeline.recadrerPage(page, recadrage);

      expect(mockCanvas.appelsRecadrerEtPivoter).toHaveLength(1);
      expect(mockCanvas.appelsRecadrerEtPivoter[0].angleDegres).toBe(270);
    });
  });

  describe("Préparation pour l’API de l’examinateur", () => {
    it("délègue le traitement graphique et l’encodage Base64 au CanvasProcessor", async () => {
      const blob = new Blob(["sample-image"], { type: "image/jpeg" });
      const page: PageImage = {
        id: "p1",
        blob,
        previewUrl: "blob:test",
        nomFichier: "copie.jpg",
        rotation: 90,
        ordre: 0,
      };

      const res = await pipeline.preparerPourApi(page, {
        maxDimension: 1024,
        qualiteJpeg: 0.8,
      });

      expect(mockCanvas.appelsTraiter).toHaveLength(1);
      expect(mockCanvas.appelsTraiter[0]).toEqual({
        blob,
        angleDegres: 90,
        options: { maxDimension: 1024, qualiteJpeg: 0.8 },
      });
      expect(mockCanvas.appelsBase64).toHaveLength(1);
      expect(res).toEqual({
        mimeType: "image/jpeg",
        data: "fake-base64-data",
      });
    });

    it("propage les erreurs du CanvasProcessor lors de la préparation", async () => {
      const failingMock = new MockCanvasProcessor({
        simulerErreurTraitement: true,
      });
      const failingPipeline = new DefaultImageIngestionPipeline(failingMock);

      const page: PageImage = {
        id: "p1",
        blob: new Blob(["sample"]),
        previewUrl: "blob:test",
        nomFichier: "copie.jpg",
        rotation: 0,
        ordre: 0,
      };

      await expect(failingPipeline.preparerPourApi(page)).rejects.toThrow(
        "Erreur simulée lors du traitement Canvas"
      );
    });
  });

  describe("Fabrique creerPipelineImages", () => {
    it("instancie un pipeline fonctionnel avec injection de processeur", () => {
      const p = creerPipelineImages(mockCanvas);
      expect(p).toBeInstanceOf(DefaultImageIngestionPipeline);
    });
  });
});
