import { describe, it, expect, beforeEach } from "vitest";
import {
  InMemorySessionRepository,
  DexieSessionRepository,
  creerSessionRepository,
  type SessionRepository,
} from "./index";
import type { SessionDEntrainement } from "../types/domain";

describe("Module Approfondi SessionRepository (src/db/)", () => {
  let repo: SessionRepository;

  const sampleSession: SessionDEntrainement = {
    id: "test-session-1",
    titre: "Session Analyse CAPES 2024",
    dateCreation: "2026-09-04T08:00:00.000Z",
    domaine: "Analyse",
    epreuve: "epreuve-1",
    enonce: {
      id: "enonce-1",
      texteOptionnel: "Étude d'une suite récurrente.",
      pages: [
        {
          id: "img-enonce-1",
          blob: new Blob(["page-enonce-1"]),
          previewUrl: "",
          nomFichier: "enonce1.jpg",
          rotation: 0,
          ordre: 1,
        },
      ],
    },
    copie: {
      id: "copie-1",
      pages: [
        {
          id: "img-copie-1",
          blob: new Blob(["page-copie-1"]),
          previewUrl: "",
          nomFichier: "copie1.jpg",
          rotation: 90,
          ordre: 1,
        },
        {
          id: "img-copie-2",
          blob: new Blob(["page-copie-2"]),
          previewUrl: "",
          nomFichier: "copie2.jpg",
          rotation: 0,
          ordre: 2,
        },
      ],
    },
    rapport: {
      transcription: "Soit f dérivable...",
      verdict: {
        noteIndicative: "14/20",
        appreciationGlobale: "Démonstration bien structurée.",
        pointsForts: ["Calcul précis"],
        erreursCritiques: [],
      },
      fond: {
        analyseDetaillee: "Validité vérifiée.",
        theoremesEtHypotheses: ["Théorème de convergence vérifié"],
        validiteDemonstrations: "Très bon raisonnement.",
      },
      forme: {
        analyseDetaillee: "Écriture soignée.",
        rigueurNotationsEtQuantificateurs: "Quantification complète.",
        qualiteRedactionnelle: "Français impeccable.",
        respectDesNormesDuJury: "Conforme.",
      },
      redactionModele: "$$f'(x) \\ge 0$$",
      dateGeneration: "2026-09-04T08:01:00.000Z",
    },
    messagesRemediation: [
      {
        id: "msg-1",
        auteur: "candidat",
        date: "2026-09-04T08:02:00.000Z",
        contenu: "La compacité est-elle nécessaire ici ?",
      },
    ],
  };

  beforeEach(async () => {
    repo = new InMemorySessionRepository();
  });

  it("doit sauvegarder et recharger une session complète avec ses images et métadonnées", async () => {
    const id = await repo.sauvegarderSession(sampleSession);
    expect(id).toBe(sampleSession.id);

    const reloaded = await repo.chargerSession(id);
    expect(reloaded).not.toBeNull();
    expect(reloaded?.titre).toBe("Session Analyse CAPES 2024");
    expect(reloaded?.domaine).toBe("Analyse");
    expect(reloaded?.epreuve).toBe("epreuve-1");
    expect(reloaded?.enonce.pages.length).toBe(1);
    expect(reloaded?.copie.pages.length).toBe(2);
    expect(reloaded?.copie.pages[0].rotation).toBe(90);
    expect(reloaded?.copie.pages[1].ordre).toBe(2);
    expect(reloaded?.rapport?.verdict.noteIndicative).toBe("14/20");
    expect(reloaded?.messagesRemediation.length).toBe(1);
  });

  it("doit retourner null si la session n'existe pas", async () => {
    const absent = await repo.chargerSession("session-inconnue");
    expect(absent).toBeNull();
  });

  it("doit lister les sessions triées par date de création décroissante", async () => {
    await repo.sauvegarderSession({
      ...sampleSession,
      id: "session-ancienne",
      dateCreation: "2026-09-01T10:00:00.000Z",
    });
    await repo.sauvegarderSession({
      ...sampleSession,
      id: "session-recente",
      dateCreation: "2026-09-04T12:00:00.000Z",
    });

    const liste = await repo.listerSessions();
    expect(liste.length).toBe(2);
    expect(liste[0].id).toBe("session-recente");
    expect(liste[1].id).toBe("session-ancienne");
  });

  it("doit supprimer une session et libérer ses données", async () => {
    const id = await repo.sauvegarderSession(sampleSession);
    expect(await repo.chargerSession(id)).not.toBeNull();

    await repo.supprimerSession(id);
    expect(await repo.chargerSession(id)).toBeNull();
    const liste = await repo.listerSessions();
    expect(liste.length).toBe(0);
  });

  it("doit vider entièrement le repository", async () => {
    await repo.sauvegarderSession(sampleSession);
    await repo.vider();
    expect(await repo.listerSessions()).toEqual([]);
  });

  it("la fabrique creerSessionRepository doit fournir la bonne implémentation", () => {
    const memoryRepo = creerSessionRepository("memory");
    expect(memoryRepo).toBeInstanceOf(InMemorySessionRepository);

    const dexieRepo = creerSessionRepository("dexie");
    expect(dexieRepo).toBeInstanceOf(DexieSessionRepository);
  });
});
