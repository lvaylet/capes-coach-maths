import React from 'react';
import katex from 'katex';
import { decouperSegmentsMathematiques } from '../utils/mathParser';

interface KaTeXRendererProps {
  content: string;
  className?: string;
}

/**
 * Découpe et restitue du contenu Markdown enrichi de formules KaTeX :
 * - $$ ... $$ pour les formules hors-ligne (displayMode: true)
 * - $ ... $ pour les formules en ligne (displayMode: false)
 */
export const KaTeXRenderer: React.FC<KaTeXRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  const renderMath = (math: string, displayMode: boolean) => {
    try {
      const html = katex.renderToString(math, {
        displayMode,
        throwOnError: false,
      });
      return <span dangerouslySetInnerHTML={{ __html: html }} />;
    } catch {
      return <code>{math}</code>;
    }
  };

  const segments = decouperSegmentsMathematiques(content);

  return (
    <div className={`math-renderer leading-relaxed ${className}`}>
      {segments.map((seg, idx) => {
        if (seg.type === 'display-math') {
          return (
            <div key={idx} className="my-3 overflow-x-auto text-center py-1">
              {renderMath(seg.content, true)}
            </div>
          );
        }
        if (seg.type === 'inline-math') {
          return (
            <span key={idx} className="mx-0.5 inline-block">
              {renderMath(seg.content, false)}
            </span>
          );
        }
        // Texte normal avec support des sauts de ligne
        return (
          <span key={idx} className="whitespace-pre-wrap">
            {seg.content}
          </span>
        );
      })}
    </div>
  );
};
