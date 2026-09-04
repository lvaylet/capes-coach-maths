import type { PageImage } from "../../types/domain";
import {
  TYPES_MIME_IMAGES_ACCEPTES,
  type CanvasProcessor,
  type ImageIngestionPipeline,
  type ImagePrepareeApi,
  type OptionsPretraitement,
  type RectangleRecadrage,
  type ResultatValidationFichier,
  type TypeMimeImageAccepte,
} from "./types";
import { BrowserCanvasProcessor } from "./canvasProcessor";

/**
 * Pipeline centralisant l'ingestion, la validation, la rotation, la libération mémoire
 * et la préparation API des pages de copies manuscrites et d'énoncés.
 */
export class DefaultImageIngestionPipeline implements ImageIngestionPipeline {
  constructor(
    private canvasProcessor: CanvasProcessor = new BrowserCanvasProcessor()
  ) {}

  /**
   * Valide strictement le fichier soumis : seuls JPEG, PNG et WebP sont autorisés.
   * Retourne un message d'erreur clair en français en cas de tentative d'import de PDF ou de format incompatible.
   */
  validerFichier(
    file: File | Blob,
    nomFichier?: string
  ): ResultatValidationFichier {
    const nom = nomFichier || (file instanceof File ? file.name : "") || "";
    const nomMinuscule = nom.toLowerCase();

    // 1. Rejet explicite et pédagogique des PDF
    if (file.type === "application/pdf" || nomMinuscule.endsWith(".pdf")) {
      return {
        valide: false,
        erreur:
          "Les fichiers PDF ne sont pas pris en charge directement. Veuillez fournir des images (JPEG, PNG, WebP) ou photographier votre copie.",
      };
    }

    // 2. Détection du type MIME (y compris si l'OS n'a pas renseigné file.type)
    let typeMime = file.type;
    if (!typeMime || typeMime === "application/octet-stream") {
      if (nomMinuscule.endsWith(".jpg") || nomMinuscule.endsWith(".jpeg")) {
        typeMime = "image/jpeg";
      } else if (nomMinuscule.endsWith(".png")) {
        typeMime = "image/png";
      } else if (nomMinuscule.endsWith(".webp")) {
        typeMime = "image/webp";
      }
    }

    // 3. Vérification des formats acceptés
    if (TYPES_MIME_IMAGES_ACCEPTES.includes(typeMime as TypeMimeImageAccepte)) {
      return {
        valide: true,
        typeMime: typeMime as TypeMimeImageAccepte,
      };
    }

    return {
      valide: false,
      erreur:
        "Format non pris en charge. Seuls les formats d'image JPEG, PNG et WebP sont acceptés.",
    };
  }

  /**
   * Ingestion et instanciation d'une PageImage après validation stricte
   */
  async ingererFichier(file: File, ordre: number): Promise<PageImage> {
    const validation = this.validerFichier(file);
    if (!validation.valide) {
      throw new Error(validation.erreur);
    }

    const id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `img-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const previewUrl =
      typeof URL !== "undefined" && typeof URL.createObjectURL === "function"
        ? URL.createObjectURL(file)
        : `blob:${id}`;

    return {
      id,
      blob: file,
      previewUrl,
      nomFichier: file.name,
      rotation: 0,
      ordre,
    };
  }

  /**
   * Ingestion séquentielle d'un lot de fichiers avec préservation de l'ordre
   */
  async ingererFichiers(
    files: File[],
    ordreInitial: number = 0
  ): Promise<PageImage[]> {
    const pages: PageImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const page = await this.ingererFichier(files[i], ordreInitial + i);
      pages.push(page);
    }
    return pages;
  }

  /**
   * Rotation d'une page par incrément de 90° (normalisé modulo 360°)
   */
  pivoterPage(page: PageImage, angleIncrement: number = 90): PageImage {
    const rotation = (((page.rotation + angleIncrement) % 360) + 360) % 360;
    return {
      ...page,
      rotation,
    };
  }

  /**
   * Recadre une page selon un rectangle relatif [0, 1] et applique une rotation.
   * Révoque l'ancien previewUrl, alloue une nouvelle URL et réinitialise l'angle à 0.
   */
  async recadrerPage(
    page: PageImage,
    recadrage: RectangleRecadrage,
    nouvelAngle?: number,
    options?: OptionsPretraitement
  ): Promise<PageImage> {
    const angle = nouvelAngle !== undefined ? nouvelAngle : page.rotation;
    const blobTraite = await this.canvasProcessor.recadrerEtPivoterImage(
      page.blob,
      recadrage,
      angle,
      options
    );

    // Libération de l'ancienne URL d'aperçu pour éviter les fuites mémoire
    this.libererPage(page);

    const previewUrl =
      typeof URL !== "undefined" && typeof URL.createObjectURL === "function"
        ? URL.createObjectURL(blobTraite)
        : `blob:${page.id}-recadree-${Date.now()}`;

    return {
      ...page,
      blob: blobTraite,
      previewUrl,
      rotation: 0,
    };
  }

  /**
   * Libération explicite de l'URL d'aperçu d'une page (évite les fuites de mémoire)
   */
  libererPage(page: PageImage): void {
    if (
      typeof URL !== "undefined" &&
      typeof URL.revokeObjectURL === "function" &&
      page.previewUrl &&
      page.previewUrl.startsWith("blob:")
    ) {
      URL.revokeObjectURL(page.previewUrl);
    }
  }

  /**
   * Libération d'un ensemble de pages
   */
  libererPages(pages: PageImage[]): void {
    for (const page of pages) {
      this.libererPage(page);
    }
  }

  /**
   * Préparation et optimisation d'une page pour l'API multimodale de l'examinateur
   */
  async preparerPourApi(
    page: PageImage,
    options?: OptionsPretraitement
  ): Promise<ImagePrepareeApi> {
    const blobTraite = await this.canvasProcessor.traiterImage(
      page.blob,
      page.rotation,
      options
    );
    const data = await this.canvasProcessor.blobVersBase64(blobTraite);
    return {
      mimeType: "image/jpeg",
      data,
    };
  }
}
