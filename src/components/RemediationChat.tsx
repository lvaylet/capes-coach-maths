import React, { useState } from 'react';
import { Send, User, Bot, Loader2, Sparkles } from 'lucide-react';
import type { MessageRemediation } from '../types/domain';
import { KaTeXRenderer } from './KaTeXRenderer';

interface RemediationChatProps {
  messages: MessageRemediation[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
}

const SUGGESTIONS = [
  'Pourquoi mon raisonnement par récurrence est-il incomplet ?',
  'Comment rédiger rigoureusement l\'introduction des quantificateurs ici ?',
  'Quelle est la formulation recommandée pour ce théorème ?',
  'Peux-tu m\'expliquer l\'erreur sur le calcul de la limite ?',
];

export const RemediationChat: React.FC<RemediationChatProps> = ({
  messages,
  onSendMessage,
  isLoading,
}) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const query = inputText;
    setInputText('');
    await onSendMessage(query);
  };

  const handleSuggestionClick = async (suggestion: string) => {
    if (isLoading) return;
    await onSendMessage(suggestion);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[520px]">
      {/* En-tête */}
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-slate-800 text-sm">
            Remédiation interactive avec l'Examinateur
          </h3>
        </div>
        <span className="text-xs text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
          Jury du CAPES
        </span>
      </div>

      {/* Historique des messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <Sparkles className="w-8 h-8 text-indigo-400 mb-2 opacity-60" />
            <p className="text-sm font-medium text-slate-600">
              Posez vos questions à l'examinateur du CAPES
            </p>
            <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
              Demandez des éclaircissements sur la correction, des conseils de rédaction ou la justification d'une étape.
            </p>

            {/* Suggestions rapides */}
            <div className="flex flex-wrap justify-center gap-1.5 max-w-md">
              {SUGGESTIONS.map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSuggestionClick(sug)}
                  className="text-xs bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200 rounded-full px-3 py-1 transition-colors cursor-pointer text-left shadow-2xs"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.auteur === 'candidat';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser ? 'bg-blue-600 text-white' : 'bg-indigo-600 text-white'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-2xs'
                  }`}
                >
                  <KaTeXRenderer content={msg.contenu} />
                  <span
                    className={`block text-[10px] mt-1 ${
                      isUser ? 'text-blue-200 text-right' : 'text-slate-400'
                    }`}
                  >
                    {new Date(msg.date).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex gap-3 max-w-[80%] items-center text-slate-500 text-xs italic bg-white p-3 rounded-xl border border-slate-200 w-fit">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            L'examinateur rédige sa réponse...
          </div>
        )}
      </div>

      {/* Saisie du message */}
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-200 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Posez une question sur un point de la correction..."
          disabled={isLoading}
          className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-40 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
