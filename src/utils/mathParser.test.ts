import { describe, it, expect } from 'vitest';
import { decouperSegmentsMathematiques } from './mathParser';

describe('Découpage des segments mathématiques (mathParser.ts)', () => {
  it('doit renvoyer une liste vide pour une chaîne vide', () => {
    expect(decouperSegmentsMathematiques('')).toEqual([]);
  });

  it('doit identifier du texte pur sans formules', () => {
    const res = decouperSegmentsMathematiques('Soit une fonction continue sur un intervalle.');
    expect(res).toEqual([
      { type: 'text', content: 'Soit une fonction continue sur un intervalle.' },
    ]);
  });

  it('doit extraire correctement les formules inline $...$', () => {
    const res = decouperSegmentsMathematiques('Soit $x \\in \\mathbb{R}$, on a $x^2 \\ge 0$.');
    expect(res).toEqual([
      { type: 'text', content: 'Soit ' },
      { type: 'inline-math', content: 'x \\in \\mathbb{R}' },
      { type: 'text', content: ', on a ' },
      { type: 'inline-math', content: 'x^2 \\ge 0' },
      { type: 'text', content: '.' },
    ]);
  });

  it('doit extraire correctement les formules display $$...$$', () => {
    const res = decouperSegmentsMathematiques(
      'Par le théorème de convergence dominée :\n$$\\lim_{n \\to \\infty} \\int_0^1 f_n(t) dt = \\int_0^1 f(t) dt$$\nCe qui conclut.'
    );
    expect(res).toEqual([
      { type: 'text', content: 'Par le théorème de convergence dominée :\n' },
      {
        type: 'display-math',
        content: '\\lim_{n \\to \\infty} \\int_0^1 f_n(t) dt = \\int_0^1 f(t) dt',
      },
      { type: 'text', content: '\nCe qui conclut.' },
    ]);
  });

  it('doit ignorer les dollars échappés \\$', () => {
    const res = decouperSegmentsMathematiques('Le prix est de 10\\$ pour $n$ exemplaires.');
    expect(res).toEqual([
      { type: 'text', content: 'Le prix est de 10\\$ pour ' },
      { type: 'inline-math', content: 'n' },
      { type: 'text', content: ' exemplaires.' },
    ]);
  });
});
