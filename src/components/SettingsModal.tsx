import React, { useState } from 'react';
import { X, Key, Cpu, MessageSquare, Eye, EyeOff, Save, Check } from 'lucide-react';
import type { ParametresCandidat } from '../types/domain';

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
  const [modele, setModele] = useState(parametres.modeleGemini || 'gemini-2.5-flash');
  const [consignes, setConsignes] = useState(parametres.consignesPersonnalisees || '');
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

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
            Réglages de l'Assistant & API
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
                type={showKey ? 'text' : 'password'}
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
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Votre clé est stockée uniquement en local sur votre appareil (navigateur). Obtenez une clé gratuitement sur{' '}
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

          {/* Choix du modèle Gemini */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-600" />
              Modèle d'IA Multimodal
            </label>
            <input
              type="text"
              value={modele}
              onChange={(e) => setModele(e.target.value)}
              placeholder="gemini-2.5-flash"
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            <div className="flex gap-2 mt-1.5">
              {['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setModele(m)}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 font-mono cursor-pointer border border-slate-200"
                >
                  {m}
                </button>
              ))}
            </div>
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
