import React, { useState } from "react";
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  BookOpen,
  Eye,
  Download,
  Share2,
  Copy,
  Check,
} from "lucide-react";
import type { RapportDeCorrection } from "../types/domain";
import { KaTeXRenderer } from "./KaTeXRenderer";
import { formateurRapport } from "../rapport";

interface ReportViewerProps {
  rapport: RapportDeCorrection;
  titreSession?: string;
}

type TabKey = "verdict" | "fond" | "forme" | "modele" | "transcription";

export const ReportViewer: React.FC<ReportViewerProps> = ({
  rapport,
  titreSession = "Session CAPES",
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>("verdict");
  const [copieEffectuee, setCopieEffectuee] = useState(false);

  const handleExporterMarkdown = async () => {
    await formateurRapport.telechargerMarkdown(rapport, titreSession);
  };

  const handleCopierMarkdown = async () => {
    const succes = await formateurRapport.copierDansPressePapier(
      rapport,
      titreSession
    );
    if (succes) {
      setCopieEffectuee(true);
      setTimeout(() => setCopieEffectuee(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* En-tête du rapport */}
      <div className="p-6 bg-linear-to-r from-slate-900 to-indigo-950 text-white flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/30 text-indigo-200 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-indigo-400/20">
              Rapport Officiel
            </span>
            {rapport.verdict.noteIndicative && (
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                {rapport.verdict.noteIndicative}
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold mt-1 text-white">
            Évaluation du Jury du CAPES
          </h2>
          <p className="text-xs text-indigo-200/80 mt-0.5">
            Généré le {new Date(rapport.dateGeneration).toLocaleString("fr-FR")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopierMarkdown}
            title="Copier le rapport Markdown dans le presse-papier"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium backdrop-blur-xs transition-colors cursor-pointer"
          >
            {copieEffectuee ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Copié !
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copier Markdown
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleExporterMarkdown}
            title="Télécharger le fichier .md"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium backdrop-blur-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Exporter Markdown
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium backdrop-blur-xs transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            Imprimer / PDF
          </button>
        </div>
      </div>

      {/* Barre d'onglets */}
      <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50/75 p-1 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab("verdict")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "verdict"
              ? "bg-white text-indigo-600 shadow-xs border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
          }`}
        >
          <Award className="w-4 h-4" />
          Verdict & Synthèse
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("fond")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "fond"
              ? "bg-white text-indigo-600 shadow-xs border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
          }`}
        >
          <FileCheck className="w-4 h-4" />
          Analyse du Fond
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("forme")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "forme"
              ? "bg-white text-indigo-600 shadow-xs border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Analyse de la Forme
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("modele")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "modele"
              ? "bg-white text-indigo-600 shadow-xs border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Rédaction Modèle
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("transcription")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "transcription"
              ? "bg-white text-indigo-600 shadow-xs border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
          }`}
        >
          <Eye className="w-4 h-4" />
          Transcription OCR
        </button>
      </div>

      {/* Contenu de l'onglet actif */}
      <div className="p-6">
        {/* Onglet 1: Verdict */}
        {activeTab === "verdict" && (
          <div className="space-y-6">
            <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-5">
              <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wide mb-2">
                Bilan général de l'examinateur
              </h3>
              <p className="text-slate-700 leading-relaxed text-sm sm:text-base">
                {rapport.verdict.appreciationGlobale}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Points forts */}
              <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-5">
                <h4 className="flex items-center gap-2 text-sm font-bold text-emerald-800 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Points Forts et Réussites
                </h4>
                {rapport.verdict.pointsForts.length > 0 ? (
                  <ul className="space-y-2">
                    {rapport.verdict.pointsForts.map((pt, idx) => (
                      <li
                        key={idx}
                        className="text-xs sm:text-sm text-slate-700 flex items-start gap-2"
                      >
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Aucun point fort spécifique relevé.
                  </p>
                )}
              </div>

              {/* Erreurs critiques */}
              <div className="bg-rose-50/50 border border-rose-200/80 rounded-xl p-5">
                <h4 className="flex items-center gap-2 text-sm font-bold text-rose-800 mb-3">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Erreurs et Omissions Pénalisantes
                </h4>
                {rapport.verdict.erreursCritiques.length > 0 ? (
                  <ul className="space-y-2">
                    {rapport.verdict.erreursCritiques.map((err, idx) => (
                      <li
                        key={idx}
                        className="text-xs sm:text-sm text-slate-700 flex items-start gap-2"
                      >
                        <span className="text-rose-500 font-bold">•</span>
                        <span>{err}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Aucune erreur critique majeure constatée.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Onglet 2: Fond */}
        {activeTab === "fond" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Validité mathématique approfondie
              </h3>
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80">
                <KaTeXRenderer content={rapport.fond.analyseDetaillee} />
              </div>
            </div>

            {rapport.fond.theoremesEtHypotheses.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-2">
                  Théorèmes invoqués & Vérification des hypothèses
                </h4>
                <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4">
                  <ul className="space-y-2">
                    {rapport.fond.theoremesEtHypotheses.map((item, idx) => (
                      <li
                        key={idx}
                        className="text-xs sm:text-sm text-slate-700 flex items-start gap-2"
                      >
                        <span className="text-amber-600 font-bold">▶</span>
                        <KaTeXRenderer content={item} />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-2">
                Solidité de l'enchaînement logique
              </h4>
              <p className="text-sm text-slate-700 bg-white border border-slate-200 rounded-lg p-4 leading-relaxed">
                {rapport.fond.validiteDemonstrations}
              </p>
            </div>
          </div>
        )}

        {/* Onglet 3: Forme */}
        {activeTab === "forme" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Rigueur d'exposition et style rédactionnel
              </h3>
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80">
                <KaTeXRenderer content={rapport.forme.analyseDetaillee} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Quantificateurs & Définition des variables
                </h4>
                <div className="text-sm text-slate-700 leading-relaxed">
                  <KaTeXRenderer
                    content={rapport.forme.rigueurNotationsEtQuantificateurs}
                  />
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Phraséologie française vs Connecteurs
                </h4>
                <div className="text-sm text-slate-700 leading-relaxed">
                  <KaTeXRenderer
                    content={rapport.forme.qualiteRedactionnelle}
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-200/80 rounded-xl p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800 mb-1.5">
                Conformité aux attentes spécifiques du Jury du CAPES
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {rapport.forme.respectDesNormesDuJury}
              </p>
            </div>
          </div>
        )}

        {/* Onglet 4: Rédaction Modèle */}
        {activeTab === "modele" && (
          <div className="space-y-4">
            <div className="border-l-4 border-indigo-600 pl-4 py-1">
              <h3 className="text-base font-bold text-slate-900">
                Proposition de Démonstration Exemplaire
              </h3>
              <p className="text-xs text-slate-500">
                Rédigée selon les standards attendus pour une copie de concours
                (clarté, aération, justification complète).
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200/80 shadow-inner font-serif">
              <KaTeXRenderer
                content={rapport.redactionModele}
                className="text-slate-800 text-sm sm:text-base"
              />
            </div>
          </div>
        )}

        {/* Onglet 5: Transcription OCR */}
        {activeTab === "transcription" && (
          <div className="space-y-4">
            <div className="border-l-4 border-slate-400 pl-4 py-1">
              <h3 className="text-base font-bold text-slate-900">
                Lecture déchiffrée par l'Examinateur
              </h3>
              <p className="text-xs text-slate-500">
                Consultez cette transcription pour vous assurer que le jury n'a
                pas mal interprété votre écriture manuscrite.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 text-sm font-mono text-slate-800 whitespace-pre-wrap">
              <KaTeXRenderer
                content={
                  rapport.transcription ||
                  "Aucune transcription textuelle disponible."
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
