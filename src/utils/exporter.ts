import { RankedLaptopOption, RecommendationWeights } from '../types/laptop';
import { formatPHP, formatStorage } from './markdownParser';
import { WEIGHT_LABELS } from './recommendation';

/**
 * Builds a clean, comprehensive JSON string for exporting a single `RankedLaptopOption`.
 */
export function buildOptionExportJson(
  option: RankedLaptopOption,
  totalOptions: number,
  weights: RecommendationWeights
): string {
  const totalWeight =
    Object.values(weights).reduce((sum, val) => sum + Math.max(0, val), 0) || 1;

  const normalizedWeights = Object.fromEntries(
    (Object.keys(weights) as (keyof RecommendationWeights)[]).map((key) => [
      WEIGHT_LABELS[key],
      `${Math.round((Math.max(0, weights[key]) / totalWeight) * 100)}%`,
    ])
  );

  const payload = {
    laptopName: option.cleanName,
    rawListingTitle: option.laptop,
    slug: option.slug,
    source: {
      raw: option.source,
      channel: option.sourceChannel,
      formFactor: option.formFactor,
    },
    price: {
      php: option.price,
      formatted: formatPHP(option.price),
    },
    rankings: {
      recommendationRank: option.recommendationRank,
      totalOptionsCompared: totalOptions,
      sourceValueRank: option.finalRank,
      adjustedRank: option.adjustedRank,
      adjustedRecommendation: option.adjustedRecommendation || null,
    },
    scores: {
      recommendationScore: option.recommendationScore,
      prePenaltyWeightedScore: option.rawWeightedScore,
      notePenaltyPoints: option.penaltyPoints,
      sourceTotalScore: option.score,
      sourceValueIndex: option.valueScore,
      adjustedScore: option.adjustedScore,
      adjustedValueIndex: option.adjustedValueIndex,
      componentScores: {
        gpu: option.gpuScore,
        cpu: option.cpuScore,
        vram: option.vramScore,
        display: option.displayScore,
        ram: option.ramScore,
        storage: option.storageScore,
        warranty: option.warrantyScore,
        freebies: option.freebieScore,
      },
      benchmarks: {
        averageFps: option.avgFps,
        onePercentLowFps: option.onePercentLowFps,
        cinebenchR23Single: option.cinebenchR23Single,
        cinebenchR23Multi: option.cinebenchR23Multi,
      },
      activeWeights: normalizedWeights,
    },
    specifications: {
      gpu: option.gpuDisplay,
      gpuCode: option.gpu,
      vramGB: option.vram,
      tgpWatts: option.formFactor === 'Desktop' && option.tgp === 0 ? 'Desktop PCIe GPU' : option.tgp,
      ramGB: option.ram,
      ramDescription: option.ramDescription,
      storageGB: option.storage,
      storageFormatted: formatStorage(option.storage),
      storageDescription: option.storageDescription,
      display: option.display,
      wireless: option.wireless,
      cpu: option.cpu,
      freebiesDescription: option.freebiesDescription,
      warrantyYears: option.warranty,
      warrantyDescription: option.warrantyDescription,
    },
    sourceComponentScores: {
      gpuScore: option.gpuScore,
      vramScore: option.vramScore,
      ramScore: option.ramScore,
      storageScore: option.storageScore,
      cpuScore: option.cpuScore,
      freebieScore: option.freebieScore,
      warrantyScore: option.warrantyScore,
    },
    notes: option.notes,
    pros: option.pros,
    cons: option.cons,
    finalRecommendationSummary: option.finalRecommendationSummary,
    dataSource: 'public/laptop-options.json',
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Builds a structured, human-readable Markdown purchase brief for a single `RankedLaptopOption`.
 */
export function buildOptionExportMarkdown(
  option: RankedLaptopOption,
  totalOptions: number,
  weights: RecommendationWeights
): string {
  const totalWeight =
    Object.values(weights).reduce((sum, val) => sum + Math.max(0, val), 0) || 1;

  const weightSummary = (Object.keys(weights) as (keyof RecommendationWeights)[])
    .map(
      (key) =>
        `${WEIGHT_LABELS[key]}: ${Math.round((Math.max(0, weights[key]) / totalWeight) * 100)}%`
    )
    .join(' · ');

  const tgpLabel =
    option.formFactor === 'Desktop' && option.tgp === 0
      ? 'Desktop PCIe GPU (N/A laptop TGP)'
      : `${option.tgp}W`;

  const prosBlock =
    option.pros.length > 0
      ? option.pros.map((p) => `- ${p}`).join('\n')
      : '- Balanced baseline hardware configuration';

  const consBlock =
    option.cons.length > 0
      ? option.cons.map((c) => `- ${c}`).join('\n')
      : '- No significant caveats flagged';

  return `# ${option.cleanName}

**Full Listing:** ${option.laptop}  
**Source:** ${option.source} (${option.sourceChannel})  
**Price:** ${formatPHP(option.price)}  
**Custom Recommendation Rank:** #${option.recommendationRank} of ${totalOptions} (Source Value Rank: #${option.finalRank})

---

## Scores & Evaluation

| Metric | Value |
| :--- | ---: |
| **Recommendation Score (Weighted)** | **${option.recommendationScore.toFixed(2)} / 100** |
| Pre-Penalty Hardware Score | ${option.rawWeightedScore.toFixed(2)} / 100 |
| Note Risk Penalty | ${option.penaltyPoints > 0 ? `-${option.penaltyPoints} pts` : '0 pts'} |
| **Source Total Score** | **${option.score.toFixed(2)} / 100** |
| **Source Value Index** | **${option.valueScore.toFixed(2)}** |
| Adjusted Rank / Score | ${option.adjustedRank === null ? 'Not ranked' : `#${option.adjustedRank} / ${option.adjustedScore?.toFixed(2) ?? '—'}`} |

**Active Weight Profile:** ${weightSummary}

---

## Full Specifications

| Component | Specification | Source Sub-Score |
| :--- | :--- | ---: |
| **GPU** | ${option.gpuDisplay} | ${option.gpuScore} |
| **VRAM** | ${option.vram}GB | ${option.vramScore} |
| **GPU Power / TGP** | ${tgpLabel} | Not separately scored |
| **RAM** | ${option.ramDescription} | ${option.ramScore} |
| **Storage** | ${option.storageDescription} | ${option.storageScore} |
| **Display** | ${option.display} | ${option.displayScore} |
| **CPU** | ${option.cpu} | ${option.cpuScore} |
| **Freebies / Bundle** | ${option.freebiesDescription} | ${option.freebieScore} |
| **Warranty** | ${option.warranty} ${option.warranty === 1 ? 'year' : 'years'} | ${option.warrantyScore} |

**Source Evaluator Notes:** ${option.notes || 'None'}

---

## Pros & Cons

### Pros
${prosBlock}

### Cons & Caveats
${consBlock}

---

## Final Recommendation Summary

${option.finalRecommendationSummary}

*Data source: \`public/laptop-options.json\`*
`;
}

/**
 * Triggers a browser file download using a temporary Blob object URL (safe inside sandboxed iframes).
 */
export function triggerFileDownload(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
