import { useState, useEffect, useCallback, useRef } from "react";

export interface RawGeminiModel {
  name: string; // ex: "models/gemini-2.5-flash"
  version?: string;
  displayName?: string;
  description?: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  supportedGenerationMethods?: string[];
}

export interface ModeleExaminateurInfo {
  id: string; // ex: "gemini-2.5-flash"
  nomAffiche: string; // ex: "Gemini 2.5 Flash"
  description?: string;
  estRecommande?: boolean;
}

export const MODELES_PAR_DEFAUT: ModeleExaminateurInfo[] = [
  {
    id: "gemini-2.5-flash",
    nomAffiche: "Gemini 2.5 Flash",
    description:
      "Recommandé : Rapide, économique et précis pour l'évaluation multimodale",
    estRecommande: true,
  },
  {
    id: "gemini-2.5-pro",
    nomAffiche: "Gemini 2.5 Pro",
    description:
      "Recommandé : Raisonnement mathématique poussé et démonstrations ardues",
    estRecommande: true,
  },
  {
    id: "gemini-2.0-flash",
    nomAffiche: "Gemini 2.0 Flash",
    description: "Génération ultra-rapide et multimodale",
    estRecommande: false,
  },
  {
    id: "gemini-1.5-flash",
    nomAffiche: "Gemini 1.5 Flash",
    description: "Version antérieure stable et éprouvée",
    estRecommande: false,
  },
  {
    id: "gemini-1.5-pro",
    nomAffiche: "Gemini 1.5 Pro",
    description: "Version antérieure pour contexte étendu",
    estRecommande: false,
  },
];

/**
 * Retourne la liste statique de secours des modèles de l'examinateur
 */
export function obtenirModelesParDefaut(): ModeleExaminateurInfo[] {
  return [...MODELES_PAR_DEFAUT];
}

/**
 * Filtre les modèles bruts retournés par l'API Google Generative Language :
 * conserve uniquement ceux supportant `generateContent` et la famille Gemini,
 * retire le préfixe technique `models/`, et ordonne par pertinence.
 */
export function filtrerEtNormaliserModeles(
  rawModels: RawGeminiModel[]
): ModeleExaminateurInfo[] {
  const modelesFiltres = rawModels
    .filter((m) => {
      if (!m.name) return false;
      const id = m.name.replace(/^models\//, "");
      const estGemini = id.startsWith("gemini-");
      const supporteGeneration =
        Array.isArray(m.supportedGenerationMethods) &&
        m.supportedGenerationMethods.includes("generateContent");
      return estGemini && supporteGeneration;
    })
    .map((m): ModeleExaminateurInfo => {
      const id = m.name.replace(/^models\//, "");
      const nomAffiche = m.displayName || id;
      const estRecommande =
        id === "gemini-2.5-flash" || id === "gemini-2.5-pro";
      return {
        id,
        nomAffiche,
        description: m.description,
        estRecommande,
      };
    });

  return modelesFiltres.sort((a, b) => {
    if (a.estRecommande && !b.estRecommande) return -1;
    if (!a.estRecommande && b.estRecommande) return 1;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Récupère la liste des modèles disponibles depuis l'API Google avec la clé API fournie.
 * Retourne la liste par défaut si la clé est vide ou en cas de repli.
 */
export async function recupererModelesDepuisApi(
  cleApi?: string,
  fetchFn: typeof fetch = fetch
): Promise<ModeleExaminateurInfo[]> {
  if (!cleApi || !cleApi.trim()) {
    return obtenirModelesParDefaut();
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${cleApi.trim()}`;
  let response: Response;
  try {
    response = await fetchFn(url);
  } catch (err) {
    throw new Error(
      `Impossible de joindre l'API Google Gemini (${(err as Error).message}).`
    );
  }

  if (!response.ok) {
    if (response.status === 400 || response.status === 403) {
      throw new Error(
        "Clé API Gemini invalide ou accès refusé. Vérifiez votre clé Google AI Studio."
      );
    }
    throw new Error(
      `Échec de la récupération des modèles Gemini (HTTP ${response.status} ${response.statusText}).`
    );
  }

  const data = (await response.json()) as { models?: RawGeminiModel[] };
  if (!data.models || !Array.isArray(data.models)) {
    return obtenirModelesParDefaut();
  }

  const modeles = filtrerEtNormaliserModeles(data.models);
  return modeles.length > 0 ? modeles : obtenirModelesParDefaut();
}

export type StatutModeles = "defaut" | "chargement" | "synchronise" | "erreur";

/**
 * Hook React fournissant la liste dynamique des modèles de l'examinateur avec mise en cache mémoire
 */
export function useModelesExaminateur(cleApi?: string) {
  const [modeles, setModeles] = useState<ModeleExaminateurInfo[]>(
    obtenirModelesParDefaut()
  );
  const [statut, setStatut] = useState<StatutModeles>("defaut");
  const [erreur, setErreur] = useState<string | null>(null);

  // Cache mémoire par clé API
  const cacheRef = useRef<Map<string, ModeleExaminateurInfo[]>>(new Map());

  const charger = useCallback(
    async (forcer: boolean = false) => {
      const cle = cleApi?.trim() || "";
      if (!cle) {
        setModeles(obtenirModelesParDefaut());
        setStatut("defaut");
        setErreur(null);
        return;
      }

      if (!forcer && cacheRef.current.has(cle)) {
        setModeles(cacheRef.current.get(cle)!);
        setStatut("synchronise");
        setErreur(null);
        return;
      }

      setStatut("chargement");
      setErreur(null);

      try {
        const liste = await recupererModelesDepuisApi(cle);
        cacheRef.current.set(cle, liste);
        setModeles(liste);
        setStatut("synchronise");
      } catch (err) {
        setStatut("erreur");
        setErreur((err as Error).message);
        setModeles(obtenirModelesParDefaut());
      }
    },
    [cleApi]
  );

  useEffect(() => {
    charger(false);
  }, [charger]);

  return {
    modeles,
    statut,
    enChargement: statut === "chargement",
    erreur,
    rafraichir: () => charger(true),
  };
}
