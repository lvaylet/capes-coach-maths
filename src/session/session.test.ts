import { describe, it, expect } from "vitest";
import {
  creerEtatInitial,
  sessionReducer,
  SessionCoordinator,
  type ActionSession,
  type EtatSession,
} from "./index";
import { FakeExaminateurAdapter } from "../services/examinateur/fakeAdapter";
import { InMemorySessionRepository } from "../db/inMemoryRepository";
import type { PageImage, SessionDEntrainement } from "../types/domain";

describe("Module de Session d'entraînement (src/session)", () => {
  describe("Machine d'états pure (reducer.ts)", () => {
    it("doit initialiser un état par défaut cohérent avec CONTEXT.md", () => {
      const etat = creerEtatInitial(new Date("2026-09-04T10:00:00Z"));
      expect(etat.domaine).toBe("Analyse");
      expect(etat.epreuve).toBe("epreuve-1");
      expect(etat.copiePages).toHaveLength(0);
      expect(etat.sessionActive).toBeNull();
      expect(etat.enEvaluation).toBe(false);
      expect(etat.erreur).toBeNull();
    });

    it("doit muter les métadonnées et contenus de session", () => {
      let state = creerEtatInitial();
      state = sessionReducer(state, {
        type: "SET_TITRE",
        titre: "Problème d'Algèbre",
      });
      state = sessionReducer(state, {
        type: "SET_DOMAINE",
        domaine: "Algebre",
      });
      state = sessionReducer(state, {
        type: "SET_EPREUVE",
        epreuve: "epreuve-2",
      });
      state = sessionReducer(state, {
        type: "SET_ENONCE_TEXTE",
        texte: "Soit G un groupe...",
      });

      expect(state.titre).toBe("Problème d'Algèbre");
      expect(state.domaine).toBe("Algebre");
      expect(state.epreuve).toBe("epreuve-2");
      expect(state.enonceTexte).toBe("Soit G un groupe...");
    });

    it("doit gérer le cycle d'évaluation (début, succès, erreur)", () => {
      let state = creerEtatInitial();
      state = sessionReducer(state, { type: "DEBUT_EVALUATION" });
      expect(state.enEvaluation).toBe(true);
      expect(state.erreur).toBeNull();

      const fakeSession: SessionDEntrainement = {
        id: "sess-1",
        titre: "Épreuve 1",
        dateCreation: "2026-09-04",
        domaine: "Analyse",
        epreuve: "epreuve-1",
        enonce: { id: "e1", pages: [] },
        copie: { id: "c1", pages: [] },
        rapport: {
          transcription: "Démonstration",
          verdict: {
            appreciationGlobale: "Bien",
            pointsForts: [],
            erreursCritiques: [],
          },
          fond: {
            analyseDetaillee: "",
            theoremesEtHypotheses: [],
            validiteDemonstrations: "",
          },
          forme: {
            analyseDetaillee: "",
            rigueurNotationsEtQuantificateurs: "",
            qualiteRedactionnelle: "",
            respectDesNormesDuJury: "",
          },
          redactionModele: "$$x > 0$$",
          dateGeneration: "2026-09-04",
        },
        messagesRemediation: [],
      };

      state = sessionReducer(state, {
        type: "SUCCES_EVALUATION",
        session: fakeSession,
      });
      expect(state.enEvaluation).toBe(false);
      expect(state.sessionActive).toEqual(fakeSession);
      expect(state.sessionId).toBe("sess-1");

      state = sessionReducer(state, { type: "DEBUT_EVALUATION" });
      state = sessionReducer(state, {
        type: "ERREUR_EVALUATION",
        erreur: "Clé invalide",
      });
      expect(state.enEvaluation).toBe(false);
      expect(state.erreur).toBe("Clé invalide");
    });

    it("doit réinitialiser la session tout en préservant la liste d'historique", () => {
      const state: EtatSession = {
        ...creerEtatInitial(),
        titre: "Session modifiée",
        copiePages: [
          {
            id: "1",
            blob: new Blob([]),
            previewUrl: "url",
            nomFichier: "1.jpg",
            rotation: 0,
            ordre: 0,
          },
        ],
        listeHistorique: [
          {
            id: "hist-1",
            titre: "Ancien entraînement",
            dateCreation: "2026-09-01",
            domaine: "Geometrie",
            epreuve: "epreuve-1",
            messagesRemediation: [],
          },
        ],
      };

      const reinitialise = sessionReducer(state, {
        type: "REINITIALISER_SESSION",
      });
      expect(reinitialise.copiePages).toHaveLength(0);
      expect(reinitialise.titre).toContain("Entraînement");
      expect(reinitialise.listeHistorique).toHaveLength(1);
      expect(reinitialise.listeHistorique[0].id).toBe("hist-1");
    });
  });

  describe("Orchestrateur asynchrone (SessionCoordinator)", () => {
    it("doit refuser d'évaluer si aucune copie n'est fournie", async () => {
      const fakeExaminateur = new FakeExaminateurAdapter();
      const inMemoryRepo = new InMemorySessionRepository();
      const coordinator = new SessionCoordinator(fakeExaminateur, inMemoryRepo);

      const state = creerEtatInitial();
      const actionsDispatchees: ActionSession[] = [];
      const dispatch = (action: ActionSession) =>
        actionsDispatchees.push(action);

      await coordinator.lancerEvaluation(state, dispatch);

      expect(actionsDispatchees).toHaveLength(1);
      expect(actionsDispatchees[0]).toEqual({
        type: "ERREUR_EVALUATION",
        erreur:
          "Veuillez ajouter au moins une photo de votre copie manuscrite.",
      });
    });

    it("doit orchestrer l'évaluation complète, la sauvegarde et l'actualisation de l'historique", async () => {
      const fakeExaminateur = new FakeExaminateurAdapter(0); // réponse immédiate
      const inMemoryRepo = new InMemorySessionRepository();
      const coordinator = new SessionCoordinator(fakeExaminateur, inMemoryRepo);

      const pageCopie: PageImage = {
        id: "p1",
        blob: new Blob(["copie"]),
        previewUrl: "blob:p1",
        nomFichier: "page1.jpg",
        rotation: 0,
        ordre: 0,
      };

      const state: EtatSession = {
        ...creerEtatInitial(),
        titre: "Session Analyse 2026",
        domaine: "Analyse",
        epreuve: "epreuve-1",
        copiePages: [pageCopie],
      };

      const actionsDispatchees: ActionSession[] = [];
      const dispatch = (action: ActionSession) =>
        actionsDispatchees.push(action);

      await coordinator.lancerEvaluation(state, dispatch);

      expect(actionsDispatchees.map((a) => a.type)).toContain(
        "DEBUT_EVALUATION"
      );
      expect(actionsDispatchees.map((a) => a.type)).toContain(
        "SUCCES_EVALUATION"
      );
      expect(actionsDispatchees.map((a) => a.type)).toContain("SET_HISTORIQUE");

      // Vérifier que la session a bien été persistée dans le repository
      const sessions = await inMemoryRepo.listerSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].titre).toBe("Session Analyse 2026");
    });

    it("doit orchestrer la remédiation interactive et la persistance de l'échange", async () => {
      const fakeExaminateur = new FakeExaminateurAdapter(0);
      const inMemoryRepo = new InMemorySessionRepository();
      const coordinator = new SessionCoordinator(fakeExaminateur, inMemoryRepo);

      // Créer une session active avec rapport préalable
      const sessionActive: SessionDEntrainement = {
        id: "sess-active",
        titre: "Session Remédiation",
        dateCreation: new Date().toISOString(),
        domaine: "Analyse",
        epreuve: "epreuve-1",
        enonce: { id: "e1", pages: [] },
        copie: { id: "c1", pages: [] },
        rapport: {
          transcription: "Calculs",
          verdict: {
            appreciationGlobale: "Bien",
            pointsForts: [],
            erreursCritiques: [],
          },
          fond: {
            analyseDetaillee: "OK",
            theoremesEtHypotheses: [],
            validiteDemonstrations: "",
          },
          forme: {
            analyseDetaillee: "OK",
            rigueurNotationsEtQuantificateurs: "",
            qualiteRedactionnelle: "",
            respectDesNormesDuJury: "",
          },
          redactionModele: "$$x=1$$",
          dateGeneration: "2026-09-04",
        },
        messagesRemediation: [],
      };

      await inMemoryRepo.sauvegarderSession(sessionActive);

      const state: EtatSession = {
        ...creerEtatInitial(),
        sessionId: "sess-active",
        sessionActive,
      };

      const actionsDispatchees: ActionSession[] = [];
      const dispatch = (action: ActionSession) =>
        actionsDispatchees.push(action);

      await coordinator.envoyerRemediation(
        state,
        dispatch,
        "Pouvez-vous expliciter la rédaction modèle ?"
      );

      expect(actionsDispatchees.map((a) => a.type)).toContain(
        "DEBUT_REMEDIATION"
      );
      expect(actionsDispatchees.map((a) => a.type)).toContain(
        "SUCCES_REMEDIATION"
      );

      // Vérifier la mise à jour des messages dans le repository
      const reload = await inMemoryRepo.chargerSession("sess-active");
      expect(reload?.messagesRemediation).toHaveLength(2);
      expect(reload?.messagesRemediation[0].auteur).toBe("candidat");
      expect(reload?.messagesRemediation[1].auteur).toBe("examinateur");
    });

    it("doit gérer les erreurs de l'examinateur lors de l'évaluation", async () => {
      const failingExaminateur = new FakeExaminateurAdapter(
        0,
        new Error("Quota API dépassé")
      );
      const inMemoryRepo = new InMemorySessionRepository();
      const coordinator = new SessionCoordinator(
        failingExaminateur,
        inMemoryRepo
      );

      const state: EtatSession = {
        ...creerEtatInitial(),
        copiePages: [
          {
            id: "p1",
            blob: new Blob([]),
            previewUrl: "url",
            nomFichier: "p1.jpg",
            rotation: 0,
            ordre: 0,
          },
        ],
      };

      const actionsDispatchees: ActionSession[] = [];
      const dispatch = (action: ActionSession) =>
        actionsDispatchees.push(action);

      await coordinator.lancerEvaluation(state, dispatch);

      expect(actionsDispatchees).toEqual([
        { type: "DEBUT_EVALUATION" },
        { type: "ERREUR_EVALUATION", erreur: "Quota API dépassé" },
      ]);
    });
  });
});
