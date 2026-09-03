import React, { useState } from 'react';
import { X, Clock, Trash2, ChevronRight, Filter, BookOpen } from 'lucide-react';
import type { StoredSessionRecord } from '../db/db';
import type { DomaineMathematique } from '../types/domain';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: StoredSessionRecord[];
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

const DOMAINES: (DomaineMathematique | 'Tous')[] = [
  'Tous',
  'Algebre',
  'Analyse',
  'Geometrie',
  'Probabilites',
  'Arithmetique',
  'Autre',
];

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  sessions,
  onSelectSession,
  onDeleteSession,
}) => {
  const [selectedDomaine, setSelectedDomaine] = useState<DomaineMathematique | 'Tous'>('Tous');

  if (!isOpen) return null;

  const filteredSessions = sessions.filter((s) => {
    if (selectedDomaine === 'Tous') return true;
    return s.domaine === selectedDomaine;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* En-tête */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm">
              Historique des entraînements ({sessions.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filtres par domaine mathématique */}
        <div className="p-3 border-b border-slate-200 bg-slate-50/50 flex items-center gap-1.5 overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
          {DOMAINES.map((dom) => (
            <button
              key={dom}
              type="button"
              onClick={() => setSelectedDomaine(dom)}
              className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-colors cursor-pointer ${
                selectedDomaine === dom
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {dom}
            </button>
          ))}
        </div>

        {/* Liste des sessions */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredSessions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <BookOpen className="w-8 h-8 opacity-40 mb-2" />
              <p className="text-sm">Aucune session d'entraînement enregistrée.</p>
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.id}
                className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-3.5 transition-all hover:shadow-sm flex items-center justify-between gap-3 group"
              >
                <div
                  onClick={() => {
                    onSelectSession(session.id);
                    onClose();
                  }}
                  className="flex-1 min-w-0 cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {session.domaine}
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {session.epreuve === 'epreuve-1'
                        ? 'Épreuve 1'
                        : session.epreuve === 'epreuve-2'
                        ? 'Épreuve 2'
                        : 'Auto'}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-600">
                    {session.titre}
                  </h4>

                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                    <span>{new Date(session.dateCreation).toLocaleDateString('fr-FR')}</span>
                    {session.rapport?.verdict?.noteIndicative && (
                      <span className="font-bold text-emerald-600">
                        {session.rapport.verdict.noteIndicative}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onDeleteSession(session.id)}
                    title="Supprimer la session"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSession(session.id);
                      onClose();
                    }}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
