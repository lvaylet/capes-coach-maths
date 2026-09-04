import type { RapportDeCorrection } from "../../types/domain";
import type {
  ExaminateurJury,
  OptionsEvaluation,
  OptionsRemediation,
} from "./types";

/**
 * Fixture de rapport réaliste simulant une évaluation du jury du CAPES.
 */
export const FIXTURE_RAPPORT_SIMULE: RapportDeCorrection = {
  transcription: `Soit $f : \\mathbb{R} \\to \\mathbb{R}$ définie par $f(x) = x^2 e^{-x}$.
Pour tout $x \\in \\mathbb{R}$, $f$ est dérivable comme produit de fonctions dérivables.
On calcule $f'(x) = 2x e^{-x} - x^2 e^{-x} = x(2 - x)e^{-x}$.
Pour $x \\in [0, 2]$, $f'(x) \\ge 0$, donc $f$ est croissante sur cet intervalle.
En particulier, $f(0) = 0$ et $f(2) = 4e^{-2} \\le 1$.
Par le théorème de convergence monotone, toute suite récurrente $u_{n+1} = f(u_n)$ avec $u_0 \\in [0, 2]$ converge vers 0.`,
  verdict: {
    noteIndicative: "12/20 (Admissible sous réserve de rigueur accrue)",
    appreciationGlobale:
      "Copie sérieuse montrant une bonne compréhension globale du problème d'analyse. Cependant, des raccourcis logiques et l'absence de justification sur la stabilité de l'intervalle affaiblissent la démonstration finale.",
    pointsForts: [
      "Calcul de la dérivée rigoureux et factorisation claire.",
      "Tableau de variations implicite correct sur $[0, 2]$.",
      "Bonne lisibilité globale et écriture soignée.",
    ],
    erreursCritiques: [
      "Stabilité de l'intervalle $[0, 2]$ non démontrée avant d'invoquer l'étude de la suite.",
      "Application hâtive du théorème de convergence monotone sans établir la monotonie de $(u_n)$.",
      "Confusion entre point fixe attractif et unicité de la limite.",
    ],
  },
  fond: {
    analyseDetaillee:
      "L'étude des variations de $f$ est convenablement menée sur $\\mathbb{R}$. En revanche, pour la suite récurrente $u_{n+1} = f(u_n)$, l'invariance $f([0, 2]) \\subset [0, 2]$ est passée sous silence. De plus, la monotonie de la suite $(u_n)$ dépend de la position de $u_0$ par rapport au point fixe et n'a pas été établie par récurrence.",
    theoremesEtHypotheses: [
      "Théorème de dérivation d'un produit : hypothèses correctement mentionnées.",
      "Théorème de la bijection / convergence monotone : hypothèse de monotonie de la suite omise.",
      "Continuité au point fixe : non explicitée lors du passage à la limite $L = f(L)$.",
    ],
    validiteDemonstrations:
      "La chaîne déductive est interrompue à la question 3. La conclusion sur la convergence de $(u_n)$ vers 0 n'est pas formellement démontrée.",
  },
  forme: {
    analyseDetaillee:
      "Le style rédactionnel est courtois et respecte les conventions mathématiques générales. On regrette néanmoins l'omission de quantificateurs dans l'initialisation des suites.",
    rigueurNotationsEtQuantificateurs:
      "La variable $x$ est correctement introduite par *« Soit $x \\in \\mathbb{R}$ »*. Toutefois, l'affirmation sur la suite omet la quantification *« Pour tout $n \\in \\mathbb{N}$ »*.",
    qualiteRedactionnelle:
      "Bon usage des connecteurs en français (*« On calcule »*, *« En particulier »*). Évitement salutaire de l'abus de flèches d'implication $\\Rightarrow$.",
    respectDesNormesDuJury:
      "Le jury apprécie la structure aérée, mais sanctionne le manque de vérification systématique des hypothèses de théorèmes classiques.",
  },
  redactionModele: `Soit $f : \\mathbb{R} \\to \\mathbb{R}$ l'application définie pour tout $x \\in \\mathbb{R}$ par :
$$f(x) = x^2 e^{-x}$$

**1. Étude des variations et stabilité de l'intervalle $I = [0, 2]$ :**
Les fonctions $x \\mapsto x^2$ et $x \\mapsto e^{-x}$ sont de classe $\\mathcal{C}^\\infty$ sur $\\mathbb{R}$, donc $f$ est dérivable sur $\\mathbb{R}$. Pour tout $x \\in \\mathbb{R}$ :
$$f'(x) = 2x e^{-x} - x^2 e^{-x} = x(2 - x)e^{-x}$$

Puisque $\\forall x \\in \\mathbb{R}, e^{-x} > 0$, le signe de $f'(x)$ est celui de $x(2 - x)$ :
- Pour tout $x \\in ]0, 2[$, $f'(x) > 0$, donc $f$ est strictement croissante sur $[0, 2]$.
- En $x = 0$, $f(0) = 0$. En $x = 2$, $f(2) = 4e^{-2} \\approx 0{,}541$.

Par stricte croissance de $f$ sur $[0, 2]$, on a $f([0, 2]) = [f(0), f(2)] = [0, 4e^{-2}] \\subset [0, 2]$. L'intervalle $I = [0, 2]$ est donc **stable par $f$**.

**2. Étude de la suite récurrente $(u_n)_{n \\in \\mathbb{N}}$ :**
Soit $u_0 \\in [0, 2]$. Montrons par récurrence que $\\forall n \\in \\mathbb{N}, u_n \\in [0, 2]$.
- Initialisation : $u_0 \\in [0, 2]$ par hypothèse.
- Hérédité : Si $u_n \\in [0, 2]$, alors $u_{n+1} = f(u_n) \\in f([0, 2]) \\subset [0, 2]$.

Résolvons l'équation des points fixes $f(x) = x$ sur $[0, 2]$ :
$$x^2 e^{-x} = x \\iff x(x e^{-x} - 1) = 0$$
Or pour tout $x \\in [0, 2]$, $x e^{-x} \\le f(1) = e^{-1} < 1$, donc $x e^{-x} - 1 < 0$. Le seul point fixe dans $[0, 2]$ est donc $x = 0$.

Par ailleurs, pour tout $x \\in ]0, 2]$, $f(x) - x = x(x e^{-x} - 1) < 0$, donc $f(x) < x$.
Par conséquent, pour tout $n \\in \\mathbb{N}$, $u_{n+1} \\le u_n$ : la suite $(u_n)$ est décroissante et minorée par 0.
En vertu du **théorème de la limite monotone**, $(u_n)$ converge vers une limite $L \\in [0, 2]$.
Par continuité de $f$ sur $\\mathbb{R}$, $f(L) = L$. Par unicité du point fixe sur cet intervalle, on conclut :
$$\\lim_{n \\to +\\infty} u_n = 0$$`,
  dateGeneration: new Date().toISOString(),
};

/**
 * Adaptateur simulé (Fake Adapter) pour les tests unitaires et le mode démonstration hors-ligne.
 */
export class FakeExaminateurAdapter implements ExaminateurJury {
  readonly estModeSimulation = true;

  constructor(
    public delaiMs: number = 0,
    public prochaineErreur?: Error,
    public prochainRapport?: RapportDeCorrection
  ) {}

  async evaluerCopie(
    _options: OptionsEvaluation
  ): Promise<RapportDeCorrection> {
    if (this.delaiMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delaiMs));
    }

    if (this.prochaineErreur) {
      const err = this.prochaineErreur;
      this.prochaineErreur = undefined;
      throw err;
    }

    if (this.prochainRapport) {
      const rep = this.prochainRapport;
      this.prochainRapport = undefined;
      return rep;
    }

    return {
      ...FIXTURE_RAPPORT_SIMULE,
      dateGeneration: new Date().toISOString(),
    };
  }

  async poserQuestionRemediation(options: OptionsRemediation): Promise<string> {
    if (this.delaiMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delaiMs));
    }

    if (this.prochaineErreur) {
      const err = this.prochaineErreur;
      this.prochaineErreur = undefined;
      throw err;
    }

    return `Voici la réponse du jury à votre interrogation relative à : *« ${options.nouvelleQuestion} »*.

Sur le fond, retenez qu'au CAPES, toute utilisation du théorème de la limite monotone requiert d'établir préalablement la monotonie (souvent par récurrence) ET le caractère borné.
La relation de récurrence $u_{n+1} = f(u_n)$ impose de vérifier que l'intervalle d'étude est **stable par $f$** ($f(I) \\subset I$).

Formule clef à retenir :
$$\\forall n \\in \\mathbb{N},\\quad u_{n+1} - u_n = f(u_n) - u_n$$
Le signe de $f(x) - x$ sur l'intervalle détermine le sens de variation de la suite.`;
  }
}
