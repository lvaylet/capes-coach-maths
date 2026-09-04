import type { RapportDeCorrection } from "../types/domain";
import type { FormateurRapport, TelechargeurFichier } from "./types";
import { BrowserTelechargeur } from "./telechargeur";

/**
 * Implémentation du module FormateurRapport centralisant le formatage Markdown
 * et l'exportation des rapports d'évaluation du jury.
 */
export class DefaultFormateurRapport implements FormateurRapport {
  constructor(
    private telechargeur: TelechargeurFichier = new BrowserTelechargeur()
  ) {}

  /**
   * Génère un nom de fichier assaini et normalisé pour l'export
   */
  genererNomFichier(
    titreSession: string = "Session CAPES",
    extension: string = "md"
  ): string {
    const slug =
      (titreSession || "session-capes")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Suppression des accents
        .replace(/[^a-z0-9]+/g, "-") // Remplacement des caractères spéciaux par des tirets
        .replace(/^-+|-+$/g, "") || "session";

    const extPropre = extension.replace(/^\./, "");
    return `rapport-capes-${slug}.${extPropre}`;
  }

  /**
   * Construit le document Markdown complet et rigoureusement structuré
   * conformément aux critères officiels du jury du CAPES.
   */
  genererMarkdown(
    rapport: RapportDeCorrection,
    titreSession: string = "Session CAPES"
  ): string {
    const dateFormatee = new Date(rapport.dateGeneration).toLocaleString(
      "fr-FR"
    );

    const pointsFortsListe =
      rapport.verdict.pointsForts.length > 0
        ? rapport.verdict.pointsForts.map((p) => `- ${p}`).join("\n")
        : "- Aucun point fort spécifique relevé.";

    const erreursCritiquesListe =
      rapport.verdict.erreursCritiques.length > 0
        ? rapport.verdict.erreursCritiques.map((e) => `- ${e}`).join("\n")
        : "- Aucune erreur critique majeure constatée.";

    const theoremesListe =
      rapport.fond.theoremesEtHypotheses.length > 0
        ? rapport.fond.theoremesEtHypotheses.map((t) => `- ${t}`).join("\n")
        : "- Aucun théorème spécifique listé.";

    return `# Rapport d'évaluation CAPES de Mathématiques - ${titreSession}
Date : ${dateFormatee}

## Verdict
- Note indicative : ${rapport.verdict.noteIndicative || "Non noté"}
- Appréciation : ${rapport.verdict.appreciationGlobale}

### Points forts
${pointsFortsListe}

### Erreurs critiques
${erreursCritiquesListe}

---

## Analyse du Fond
${rapport.fond.analyseDetaillee}

### Théorèmes et Hypothèses
${theoremesListe}

### Validité des Démonstrations
${rapport.fond.validiteDemonstrations}

---

## Analyse de la Forme
${rapport.forme.analyseDetaillee}

### Notations et Quantificateurs
${rapport.forme.rigueurNotationsEtQuantificateurs}

### Qualité Rédactionnelle
${rapport.forme.qualiteRedactionnelle}

### Respect des normes du Jury
${rapport.forme.respectDesNormesDuJury}

---

## Rédaction Modèle du Jury
${rapport.redactionModele}

---

## Transcription manuscrite déchiffrée
${rapport.transcription}
`;
  }

  /**
   * Orchestre la génération du document et son téléchargement local
   */
  async telechargerMarkdown(
    rapport: RapportDeCorrection,
    titreSession: string = "Session CAPES"
  ): Promise<void> {
    const contenu = this.genererMarkdown(rapport, titreSession);
    const nomFichier = this.genererNomFichier(titreSession, "md");
    await this.telechargeur.telechargerFichier(
      contenu,
      nomFichier,
      "text/markdown;charset=utf-8;"
    );
  }

  /**
   * Copie l'intégralité du rapport au format Markdown dans le presse-papier
   */
  async copierDansPressePapier(
    rapport: RapportDeCorrection,
    titreSession: string = "Session CAPES"
  ): Promise<boolean> {
    const contenu = this.genererMarkdown(rapport, titreSession);
    return await this.telechargeur.copierTexte(contenu);
  }
}
