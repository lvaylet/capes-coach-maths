import { describe, it, expect } from 'vitest';
import { construirePromptSysteme } from './gemini';

describe('Ingénierie du Prompt Jury CAPES (gemini.ts)', () => {
  it('doit inclure les règles d\'or du jury pour l\'épreuve 1 (disciplinaire pure)', () => {
    const prompt = construirePromptSysteme('epreuve-1');

    expect(prompt).toContain('ÉPREUVE 1 du CAPES');
    expect(prompt).toContain('Rigueur formelle absolue');
    expect(prompt).toContain('RIGUEUR DE LA QUANTIFICATION');
    expect(prompt).toContain('CONNECTEURS LOGIQUES ET RÉDACTION');
    expect(prompt).toContain('VÉRIFICATION DES HYPOTHÈSES');
    expect(prompt).toContain('DISTINCTION FOND ET FORME');
    expect(prompt).toContain('JSON');
  });

  it('doit inclure les exigences didactiques pour l\'épreuve 2 (disciplinaire appliquée)', () => {
    const prompt = construirePromptSysteme('epreuve-2');

    expect(prompt).toContain('ÉPREUVE 2 du CAPES');
    expect(prompt).toContain('Clarté didactique');
    expect(prompt).toContain('erreurs d\'élèves');
    expect(prompt).toContain('Python');
  });

  it('doit intégrer les consignes personnalisées du candidat', () => {
    const consignesSpecifiques = 'Sois intransigeant sur les équivalences de normes.';
    const prompt = construirePromptSysteme('epreuve-1', consignesSpecifiques);

    expect(prompt).toContain(consignesSpecifiques);
  });
});
