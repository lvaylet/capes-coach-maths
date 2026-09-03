import { describe, it, expect } from 'vitest';
import { db } from './db';

describe('Base de données IndexedDB MathsAssistant (db.ts)', () => {
  it('doit être instanciée avec le bon nom et les bonnes tables', () => {
    expect(db.name).toBe('MathsAssistantDB');
    expect(db.tables.map((t) => t.name)).toContain('sessions');
    expect(db.tables.map((t) => t.name)).toContain('images');
  });
});
