import React, { useState, useEffect, useMemo } from "react";
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
  SessionDEntrainement,
  ParametresCandidat,
  DomaineMathematique,
  Epreuve,
  PageImage,
} from "./types/domain";
import {
  sauvegarderSession,
  chargerSession,
  listerSessions,
  supprimerSession,
  type StoredSessionRecord,
} from "./db/db";
import { creerExaminateur, type ExaminateurJury } from "./services/examinateur";
import { ImageUploader } from "./components/ImageUploader";
import { ReportViewer } from "./components/ReportViewer";
import { RemediationChat } from "./components/RemediationChat";
import { SettingsModal } from "./components/SettingsModal";
import { HistoryDrawer } from "./components/HistoryDrawer";

const STORAGE_KEY_PARAMETRES = "capes_maths_parametres";

export const App: React.FC = () => {
  // Paramètres du candidat
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

  // État de la session courante
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [titre, setTitre] = useState("Entraînement CAPES");
  const [domaine, setDomaine] = useState<DomaineMathematique>("Analyse");
  const [epreuve, setEpreuve] = useState<Epreuve>("epreuve-1");

  // Énoncé et Copie
  const [enoncePages, setEnoncePages] = useState<PageImage[]>([]);
  const [enonceTexte, setEnonceTexte] = useState("");
  const [copiePages, setCopiePages] = useState<PageImage[]>([]);

  // Résultat et remédiation
  const [sessionActive, setSessionActive] =
    useState<SessionDEntrainement | null>(null);
  const [enEvaluation, setEnEvaluation] = useState(false);
  const [enRemediation, setEnRemediation] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Modales
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [listeHistorique, setListeHistorique] = useState<StoredSessionRecord[]>(
    []
  );

  // Charger la liste d'historique au démarrage
  useEffect(() => {
    actualiserHistorique();
  }, []);

  const actualiserHistorique = async () => {
    try {
      const records = await listerSessions();
      setListeHistorique(records);
    } catch (e) {
      console.error("Erreur chargement historique :", e);
    }
  };

  const handleSaveSettings = (nouveauxParametres: ParametresCandidat) => {
    setParametres(nouveauxParametres);
    localStorage.setItem(
      STORAGE_KEY_PARAMETRES,
      JSON.stringify(nouveauxParametres)
    );
    setErreur(null);
  };

  const reinitialiserSession = () => {
    setSessionId(undefined);
    setTitre(`Entraînement ${new Date().toLocaleDateString("fr-FR")}`);
    setDomaine("Analyse");
    setEpreuve("epreuve-1");
    setEnoncePages([]);
    setEnonceTexte("");
    setCopiePages([]);
    setSessionActive(null);
    setErreur(null);
  };

  const handleLancerEvaluation = async () => {
    if (copiePages.length === 0) {
      setErreur(
        "Veuillez ajouter au moins une photo de votre copie manuscrite."
      );
      return;
    }

    setErreur(null);
    setEnEvaluation(true);

    try {
      const rapport = await examinateur.evaluerCopie({
        epreuve,
        enoncePages,
        enonceTexte,
        copiePages,
        consignesSupplementaires: parametres.consignesPersonnalisees,
      });

      const nouvelleSession: SessionDEntrainement = {
        id: sessionId || crypto.randomUUID(),
        titre: titre || "Session sans titre",
        dateCreation: new Date().toISOString(),
        domaine,
        epreuve,
        enonce: {
          id: crypto.randomUUID(),
          pages: enoncePages,
          texteOptionnel: enonceTexte,
        },
        copie: {
          id: crypto.randomUUID(),
          pages: copiePages,
        },
        rapport,
        messagesRemediation: [],
      };

      // Sauvegarder dans IndexedDB
      const savedId = await sauvegarderSession(nouvelleSession);
      nouvelleSession.id = savedId;
      setSessionId(savedId);
      setSessionActive(nouvelleSession);
      await actualiserHistorique();
    } catch (err: any) {
      setErreur(
        err.message ||
          "Une erreur est survenue lors de l'évaluation par le jury."
      );
    } finally {
      setEnEvaluation(false);
    }
  };

  const handleEnvoyerRemediation = async (texte: string) => {
    if (!sessionActive || !sessionActive.rapport) return;

    const nouveauMessageCandidat = {
      id: crypto.randomUUID(),
      auteur: "candidat" as const,
      date: new Date().toISOString(),
      contenu: texte,
    };

    const historiqueMaj = [
      ...sessionActive.messagesRemediation,
      nouveauMessageCandidat,
    ];
    setSessionActive({
      ...sessionActive,
      messagesRemediation: historiqueMaj,
    });

    setEnRemediation(true);
    try {
      const reponseExaminateur = await examinateur.poserQuestionRemediation({
        rapport: sessionActive.rapport,
        historiqueMessages: historiqueMaj,
        nouvelleQuestion: texte,
      });

      const messageExaminateur = {
        id: crypto.randomUUID(),
        auteur: "examinateur" as const,
        date: new Date().toISOString(),
        contenu: reponseExaminateur,
      };

      const finalMaj = [...historiqueMaj, messageExaminateur];
      const sessionFinale = {
        ...sessionActive,
        messagesRemediation: finalMaj,
      };

      setSessionActive(sessionFinale);
      await sauvegarderSession(sessionFinale);
      await actualiserHistorique();
    } catch (err: any) {
      setErreur(err.message || "Erreur lors de la réponse de l'examinateur.");
    } finally {
      setEnRemediation(false);
    }
  };

  const handleSelectSession = async (id: string) => {
    try {
      const loaded = await chargerSession(id);
      if (loaded) {
        setSessionActive(loaded);
        setSessionId(loaded.id);
        setTitre(loaded.titre);
        setDomaine(loaded.domaine);
        setEpreuve(loaded.epreuve);
        setEnoncePages(loaded.enonce.pages);
        setEnonceTexte(loaded.enonce.texteOptionnel || "");
        setCopiePages(loaded.copie.pages);
        setErreur(null);
      }
    } catch (e) {
      console.error("Erreur chargement session :", e);
    }
  };

  const handleDeleteSession = async (id: string) => {
    await supprimerSession(id);
    if (sessionId === id) {
      reinitialiserSession();
    }
    await actualiserHistorique();
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
              onClick={reinitialiserSession}
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
              {listeHistorique.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-indigo-500 text-white text-[10px] rounded-full font-bold">
                  {listeHistorique.length}
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
        {erreur && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">Erreur</p>
              <p className="mt-0.5">{erreur}</p>
            </div>
            <button
              type="button"
              onClick={() => setErreur(null)}
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
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="Ex : CAPES 2024 - Problème d'Analyse"
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Domaine mathématique
              </label>
              <select
                value={domaine}
                onChange={(e) =>
                  setDomaine(e.target.value as DomaineMathematique)
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
                value={epreuve}
                onChange={(e) => setEpreuve(e.target.value as Epreuve)}
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
            pages={enoncePages}
            onPagesChange={setEnoncePages}
            allowTextInput
            texteOptionnel={enonceTexte}
            onTexteChange={setEnonceTexte}
          />

          {/* Module Copie */}
          <ImageUploader
            label="2. Votre Copie manuscrite"
            description="Photographiez votre rédaction papier. Utilisez la rotation si une page est de travers."
            pages={copiePages}
            onPagesChange={setCopiePages}
          />

          {/* Bouton de soumission à l'examinateur */}
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              disabled={enEvaluation || copiePages.length === 0}
              onClick={handleLancerEvaluation}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
            >
              {enEvaluation ? (
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
        {sessionActive?.rapport && (
          <section className="space-y-6 pt-4">
            {/* Rapport d'évaluation structuré */}
            <ReportViewer
              rapport={sessionActive.rapport}
              titreSession={sessionActive.titre}
            />

            {/* Discussion interactive de Remédiation */}
            <RemediationChat
              messages={sessionActive.messagesRemediation}
              onSendMessage={handleEnvoyerRemediation}
              isLoading={enRemediation}
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
        sessions={listeHistorique}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
      />
    </div>
  );
};

export default App;
