import { describe, it, expect } from 'vitest';
import { db } from './db';

describe('Base de données IndexedDB CapesCoachMaths (db.ts)', () => {
  it('doit être instanciée avec le bon nom et les bonnes tables', () => {
    expect(db.name).toBe('CapesCoachMathsDB');
    expect(db.tables.map((t) => t.name)).toContain('sessions');
    expect(db.tables.map((t) => t.name)).toContain('images');
  });
});
