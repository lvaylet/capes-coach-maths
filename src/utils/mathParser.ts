export interface MathSegment {
  type: 'text' | 'inline-math' | 'display-math';
  content: string;
}

/**
 * Découpe une chaîne en segments textuels et mathématiques (inline et display)
 * en tenant compte des échappements \$
 */
export function decouperSegmentsMathematiques(source: string): MathSegment[] {
  if (!source) return [];

  const segments: MathSegment[] = [];

  // Découpage d'abord selon les $$...$$
  const displayRegex = /(?<!\\)\$\$((?:\\\$|[^$])+)\$\$/g;
  let lastDisplayIndex = 0;
  let displayMatch: RegExpExecArray | null;

  while ((displayMatch = displayRegex.exec(source)) !== null) {
    if (displayMatch.index > lastDisplayIndex) {
      const textChunk = source.slice(lastDisplayIndex, displayMatch.index);
      decouperSegmentsInline(textChunk, segments);
    }

    segments.push({
      type: 'display-math',
      content: displayMatch[1].trim(),
    });

    lastDisplayIndex = displayRegex.lastIndex;
  }

  if (lastDisplayIndex < source.length) {
    const remaining = source.slice(lastDisplayIndex);
    decouperSegmentsInline(remaining, segments);
  }

  return segments;
}

function decouperSegmentsInline(text: string, segments: MathSegment[]): void {
  const inlineRegex = /(?<!\\)\$((?:\\\$|[^$])+)\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = inlineRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const rawText = text.slice(lastIndex, match.index);
      if (rawText) {
        segments.push({ type: 'text', content: rawText });
      }
    }

    segments.push({
      type: 'inline-math',
      content: match[1].trim(),
    });

    lastIndex = inlineRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex);
    if (remaining) {
      segments.push({ type: 'text', content: remaining });
    }
  }
}
