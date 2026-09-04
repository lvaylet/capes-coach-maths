import React, { useState, useMemo } from "react";
import {
  GraduationCap,
  Settings,
  History,
  PlusCircle,
  Send,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type {
  ParametresCandidat,
  DomaineMathematique,
  Epreuve,
} from "./types/domain";
import { creerExaminateur, type ExaminateurJury } from "./services/examinateur";
import { useSessionDEntrainement } from "./session";
import { ImageUploader } from "./components/ImageUploader";
import { ReportViewer } from "./components/ReportViewer";
import { RemediationChat } from "./components/RemediationChat";
import { SettingsModal } from "./components/SettingsModal";
import { HistoryDrawer } from "./components/HistoryDrawer";

const STORAGE_KEY_PARAMETRES = "capes_maths_parametres";

export const App: React.FC = () => {
  // Paramètres du candidat (clé API, modèle, consignes)
  const [parametres, setParametres] = useState<ParametresCandidat>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PARAMETRES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Ignorer
      }
    }
    return {
      cleApiGemini: "",
      modeleGemini: "gemini-2.5-flash",
      consignesPersonnalisees: "",
    };
  });

  // Instance de l'examinateur du jury (seam Ports & Adapters)
  const examinateur: ExaminateurJury = useMemo(
    () =>
      creerExaminateur({
        cleApi: parametres.cleApiGemini,
        modele: parametres.modeleGemini,
      }),
    [parametres.cleApiGemini, parametres.modeleGemini]
  );

  // Orchestrateur central de la Session d'entraînement (deep module)
  const session = useSessionDEntrainement({ examinateur });

  // Modales d'interface
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleSaveSettings = (nouveauxParametres: ParametresCandidat) => {
    setParametres(nouveauxParametres);
    localStorage.setItem(
      STORAGE_KEY_PARAMETRES,
      JSON.stringify(nouveauxParametres)
    );
    session.effacerErreur();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      {/* Barre de navigation supérieure */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg tracking-tight leading-tight">
                Prépa CAPES Maths
              </h1>
              <p className="text-[11px] text-indigo-300 font-medium">
                Correcteur & Examinateur Virtuel du Jury
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={session.reinitialiserSession}
              title="Nouvelle session"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer border border-slate-700"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Nouveau</span>
            </button>

            <button
              type="button"
              onClick={() => setShowHistory(true)}
              title="Historique des entraînements"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer border border-slate-700 relative"
            >
              <History className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Historique</span>
              {session.listeHistorique.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-indigo-500 text-white text-[10px] rounded-full font-bold">
                  {session.listeHistorique.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowSettings(true)}
              title="Réglages et clé API"
              className={`p-2 rounded-lg transition-colors cursor-pointer border ${
                !parametres.cleApiGemini
                  ? "bg-amber-500/20 text-amber-300 border-amber-400/40 animate-pulse"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Bannière mode simulation si clé API non configurée */}
      {examinateur.estModeSimulation && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Mode démonstration (Jury simulé) :</strong> Aucune clé API
              Gemini renseignée. Les évaluations et réponses du jury sont
              simulées localement.
            </span>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="ml-auto underline font-semibold text-amber-950 hover:text-amber-700 cursor-pointer whitespace-nowrap"
            >
              Ajouter une clé API Gemini
            </button>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full space-y-6">
        {/* Message d'erreur éventuel */}
        {session.erreur && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">Erreur</p>
              <p className="mt-0.5">{session.erreur}</p>
            </div>
            <button
              type="button"
              onClick={session.effacerErreur}
              className="ml-auto text-rose-400 hover:text-rose-600 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Formulaire de saisie : Énoncé & Copie */}
        <section className="space-y-4">
          {/* Métadonnées de l'exercice */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Intitulé de la session
              </label>
              <input
                type="text"
                value={session.titre}
                onChange={(e) => session.setTitre(e.target.value)}
                placeholder="Ex : CAPES 2024 - Problème d'Analyse"
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Domaine mathématique
              </label>
              <select
                value={session.domaine}
                onChange={(e) =>
                  session.setDomaine(e.target.value as DomaineMathematique)
                }
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="Analyse">Analyse</option>
                <option value="Algebre">Algèbre & Géométrie</option>
                <option value="Geometrie">Géométrie</option>
                <option value="Probabilites">
                  Probabilités & Statistiques
                </option>
                <option value="Arithmetique">Arithmétique</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Contexte d'épreuve
              </label>
              <select
                value={session.epreuve}
                onChange={(e) => session.setEpreuve(e.target.value as Epreuve)}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="epreuve-1">
                  Épreuve 1 - Disciplinaire pure (L1-L3)
                </option>
                <option value="epreuve-2">
                  Épreuve 2 - Disciplinaire appliquée (Didactique/Lycée)
                </option>
                <option value="auto">
                  Détection automatique selon l'énoncé
                </option>
              </select>
            </div>
          </div>

          {/* Module Énoncé */}
          <ImageUploader
            label="1. Énoncé de l'exercice ou problème"
            description="Prenez en photo ou importez le sujet (1 ou plusieurs pages)."
            pages={session.enoncePages}
            onPagesChange={session.setEnoncePages}
            allowTextInput
            texteOptionnel={session.enonceTexte}
            onTexteChange={session.setEnonceTexte}
          />

          {/* Module Copie */}
          <ImageUploader
            label="2. Votre Copie manuscrite"
            description="Photographiez votre rédaction papier. Utilisez la rotation si une page est de travers."
            pages={session.copiePages}
            onPagesChange={session.setCopiePages}
          />

          {/* Bouton de soumission à l'examinateur */}
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              disabled={session.enEvaluation || session.copiePages.length === 0}
              onClick={() =>
                session.lancerEvaluation(parametres.consignesPersonnalisees)
              }
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
            >
              {session.enEvaluation ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Le Jury du CAPES examine votre copie...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Soumettre ma copie au Jury du CAPES</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Section Restitution : Rapport & Remédiation */}
        {session.sessionActive?.rapport && (
          <section className="space-y-6 pt-4">
            {/* Rapport d'évaluation structuré */}
            <ReportViewer
              rapport={session.sessionActive.rapport}
              titreSession={session.sessionActive.titre}
            />

            {/* Discussion interactive de Remédiation */}
            <RemediationChat
              messages={session.sessionActive.messagesRemediation}
              onSendMessage={session.envoyerRemediation}
              isLoading={session.enRemediation}
            />
          </section>
        )}
      </main>

      {/* Modale des réglages */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        parametres={parametres}
        onSave={handleSaveSettings}
      />

      {/* Volet d'historique */}
      <HistoryDrawer
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        sessions={session.listeHistorique}
        onSelectSession={session.chargerSession}
        onDeleteSession={session.supprimerSession}
      />
    </div>
  );
};

export default App;
