import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  RotateCcw,
  RotateCw,
  Check,
  X,
  Maximize2,
  Crop as CropIcon,
  Loader2,
} from "lucide-react";
import type { PageImage } from "../types/domain";
import type { RectangleRecadrage } from "../utils/image/types";

export type RatioPreset = "libre" | "a4-portrait" | "a4-paysage" | "carre";

interface RecadrageModalProps {
  page: PageImage;
  isOpen: boolean;
  onClose: () => void;
  onValider: (
    recadrage: RectangleRecadrage,
    angle: number
  ) => Promise<void> | void;
}

type DragHandle = "move" | "nw" | "ne" | "sw" | "se" | "n" | "s" | "w" | "e";

export const RecadrageModal: React.FC<RecadrageModalProps> = ({
  page,
  isOpen,
  onClose,
  onValider,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [angle, setAngle] = useState<number>(page.rotation);
  const [ratio, setRatio] = useState<RatioPreset>("libre");
  const [crop, setCrop] = useState<RectangleRecadrage>({
    x: 0.05,
    y: 0.05,
    width: 0.9,
    height: 0.9,
  });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // État de glisser-déposer
  const activeDragRef = useRef<{
    handle: DragHandle;
    startX: number;
    startY: number;
    initialCrop: RectangleRecadrage;
    rectWidth: number;
    rectHeight: number;
  } | null>(null);

  // Charger l'image initiale
  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      if (isCancelled) return;
      imgRef.current = img;
      setAngle(page.rotation);
      setRatio("libre");
      setCrop({ x: 0.05, y: 0.05, width: 0.9, height: 0.9 });
    };

    img.src = page.previewUrl;

    return () => {
      isCancelled = true;
    };
  }, [isOpen, page.previewUrl, page.rotation]);

  // Dessiner l'image orientée sur le canvas d'aperçu
  const redessinerCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const normAngle = ((angle % 360) + 360) % 360;
    const isSideways = normAngle === 90 || normAngle === 270;
    const visualWidth = isSideways ? img.naturalHeight : img.naturalWidth;
    const visualHeight = isSideways ? img.naturalWidth : img.naturalHeight;

    canvas.width = visualWidth;
    canvas.height = visualHeight;

    ctx.save();
    if (normAngle === 90) {
      ctx.translate(img.naturalHeight, 0);
      ctx.rotate((90 * Math.PI) / 180);
    } else if (normAngle === 180) {
      ctx.translate(img.naturalWidth, img.naturalHeight);
      ctx.rotate((180 * Math.PI) / 180);
    } else if (normAngle === 270) {
      ctx.translate(0, img.naturalWidth);
      ctx.rotate((270 * Math.PI) / 180);
    }

    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
    ctx.restore();
  }, [angle]);

  useEffect(() => {
    if (isOpen) {
      redessinerCanvas();
    }
  }, [isOpen, redessinerCanvas]);

  // Appliquer un preset de ratio
  const appliquerPresetRatio = useCallback(
    (preset: RatioPreset) => {
      setRatio(preset);
      const img = imgRef.current;
      if (!img) return;

      const normAngle = ((angle % 360) + 360) % 360;
      const isSideways = normAngle === 90 || normAngle === 270;
      const visualWidth = isSideways ? img.naturalHeight : img.naturalWidth;
      const visualHeight = isSideways ? img.naturalWidth : img.naturalHeight;

      if (preset === "libre") {
        return;
      }

      let targetAspectRatio = 1;
      if (preset === "a4-portrait") targetAspectRatio = 1 / Math.SQRT2;
      else if (preset === "a4-paysage") targetAspectRatio = Math.SQRT2;
      else if (preset === "carre") targetAspectRatio = 1;

      let targetW = 0.9;
      let targetH =
        (targetW * visualWidth) / (targetAspectRatio * visualHeight);

      if (targetH > 0.9) {
        targetH = 0.9;
        targetW = (targetH * visualHeight * targetAspectRatio) / visualWidth;
      }

      targetW = Math.min(1, Math.max(0.1, targetW));
      targetH = Math.min(1, Math.max(0.1, targetH));

      setCrop({
        x: (1 - targetW) / 2,
        y: (1 - targetH) / 2,
        width: targetW,
        height: targetH,
      });
    },
    [angle]
  );

  // Pivoter de 90° et réinitialiser le cadre plein champ
  const pivoter = (increment: number) => {
    setAngle((prev) => {
      const next = (((prev + increment) % 360) + 360) % 360;
      return next;
    });
    setCrop({ x: 0.05, y: 0.05, width: 0.9, height: 0.9 });
    setRatio("libre");
  };

  const reinitialiserCadre = () => {
    setCrop({ x: 0, y: 0, width: 1, height: 1 });
    setRatio("libre");
  };

  // Gestion du glisser-déplacer tactile et souris via Pointer Events
  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    handle: DragHandle
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    activeDragRef.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialCrop: { ...crop },
      rectWidth: rect.width,
      rectHeight: rect.height,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeDragRef.current) return;
    e.preventDefault();

    const { handle, startX, startY, initialCrop, rectWidth, rectHeight } =
      activeDragRef.current;

    const dx = (e.clientX - startX) / rectWidth;
    const dy = (e.clientY - startY) / rectHeight;

    const MIN_SIZE = 0.05;

    setCrop(() => {
      let nextX = initialCrop.x;
      let nextY = initialCrop.y;
      let nextW = initialCrop.width;
      let nextH = initialCrop.height;

      if (handle === "move") {
        nextX = Math.max(
          0,
          Math.min(1 - initialCrop.width, initialCrop.x + dx)
        );
        nextY = Math.max(
          0,
          Math.min(1 - initialCrop.height, initialCrop.y + dy)
        );
        return { x: nextX, y: nextY, width: nextW, height: nextH };
      }

      if (handle === "nw" || handle === "w" || handle === "sw") {
        const potentialX = Math.max(
          0,
          Math.min(
            initialCrop.x + initialCrop.width - MIN_SIZE,
            initialCrop.x + dx
          )
        );
        nextW = initialCrop.width - (potentialX - initialCrop.x);
        nextX = potentialX;
      } else if (handle === "ne" || handle === "e" || handle === "se") {
        nextW = Math.max(
          MIN_SIZE,
          Math.min(1 - initialCrop.x, initialCrop.width + dx)
        );
      }

      if (handle === "nw" || handle === "n" || handle === "ne") {
        const potentialY = Math.max(
          0,
          Math.min(
            initialCrop.y + initialCrop.height - MIN_SIZE,
            initialCrop.y + dy
          )
        );
        nextH = initialCrop.height - (potentialY - initialCrop.y);
        nextY = potentialY;
      } else if (handle === "sw" || handle === "s" || handle === "se") {
        nextH = Math.max(
          MIN_SIZE,
          Math.min(1 - initialCrop.y, initialCrop.height + dy)
        );
      }

      return {
        x: Math.max(0, Math.min(1, nextX)),
        y: Math.max(0, Math.min(1, nextY)),
        width: Math.max(MIN_SIZE, Math.min(1 - nextX, nextW)),
        height: Math.max(MIN_SIZE, Math.min(1 - nextY, nextH)),
      };
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeDragRef.current) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignorer si déjà libéré
      }
      activeDragRef.current = null;
    }
  };

  const handleValider = async () => {
    setIsProcessing(true);
    try {
      await onValider(crop, angle);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="recadrage-modal-titre"
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 text-white select-none touch-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* En-tête de la modale */}
      <header className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <CropIcon className="w-5 h-5 text-blue-400" />
          <h2
            id="recadrage-modal-titre"
            className="text-base font-semibold text-slate-100"
          >
            Recadrer et pivoter la page
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isProcessing}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Fermer sans enregistrer"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Zone centrale de travail (Aperçu + Cadre interactif) */}
      <div className="flex-1 overflow-hidden flex items-center justify-center p-3 relative bg-slate-950">
        <div
          ref={containerRef}
          className="relative max-h-full max-w-full inline-block shadow-2xl overflow-hidden rounded-xs"
        >
          {/* Canvas affichant l'image avec la rotation courante */}
          <canvas
            ref={canvasRef}
            className="block max-h-[60vh] sm:max-h-[65vh] max-w-full object-contain pointer-events-none"
          />

          {/* Cadre de recadrage interactif superposé */}
          <div
            style={{
              left: `${crop.x * 100}%`,
              top: `${crop.y * 100}%`,
              width: `${crop.width * 100}%`,
              height: `${crop.height * 100}%`,
              boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.65)",
            }}
            className="absolute border-2 border-blue-400 cursor-move"
            onPointerDown={(e) => handlePointerDown(e, "move")}
          >
            {/* Grille de composition tiers (3x3) */}
            <div className="w-full h-full grid grid-cols-3 grid-rows-3 pointer-events-none">
              <div className="border-r border-b border-white/25" />
              <div className="border-r border-b border-white/25" />
              <div className="border-b border-white/25" />
              <div className="border-r border-b border-white/25" />
              <div className="border-r border-b border-white/25" />
              <div className="border-b border-white/25" />
              <div className="border-r border-white/25" />
              <div className="border-r border-white/25" />
              <div />
            </div>

            {/* Poignées d'angle tactiles (avec zone de touche étendue) */}
            <div
              className="absolute -top-3 -left-3 w-7 h-7 flex items-center justify-center cursor-nwse-resize"
              onPointerDown={(e) => handlePointerDown(e, "nw")}
            >
              <div className="w-3.5 h-3.5 bg-white border-2 border-blue-600 rounded-xs shadow" />
            </div>
            <div
              className="absolute -top-3 -right-3 w-7 h-7 flex items-center justify-center cursor-nesw-resize"
              onPointerDown={(e) => handlePointerDown(e, "ne")}
            >
              <div className="w-3.5 h-3.5 bg-white border-2 border-blue-600 rounded-xs shadow" />
            </div>
            <div
              className="absolute -bottom-3 -left-3 w-7 h-7 flex items-center justify-center cursor-nesw-resize"
              onPointerDown={(e) => handlePointerDown(e, "sw")}
            >
              <div className="w-3.5 h-3.5 bg-white border-2 border-blue-600 rounded-xs shadow" />
            </div>
            <div
              className="absolute -bottom-3 -right-3 w-7 h-7 flex items-center justify-center cursor-nwse-resize"
              onPointerDown={(e) => handlePointerDown(e, "se")}
            >
              <div className="w-3.5 h-3.5 bg-white border-2 border-blue-600 rounded-xs shadow" />
            </div>

            {/* Poignées de bord médianes */}
            <div
              className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-4 flex items-center justify-center cursor-ns-resize"
              onPointerDown={(e) => handlePointerDown(e, "n")}
            >
              <div className="w-4 h-1.5 bg-white border border-blue-600 rounded-xs" />
            </div>
            <div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-4 flex items-center justify-center cursor-ns-resize"
              onPointerDown={(e) => handlePointerDown(e, "s")}
            >
              <div className="w-4 h-1.5 bg-white border border-blue-600 rounded-xs" />
            </div>
            <div
              className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-8 flex items-center justify-center cursor-ew-resize"
              onPointerDown={(e) => handlePointerDown(e, "w")}
            >
              <div className="w-1.5 h-4 bg-white border border-blue-600 rounded-xs" />
            </div>
            <div
              className="absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-8 flex items-center justify-center cursor-ew-resize"
              onPointerDown={(e) => handlePointerDown(e, "e")}
            >
              <div className="w-1.5 h-4 bg-white border border-blue-600 rounded-xs" />
            </div>
          </div>
        </div>
      </div>

      {/* Barre d'outils et de contrôle */}
      <footer className="bg-slate-900 border-t border-slate-800 p-3.5 shrink-0 flex flex-col gap-3">
        {/* Raccourcis de ratio et rotations */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Pivoter de 90° horaire / anti-horaire */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60">
            <button
              type="button"
              onClick={() => pivoter(-90)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              title="Pivoter de 90° vers la gauche"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
              -90°
            </button>
            <button
              type="button"
              onClick={() => pivoter(90)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              title="Pivoter de 90° vers la droite"
            >
              <RotateCw className="w-3.5 h-3.5 text-blue-400" />
              +90°
            </button>
          </div>

          {/* Ratios d'aspect prédéfinis */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 overflow-x-auto">
            <button
              type="button"
              onClick={() => appliquerPresetRatio("libre")}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                ratio === "libre"
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-700"
              }`}
            >
              Libre
            </button>
            <button
              type="button"
              onClick={() => appliquerPresetRatio("a4-portrait")}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                ratio === "a4-portrait"
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-700"
              }`}
            >
              A4 Portrait
            </button>
            <button
              type="button"
              onClick={() => appliquerPresetRatio("a4-paysage")}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                ratio === "a4-paysage"
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-700"
              }`}
            >
              A4 Paysage
            </button>
            <button
              type="button"
              onClick={() => appliquerPresetRatio("carre")}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                ratio === "carre"
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-700"
              }`}
            >
              1:1 Carré
            </button>
          </div>

          {/* Réinitialiser le cadre */}
          <button
            type="button"
            onClick={reinitialiserCadre}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 cursor-pointer"
            title="Agrandir le cadre à toute l'image"
          >
            <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
            Tout sélectionner
          </button>
        </div>

        {/* Boutons d'action Annuler / Valider */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleValider}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Traitement en cours...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Valider le recadrage
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};
