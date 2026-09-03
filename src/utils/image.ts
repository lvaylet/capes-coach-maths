/**
 * Utilitaires de manipulation et prétraitement d'images côté client
 */

/**
 * Charge un Blob d'image dans un élément Image HTML
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
 * Applique une rotation (0, 90, 180, 270 degrés) et compresse l'image si elle dépasse une dimension max.
 * Optimisé pour la lisibilité mathématique (maintient un bon contraste et une résolution suffisante pour l'OCR).
 */
export async function pivoterEtCompresserImage(
  blob: Blob,
  angleDegres: number = 0,
  maxDimension: number = 2048,
  qualiteJpeg: number = 0.85
): Promise<Blob> {
  const img = await chargerImageElement(blob);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Impossible d\'obtenir le contexte 2D du Canvas');

  // Normaliser l'angle entre 0 et 359
  const angle = ((angleDegres % 360) + 360) % 360;

  // Calcul du redimensionnement si nécessaire
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
          reject(new Error('Échec de la compression de l\'image en Blob'));
        }
      },
      'image/jpeg',
      qualiteJpeg
    );
  });
}

/**
 * Convertit un Blob en chaîne Base64 (sans préfixe data:image/...) pour l'API Gemini
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Supprimer le préfixe data:mime/type;base64,
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
