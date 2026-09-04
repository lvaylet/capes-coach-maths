import type {
  CanvasProcessor,
  OptionsPretraitement,
  RectangleRecadrage,
} from "./types";

/**
 * Charge un Blob d'image dans un élément HTMLImageElement avec gestion sécurisée de l'Object URL
 */
export function chargerImageElement(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

/**
 * Applique une rotation et compresse l'image via un HTMLCanvasElement
 */
export async function pivoterEtCompresserImage(
  blob: Blob,
  angleDegres: number = 0,
  maxDimension: number = 2048,
  qualiteJpeg: number = 0.85
): Promise<Blob> {
  const img = await chargerImageElement(blob);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Impossible d'obtenir le contexte 2D du Canvas");

  // Normaliser l'angle entre 0 et 359
  const angle = ((angleDegres % 360) + 360) % 360;

  // Calcul du redimensionnement conservant le ratio d'aspect
  let { width, height } = img;
  if (width > maxDimension || height > maxDimension) {
    const ratio = Math.min(maxDimension / width, maxDimension / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  // Dimensions du canvas selon l'orientation
  if (angle === 90 || angle === 270) {
    canvas.width = height;
    canvas.height = width;
  } else {
    canvas.width = width;
    canvas.height = height;
  }

  // Transformation et rotation
  ctx.save();
  if (angle === 90) {
    ctx.translate(height, 0);
    ctx.rotate((90 * Math.PI) / 180);
  } else if (angle === 180) {
    ctx.translate(width, height);
    ctx.rotate((180 * Math.PI) / 180);
  } else if (angle === 270) {
    ctx.translate(0, width);
    ctx.rotate((270 * Math.PI) / 180);
  }

  ctx.drawImage(img, 0, 0, width, height);
  ctx.restore();

  // Export en Blob JPEG
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (resultBlob) => {
        if (resultBlob) {
          resolve(resultBlob);
        } else {
          reject(new Error("Échec de la compression de l'image en Blob"));
        }
      },
      "image/jpeg",
      qualiteJpeg
    );
  });
}

/**
 * Applique un recadrage relatif [0, 1] et une rotation avant compression via un HTMLCanvasElement
 */
export async function recadrerEtPivoterImage(
  blob: Blob,
  recadrage: RectangleRecadrage,
  angleDegres: number = 0,
  maxDimension: number = 2048,
  qualiteJpeg: number = 0.85
): Promise<Blob> {
  const img = await chargerImageElement(blob);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Impossible d'obtenir le contexte 2D du Canvas");

  const angle = ((angleDegres % 360) + 360) % 360;
  const largeurOrientee =
    angle === 90 || angle === 270 ? img.height : img.width;
  const hauteurOrientee =
    angle === 90 || angle === 270 ? img.width : img.height;

  // Clamping sécurisé des coordonnées relatives [0, 1]
  const xRel = Math.max(0, Math.min(1, recadrage.x));
  const yRel = Math.max(0, Math.min(1, recadrage.y));
  const wRel = Math.max(0.01, Math.min(1 - xRel, recadrage.width));
  const hRel = Math.max(0.01, Math.min(1 - yRel, recadrage.height));

  const xPx = xRel * largeurOrientee;
  const yPx = yRel * hauteurOrientee;
  const wPx = wRel * largeurOrientee;
  const hPx = hRel * hauteurOrientee;

  let destWidth = Math.round(wPx);
  let destHeight = Math.round(hPx);
  if (destWidth > maxDimension || destHeight > maxDimension) {
    const ratio = Math.min(maxDimension / destWidth, maxDimension / destHeight);
    destWidth = Math.max(1, Math.round(destWidth * ratio));
    destHeight = Math.max(1, Math.round(destHeight * ratio));
  }

  canvas.width = destWidth;
  canvas.height = destHeight;

  ctx.save();
  ctx.scale(destWidth / wPx, destHeight / hPx);
  ctx.translate(-xPx, -yPx);

  if (angle === 90) {
    ctx.translate(img.height, 0);
    ctx.rotate((90 * Math.PI) / 180);
  } else if (angle === 180) {
    ctx.translate(img.width, img.height);
    ctx.rotate((180 * Math.PI) / 180);
  } else if (angle === 270) {
    ctx.translate(0, img.width);
    ctx.rotate((270 * Math.PI) / 180);
  }

  ctx.drawImage(img, 0, 0, img.width, img.height);
  ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (resultBlob) => {
        if (resultBlob) {
          resolve(resultBlob);
        } else {
          reject(
            new Error("Échec de la compression de l'image recadrée en Blob")
          );
        }
      },
      "image/jpeg",
      qualiteJpeg
    );
  });
}

/**
 * Convertit un Blob en chaîne Base64 (sans préfixe data:image/...)
 */
export function blobVersBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] || "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Adaptateur de production exploitant l'API standard Canvas du navigateur
 */
export class BrowserCanvasProcessor implements CanvasProcessor {
  async traiterImage(
    blob: Blob,
    angleDegres: number = 0,
    options: OptionsPretraitement = {}
  ): Promise<Blob> {
    const maxDimension = options.maxDimension ?? 2048;
    const qualiteJpeg = options.qualiteJpeg ?? 0.85;
    return pivoterEtCompresserImage(
      blob,
      angleDegres,
      maxDimension,
      qualiteJpeg
    );
  }

  async recadrerEtPivoterImage(
    blob: Blob,
    recadrage: RectangleRecadrage,
    angleDegres: number = 0,
    options: OptionsPretraitement = {}
  ): Promise<Blob> {
    const maxDimension = options.maxDimension ?? 2048;
    const qualiteJpeg = options.qualiteJpeg ?? 0.85;
    return recadrerEtPivoterImage(
      blob,
      recadrage,
      angleDegres,
      maxDimension,
      qualiteJpeg
    );
  }

  async blobVersBase64(blob: Blob): Promise<string> {
    return blobVersBase64(blob);
  }
}

export interface MockCanvasProcessorOptions {
  mockBlob?: Blob;
  mockBase64?: string;
  simulerErreurTraitement?: boolean;
  simulerErreurBase64?: boolean;
}

/**
 * Adaptateur simulé pour les tests automatisés (Node / Vitest)
 * Évite les dépendances binaires natives ou les mocks Canvas fragiles
 */
export class MockCanvasProcessor implements CanvasProcessor {
  readonly appelsTraiter: Array<{
    blob: Blob;
    angleDegres: number;
    options?: OptionsPretraitement;
  }> = [];

  readonly appelsRecadrerEtPivoter: Array<{
    blob: Blob;
    recadrage: RectangleRecadrage;
    angleDegres: number;
    options?: OptionsPretraitement;
  }> = [];

  readonly appelsBase64: Blob[] = [];

  constructor(private options: MockCanvasProcessorOptions = {}) {}

  async traiterImage(
    blob: Blob,
    angleDegres: number = 0,
    options?: OptionsPretraitement
  ): Promise<Blob> {
    if (this.options.simulerErreurTraitement) {
      throw new Error("Erreur simulée lors du traitement Canvas");
    }
    this.appelsTraiter.push({ blob, angleDegres, options });
    return (
      this.options.mockBlob ??
      new Blob(["mock-image-data"], { type: "image/jpeg" })
    );
  }

  async recadrerEtPivoterImage(
    blob: Blob,
    recadrage: RectangleRecadrage,
    angleDegres: number = 0,
    options?: OptionsPretraitement
  ): Promise<Blob> {
    if (this.options.simulerErreurTraitement) {
      throw new Error("Erreur simulée lors du traitement Canvas");
    }
    this.appelsRecadrerEtPivoter.push({
      blob,
      recadrage,
      angleDegres,
      options,
    });
    return (
      this.options.mockBlob ??
      new Blob(["mock-cropped-image-data"], { type: "image/jpeg" })
    );
  }

  async blobVersBase64(blob: Blob): Promise<string> {
    if (this.options.simulerErreurBase64) {
      throw new Error("Erreur simulée lors de la conversion Base64");
    }
    this.appelsBase64.push(blob);
    if (this.options.mockBase64) {
      return this.options.mockBase64;
    }
    if (typeof blob.text === "function") {
      try {
        const text = await blob.text();
        if (typeof Buffer !== "undefined") {
          return Buffer.from(text).toString("base64");
        }
      } catch {
        // repli
      }
    }
    return "bW9jay1iYXNlNjQ="; // Base64 de "mock-base64"
  }
}
