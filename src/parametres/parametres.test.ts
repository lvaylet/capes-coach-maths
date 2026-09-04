import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  LocalStorageParametresRepository,
  InMemoryParametresRepository,
  creerParametresRepository,
  DEFAULT_PARAMETRES,
  STORAGE_KEY_PARAMETRES,
} from "./index";

/**
 * Implémentation en mémoire de l'interface Storage pour les tests en environnement Node
 */
class MockStorage implements Storage {
  private store: Map<string, string> = new Map();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

describe("LocalStorageParametresRepository", () => {
  let mockStorage: MockStorage;
  let repository: LocalStorageParametresRepository;

  beforeEach(() => {
    mockStorage = new MockStorage();
    vi.restoreAllMocks();
    repository = new LocalStorageParametresRepository(mockStorage);
  });

  it("retourne les valeurs par défaut si localStorage est vide", () => {
    const params = repository.chargerParametres();
    expect(params).toEqual(DEFAULT_PARAMETRES);
  });

  it("récupère les valeurs stockées dans localStorage", () => {
    mockStorage.setItem(
      STORAGE_KEY_PARAMETRES,
      JSON.stringify({
        cleApiGemini: "AIzaSyTest123",
        modeleGemini: "gemini-1.5-flash",
        consignesPersonnalisees: "Exigence maximale",
      })
    );

    const params = repository.chargerParametres();
    expect(params).toEqual({
      cleApiGemini: "AIzaSyTest123",
      modeleGemini: "gemini-1.5-flash",
      consignesPersonnalisees: "Exigence maximale",
    });
  });

  it("gère gracieusement un JSON corrompu ou invalide dans localStorage", () => {
    mockStorage.setItem(STORAGE_KEY_PARAMETRES, "ceci n'est pas du json {");

    const params = repository.chargerParametres();
    expect(params).toEqual(DEFAULT_PARAMETRES);
  });

  it("gère les types non-objets comme null ou primitive stockée", () => {
    mockStorage.setItem(STORAGE_KEY_PARAMETRES, "42");
    expect(repository.chargerParametres()).toEqual(DEFAULT_PARAMETRES);

    mockStorage.setItem(STORAGE_KEY_PARAMETRES, "null");
    expect(repository.chargerParametres()).toEqual(DEFAULT_PARAMETRES);
  });

  it("sauvegarde les paramètres en nettoyant les espaces superflus", () => {
    repository.sauvegarderParametres({
      cleApiGemini: "  AIzaSyCleanKey  ",
      modeleGemini: "  gemini-2.0-flash  ",
      consignesPersonnalisees: "  Rigueur absolue  ",
    });

    const stored = JSON.parse(
      mockStorage.getItem(STORAGE_KEY_PARAMETRES) || "{}"
    );
    expect(stored).toEqual({
      cleApiGemini: "AIzaSyCleanKey",
      modeleGemini: "gemini-2.0-flash",
      consignesPersonnalisees: "Rigueur absolue",
    });

    const charges = repository.chargerParametres();
    expect(charges.cleApiGemini).toBe("AIzaSyCleanKey");
    expect(charges.modeleGemini).toBe("gemini-2.0-flash");
    expect(charges.consignesPersonnalisees).toBe("Rigueur absolue");
  });

  it("utilise le modèle par défaut si une valeur vide est fournie", () => {
    repository.sauvegarderParametres({
      cleApiGemini: "AIzaSyKey",
      modeleGemini: "   ",
      consignesPersonnalisees: "",
    });

    const charges = repository.chargerParametres();
    expect(charges.modeleGemini).toBe(DEFAULT_PARAMETRES.modeleGemini);
  });

  it("réinitialise les paramètres en supprimant la clé de localStorage", () => {
    repository.sauvegarderParametres({
      cleApiGemini: "AIzaSyTest",
      modeleGemini: "gemini-1.5-pro",
      consignesPersonnalisees: "Test",
    });

    expect(mockStorage.getItem(STORAGE_KEY_PARAMETRES)).not.toBeNull();

    const parDefaut = repository.reinitialiserParametres();
    expect(parDefaut).toEqual(DEFAULT_PARAMETRES);
    expect(mockStorage.getItem(STORAGE_KEY_PARAMETRES)).toBeNull();
  });

  it("valide la présence et le format de la clé API", () => {
    // Clé vide -> valide mais avertissement mode simulation
    const resVide = repository.validerCleApi("");
    expect(resVide.valide).toBe(true);
    expect(resVide.avertissement).toContain("simulation");

    // Clé sans préfixe AIzaSy -> valide mais avertissement
    const resAutre = repository.validerCleApi("sk-ant-123456");
    expect(resAutre.valide).toBe(true);
    expect(resAutre.avertissement).toContain("AIzaSy");

    // Clé officielle Gemini -> valide sans avertissement
    const resOk = repository.validerCleApi("AIzaSyB_1234567890abcdef");
    expect(resOk.valide).toBe(true);
    expect(resOk.avertissement).toBeUndefined();
  });

  it("gère l'absence de stockage sans lever d'exception", () => {
    const repoSansStorage = new LocalStorageParametresRepository(
      null as unknown as Storage
    );

    expect(() => repoSansStorage.chargerParametres()).not.toThrow();
    expect(repoSansStorage.chargerParametres()).toEqual(DEFAULT_PARAMETRES);

    expect(() =>
      repoSansStorage.sauvegarderParametres(DEFAULT_PARAMETRES)
    ).not.toThrow();
    expect(() => repoSansStorage.reinitialiserParametres()).not.toThrow();
  });
});

describe("InMemoryParametresRepository", () => {
  it("initialise avec les valeurs par défaut ou personnalisées", () => {
    const repoDefaut = new InMemoryParametresRepository();
    expect(repoDefaut.chargerParametres()).toEqual(DEFAULT_PARAMETRES);

    const repoCustom = new InMemoryParametresRepository({
      cleApiGemini: "AIzaSyCustom",
    });
    expect(repoCustom.chargerParametres().cleApiGemini).toBe("AIzaSyCustom");
    expect(repoCustom.chargerParametres().modeleGemini).toBe(
      DEFAULT_PARAMETRES.modeleGemini
    );
  });

  it("sauvegarde et récupère les paramètres isolés en mémoire", () => {
    const repo = new InMemoryParametresRepository();
    repo.sauvegarderParametres({
      cleApiGemini: " AIzaSyInMem ",
      modeleGemini: " gemini-1.5-flash ",
      consignesPersonnalisees: " Rigueur ",
    });

    const params = repo.chargerParametres();
    expect(params).toEqual({
      cleApiGemini: "AIzaSyInMem",
      modeleGemini: "gemini-1.5-flash",
      consignesPersonnalisees: "Rigueur",
    });
  });

  it("réinitialise les paramètres", () => {
    const repo = new InMemoryParametresRepository({
      cleApiGemini: "AIzaSyInMem",
    });
    expect(repo.chargerParametres().cleApiGemini).toBe("AIzaSyInMem");

    const reinit = repo.reinitialiserParametres();
    expect(reinit).toEqual(DEFAULT_PARAMETRES);
    expect(repo.chargerParametres()).toEqual(DEFAULT_PARAMETRES);
  });

  it("valide la clé API de façon cohérente", () => {
    const repo = new InMemoryParametresRepository();
    expect(repo.validerCleApi("").avertissement).toContain("simulation");
    expect(repo.validerCleApi("AIzaSyValid").avertissement).toBeUndefined();
  });
});

describe("creerParametresRepository", () => {
  it("instancie LocalStorageParametresRepository par défaut", () => {
    const repo = creerParametresRepository();
    expect(repo).toBeInstanceOf(LocalStorageParametresRepository);
  });

  it("instancie InMemoryParametresRepository à la demande", () => {
    const repo = creerParametresRepository("inMemory");
    expect(repo).toBeInstanceOf(InMemoryParametresRepository);
  });
});
