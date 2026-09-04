import React, { useRef, useState } from "react";
import {
  RotateCw,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Camera,
  Upload,
  FileText,
  AlertCircle,
  Crop,
} from "lucide-react";
import type { PageImage } from "../types/domain";
import { imagePipeline, type RectangleRecadrage } from "../utils/image";
import { RecadrageModal } from "./RecadrageModal";

interface ImageUploaderProps {
  label: string;
  description: string;
  pages: PageImage[];
  onPagesChange: (pages: PageImage[]) => void;
  allowTextInput?: boolean;
  texteOptionnel?: string;
  onTexteChange?: (texte: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label,
  description,
  pages,
  onPagesChange,
  allowTextInput = false,
  texteOptionnel = "",
  onTexteChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [erreurValidation, setErreurValidation] = useState<string | null>(null);
  const [pageEnRecadrage, setPageEnRecadrage] = useState<PageImage | null>(
    null
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    setErreurValidation(null);

    const fichiersValides: File[] = [];
    for (const file of files) {
      const validation = imagePipeline.validerFichier(file);
      if (!validation.valide) {
        setErreurValidation(validation.erreur);
      } else {
        fichiersValides.push(file);
      }
    }

    if (fichiersValides.length > 0) {
      try {
        const newPages = await imagePipeline.ingererFichiers(
          fichiersValides,
          pages.length
        );
        onPagesChange([...pages, ...newPages]);
      } catch (err) {
        setErreurValidation((err as Error).message);
      }
    }

    e.target.value = "";
  };

  const pivoterPage = (id: string) => {
    onPagesChange(
      pages.map((p) => (p.id === id ? imagePipeline.pivoterPage(p) : p))
    );
  };

  const handleValiderRecadrage = async (
    recadrage: RectangleRecadrage,
    angle: number
  ) => {
    if (!pageEnRecadrage) return;
    try {
      const pageRecadree = await imagePipeline.recadrerPage(
        pageEnRecadrage,
        recadrage,
        angle
      );
      onPagesChange(
        pages.map((p) => (p.id === pageRecadree.id ? pageRecadree : p))
      );
      setPageEnRecadrage(null);
    } catch (err) {
      setErreurValidation((err as Error).message);
    }
  };

  const supprimerPage = (id: string) => {
    const pageASupprimer = pages.find((p) => p.id === id);
    if (pageASupprimer) {
      imagePipeline.libererPage(pageASupprimer);
    }
    const filtered = pages.filter((p) => p.id !== id);
    onPagesChange(filtered.map((p, idx) => ({ ...p, ordre: idx })));
  };

  const deplacerPage = (index: number, direction: "gauche" | "droite") => {
    if (
      (direction === "gauche" && index === 0) ||
      (direction === "droite" && index === pages.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === "gauche" ? index - 1 : index + 1;
    const reordered = [...pages];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    onPagesChange(reordered.map((p, idx) => ({ ...p, ordre: idx })));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">{label}</h3>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
          {pages.length} {pages.length > 1 ? "pages" : "page"}
        </span>
      </div>

      {/* Boutons d'ajout (Galerie et Caméra) */}
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200 cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          Sélectionner des images
        </button>

        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200 cursor-pointer sm:hidden"
        >
          <Camera className="w-4 h-4" />
          Prendre une photo
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Message d'erreur de validation (formats non supportés, ex: PDF) */}
      {erreurValidation && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 flex justify-between items-start">
            <span>{erreurValidation}</span>
            <button
              type="button"
              onClick={() => setErreurValidation(null)}
              className="text-amber-700 hover:text-amber-900 font-bold ml-2 cursor-pointer"
              title="Fermer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Galerie des vignettes de pages avec contrôles de rotation */}
      {pages.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
          {pages.map((page, idx) => (
            <div
              key={page.id}
              className="group relative bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex flex-col shadow-xs"
            >
              {/* Badge numéro de page */}
              <div className="absolute top-2 left-2 z-10 bg-slate-900/75 text-white text-xs font-bold px-2 py-0.5 rounded shadow">
                Page {idx + 1}
              </div>

              {/* Aperçu avec rotation */}
              <div className="h-40 w-full flex items-center justify-center p-2 bg-slate-900/5 overflow-hidden">
                <img
                  src={page.previewUrl}
                  alt={`Page ${idx + 1}`}
                  style={{ transform: `rotate(${page.rotation}deg)` }}
                  className="max-h-full max-w-full object-contain transition-transform duration-200"
                />
              </div>

              {/* Barre d'outils de la page */}
              <div className="flex items-center justify-between bg-white border-t border-slate-200 p-1.5 text-slate-600">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => deplacerPage(idx, "gauche")}
                    title="Déplacer vers la gauche"
                    className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === pages.length - 1}
                    onClick={() => deplacerPage(idx, "droite")}
                    title="Déplacer vers la droite"
                    className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPageEnRecadrage(page)}
                    title="Recadrer et pivoter la page"
                    className="p-1 hover:bg-emerald-50 text-emerald-600 rounded cursor-pointer"
                  >
                    <Crop className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => pivoterPage(page.id)}
                    title="Faire pivoter de 90°"
                    className="p-1 hover:bg-blue-50 text-blue-600 rounded cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => supprimerPage(page.id)}
                    title="Supprimer la page"
                    className="p-1 hover:bg-rose-50 text-rose-600 rounded cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center text-slate-400 bg-slate-50/50">
          <p className="text-sm">Aucune page sélectionnée pour le moment.</p>
        </div>
      )}

      {/* Saisie textuelle facultative (pour l'énoncé) */}
      {allowTextInput && (
        <div className="pt-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
            <FileText className="w-3.5 h-3.5" />
            Transcription ou précisions textuelles sur l'énoncé (facultatif) :
          </label>
          <textarea
            rows={2}
            value={texteOptionnel}
            onChange={(e) => onTexteChange?.(e.target.value)}
            placeholder="Ex : Énoncé tiré du sujet 2024 Épreuve 1, partie B question 3..."
            className="w-full text-sm rounded-lg border border-slate-200 p-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50/50"
          />
        </div>
      )}

      {/* Modale interactive de recadrage et rotation de la page */}
      {pageEnRecadrage && (
        <RecadrageModal
          page={pageEnRecadrage}
          isOpen={true}
          onClose={() => setPageEnRecadrage(null)}
          onValider={handleValiderRecadrage}
        />
      )}
    </div>
  );
};
