import React, { useState } from "react";
import {
  X,
  Key,
  Cpu,
  MessageSquare,
  Eye,
  EyeOff,
  Save,
  Check,
  RefreshCw,
} from "lucide-react";
import type { ParametresCandidat } from "../types/domain";
import { useModelesExaminateur } from "../services/examinateur/modeles";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  parametres: ParametresCandidat;
  onSave: (params: ParametresCandidat) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  parametres,
  onSave,
}) => {
  const [cleApi, setCleApi] = useState(parametres.cleApiGemini);
  const [modele, setModele] = useState(
    parametres.modeleGemini || "gemini-2.5-flash"
  );
  const [consignes, setConsignes] = useState(
    parametres.consignesPersonnalisees || ""
  );
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Découverte dynamique des modèles Gemini
  const { modeles, enChargement, statut, erreur, rafraichir } =
    useModelesExaminateur(cleApi);

  const estModeleConnu = modeles.some((m) => m.id === modele);
  const [saisieManuelle, setSaisieManuelle] = useState(!estModeleConnu);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      cleApiGemini: cleApi.trim(),
      modeleGemini: modele.trim(),
      consignesPersonnalisees: consignes.trim(),
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* En-tête */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base">
            <Key className="w-5 h-5 text-indigo-600" />
            Réglages du Candidat & API
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Clé API Gemini */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Clé API Google Gemini (BYOK)
            </label>
            <div className="relative flex items-center">
              <input
                type={showKey ? "text" : "password"}
                value={cleApi}
                onChange={(e) => setCleApi(e.target.value)}
                placeholder="Collez votre clé API Gemini (AIza...)"
                required
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 pr-10 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Votre clé est stockée uniquement en local sur votre appareil
              (navigateur). Obtenez une clé gratuitement sur{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:underline"
              >
                Google AI Studio
              </a>
              .
            </p>
          </div>

          {/* Choix du modèle de l'examinateur */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                Modèle de l'Examinateur (Gemini)
              </label>
              <button
                type="button"
                onClick={() => rafraichir()}
                disabled={enChargement || !cleApi.trim()}
                title="Rafraîchir la liste des modèles depuis Google AI Studio"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                <RefreshCw
                  className={`w-3 h-3 ${enChargement ? "animate-spin" : ""}`}
                />
                Rafraîchir
              </button>
            </div>

            <select
              value={saisieManuelle ? "__custom__" : modele}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "__custom__") {
                  setSaisieManuelle(true);
                } else {
                  setSaisieManuelle(false);
                  setModele(val);
                }
              }}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono cursor-pointer"
            >
              <optgroup label="Modèles recommandés">
                {modeles
                  .filter((m) => m.estRecommande)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      ★ {m.nomAffiche} ({m.id})
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Autres modèles disponibles">
                {modeles
                  .filter((m) => !m.estRecommande)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nomAffiche} ({m.id})
                    </option>
                  ))}
              </optgroup>
              <option value="__custom__">
                Autre (saisie personnalisée)...
              </option>
            </select>

            {/* Saisie personnalisée */}
            {saisieManuelle && (
              <div className="mt-2">
                <input
                  type="text"
                  value={modele}
                  onChange={(e) => setModele(e.target.value)}
                  placeholder="ex : gemini-2.5-pro-preview"
                  className="w-full text-sm bg-slate-50 border border-indigo-300 rounded-lg px-3.5 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Saisissez l'identifiant technique exact du modèle souhaité.
                </p>
              </div>
            )}

            {/* Statut de synchronisation */}
            <div className="mt-1.5 flex items-center justify-between text-[11px]">
              {statut === "chargement" && (
                <span className="text-indigo-600 flex items-center gap-1 font-medium">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Synchronisation des modèles avec votre clé...
                </span>
              )}
              {statut === "synchronise" && (
                <span className="text-emerald-700 font-medium">
                  ✓ {modeles.length} modèles disponibles via votre clé
                </span>
              )}
              {statut === "erreur" && (
                <span className="text-amber-700" title={erreur || undefined}>
                  ⚠️ Échec de synchronisation : liste locale active
                </span>
              )}
              {statut === "defaut" && (
                <span className="text-slate-500">
                  Liste par défaut (renseignez une clé pour synchroniser)
                </span>
              )}
            </div>

            {/* Description du modèle sélectionné */}
            {!saisieManuelle && (
              <p className="text-[11px] text-slate-500 mt-1 italic">
                {modeles.find((m) => m.id === modele)?.description}
              </p>
            )}
          </div>

          {/* Consignes additionnelles */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
              Consignes spécifiques pour le Jury (optionnel)
            </label>
            <textarea
              rows={3}
              value={consignes}
              onChange={(e) => setConsignes(e.target.value)}
              placeholder="Ex : Sois particulièrement intraitable sur la vérification des hypothèses du théorème des accroissements finis et des intégrales impropres."
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Boutons d'action */}
          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" /> Enregistré !
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Sauvegarder
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
