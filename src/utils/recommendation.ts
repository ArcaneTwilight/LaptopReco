import {
  ComponentBreakdown,
  LaptopOption,
  PenaltyDetail,
  RankedLaptopOption,
  RecommendationWeights,
} from '../types/laptop';
import { formatPHP, formatStorage } from './markdownParser';

/**
 * Default weights match the source rubric; TGP is already reflected in its GPU benchmarks.
 */
export const DEFAULT_WEIGHTS: RecommendationWeights = {
  gpu: 30,
  vram: 10,
  tgp: 0,
  ram: 8,
  storage: 5,
  display: 15,
  cpu: 25,
  warranty: 4,
  freebies: 3,
};

export const WEIGHT_LABELS: Record<keyof RecommendationWeights, string> = {
  gpu: 'GPU performance',
  vram: 'VRAM capacity',
  tgp: 'GPU power (TGP)',
  ram: 'System RAM',
  storage: 'SSD storage',
  display: 'Display quality',
  cpu: 'CPU performance',
  warranty: 'Warranty coverage',
  freebies: 'Freebies / bundle',
};

/**
 * Returns the source dataset's 0–100 GPU benchmark score.
 */
export function getGpuPerformanceScore(option: LaptopOption): number {
  return option.gpuScore;
}

/**
 * Returns a normalized TGP score for the optional custom-ranking slider.
 * TGP is already reflected in the source GPU benchmark score and has no default weight.
 */
export function getEffectiveTgpScore(option: LaptopOption): number {
  return option.tgpScore;
}

/**
 * Normalizes all 9 hardware dimensions onto a 0–100 scale for transparent weighted scoring.
 */
export function computeComponentBreakdown(option: LaptopOption): ComponentBreakdown {
  return {
    gpu: option.gpuScore,
    vram: option.vramScore,
    tgp: getEffectiveTgpScore(option),
    ram: option.ramScore,
    storage: option.storageScore,
    display: option.displayScore,
    cpu: option.cpuScore,
    warranty: option.warrantyScore,
    freebies: option.freebieScore,
  };
}

/**
 * Evaluates negative phrases in the option's `notes` field and returns structured point deductions.
 * Penalizes thermal-throttling risks, unverified GPU listings, weak displays/platforms, and poor value notes.
 */
export function evaluateNotePenalties(notes: string): PenaltyDetail[] {
  const lower = notes.toLowerCase();
  const penalties: PenaltyDetail[] = [];

  if (lower.includes('thermal') || lower.includes('throttl')) {
    penalties.push({ label: 'Thermal throttling concern', points: 12 });
  }
  if (lower.includes('avoid') || lower.includes('verified')) {
    penalties.push({ label: 'Avoid unless GPU listing verified', points: 15 });
  }
  if (lower.includes('weak display')) {
    penalties.push({ label: 'Weak display & lower power limit', points: 8 });
  }
  if (lower.includes('weak platform')) {
    penalties.push({ label: 'Weak budget chassis / platform', points: 7 });
  }
  if (lower.includes('worse value')) {
    penalties.push({ label: 'Worse value than cheaper identical config', points: 8 });
  }
  if (lower.includes('poor value')) {
    penalties.push({ label: 'Poor value at asking price', points: 6 });
  }
  if (lower.includes('weak gpu value')) {
    penalties.push({ label: 'Weak GPU tier for price bracket', points: 5 });
  }
  if (lower.includes('high price')) {
    penalties.push({ label: 'High price premium for 8GB VRAM', points: 3 });
  }
  if (lower.includes('5060 ti laptop gpu')) {
    penalties.push({ label: 'High price for RTX 5060 Ti laptop GPU', points: 4 });
  }

  return penalties;
}

/**
 * Generates structured Pros, Cons, a concise 1-sentence ranking explanation,
 * and a final recommendation summary for both UI display and JSON/Markdown exports.
 */
function buildInsights(
  option: LaptopOption,
  penalties: PenaltyDetail[],
  recommendationRank: number,
  totalOptions: number,
  recommendationScore: number
): {
  explanation: string;
  pros: string[];
  cons: string[];
  finalRecommendationSummary: string;
} {
  const pros: string[] = [];
  const cons: string[] = [];
  const strengthPhrases: string[] = [];
  const tradeoffPhrases: string[] = [];

  // GPU & VRAM
  if (option.formFactor === 'Desktop' && option.gpuModel === 'RTX 5060 Ti') {
    pros.push('Desktop-class RTX 5060 Ti delivers stronger gaming performance than laptop RTX 5060 models and supports future desktop GPU upgrades');
    strengthPhrases.push('desktop RTX 5060 Ti performance');
  } else if (option.gpu === 5070 && option.vram >= 12) {
    pros.push(`High-tier ${option.vram}GB RTX 5070 (${option.tgp}W) handles modern 1440p gaming and VRAM-heavy workloads`);
    strengthPhrases.push(`strong ${option.vram}GB RTX 5070`);
  } else if (option.gpu === 5070) {
    pros.push(
      `RTX 5070 GPU${option.tgp >= 140 ? ' at full 140W TGP' : ` (${option.tgp}W TGP)`} offers strong rasterization performance`
    );
    strengthPhrases.push(option.tgp >= 140 ? 'full-power 140W RTX 5070' : `RTX 5070 (${option.tgp}W)`);
    tradeoffPhrases.push('8GB VRAM');
    cons.push('Limited to 8GB VRAM, which is tighter than 12GB configs for future AAA textures');
  } else if (option.vram >= 12) {
    pros.push(`${option.vram}GB VRAM buffer on ${option.gpuDisplay}`);
    strengthPhrases.push(`${option.vram}GB VRAM`);
    tradeoffPhrases.push(`${option.gpuDisplay} laptop GPU`);
    cons.push('Uses RTX 5060-class GPU core despite higher price bracket');
  } else {
    cons.push(`${option.gpuDisplay} (${option.vram}GB VRAM) trails RTX 5070 options in raw gaming throughput`);
    tradeoffPhrases.push(`${option.gpuDisplay} (${option.vram}GB)`);
  }

  // TGP specifics
  if (option.formFactor === 'Laptop' && option.tgp <= 100 && option.gpu === 5070) {
    cons.push(`Lower ${option.tgp}W GPU power limit caps peak RTX 5070 boost clocks`);
    tradeoffPhrases.push(`${option.tgp}W TGP cap`);
  } else if (option.tgp >= 140) {
    pros.push('Highest 140W GPU TGP in the lineup for sustained gaming frame rates');
  }

  // Display
  const dispLower = option.display.toLowerCase();
  if (dispLower.includes('oled')) {
    const is240 = dispLower.includes('240hz');
    pros.push(`${option.display} panel delivers deep contrast and fast motion clarity`);
    strengthPhrases.push(is240 ? '240Hz 2.5K OLED display' : 'OLED display');
  } else if (dispLower.includes('2.5k') && dispLower.includes('ips')) {
    pros.push(`Sharp high-refresh ${option.display} screen`);
    strengthPhrases.push('high-refresh 2.5K IPS display');
  } else if (dispLower.includes('320hz')) {
    pros.push(`Includes external 25" FHD 320Hz monitor and desktop peripherals`);
    strengthPhrases.push('320Hz monitor bundle');
  } else {
    cons.push(`${option.display} lacks the sharpness and contrast of 2.5K OLED alternatives`);
    tradeoffPhrases.push(dispLower.includes('144hz') ? 'basic FHD 144Hz panel' : 'FHD-class IPS screen');
  }

  // RAM
  if (option.ram >= 32) {
    pros.push('32GB RAM ready for multitasking, creative apps, and modern games without upgrades');
    strengthPhrases.push('32GB RAM');
  } else {
    cons.push('16GB RAM may require an eventual upgrade for heavy multitasking');
    tradeoffPhrases.push('only 16GB RAM');
  }

  // Storage
  if (option.storage >= 1024) {
    pros.push(`${formatStorage(option.storage)} SSD provides ample primary game and project storage`);
    if (strengthPhrases.length < 3) {
      strengthPhrases.push(`${formatStorage(option.storage)} SSD`);
    }
  } else {
    cons.push(`${formatStorage(option.storage)} SSD fills quickly and will likely need secondary NVMe expansion`);
    tradeoffPhrases.push(`${formatStorage(option.storage)} storage`);
  }

  // CPU
  if (option.cpuScore >= 85) {
    pros.push(`Flagship-tier ${option.cpu} processor excels at CPU-intensive productivity and gaming`);
    if (strengthPhrases.length < 3) {
      strengthPhrases.push(`${option.cpu} CPU`);
    }
  } else if (option.cpuScore <= 50) {
    cons.push(`Modest ${option.cpu} processor trails HX-series CPUs in multi-core workloads`);
  }

  // Freebies & Warranty
  if (option.freebies >= 80) {
    pros.push(`Strong bundle score (${option.freebies.toFixed(1)}/100) reduces accessory spend`);
    strengthPhrases.push('full bundle');
  } else if (option.freebies <= 20) {
    cons.push(`Low bundle score (${option.freebies.toFixed(1)}/100); check accessory costs`);
  }

  if (option.warranty >= 2) {
    pros.push(`${option.warranty}-year extended warranty coverage included`);
    strengthPhrases.push(`${option.warranty}-year warranty`);
  } else if (option.warranty === 1) {
    tradeoffPhrases.push('1-year warranty');
    cons.push('1-year warranty instead of 2-year extended coverage');
  } else {
    tradeoffPhrases.push('no extended warranty listed');
    cons.push('0 years extended warranty score in store listing');
  }

  // Price & Value context
  if (option.price <= 120000) {
    pros.push(`Accessible ${formatPHP(option.price)} entry price`);
    if (strengthPhrases.length < 3) {
      strengthPhrases.push(`low ${formatPHP(option.price)} price`);
    }
  } else if (option.valueScore >= 0.6) {
    pros.push(`Strong specification value (Value Index ${option.valueScore.toFixed(2)})`);
  }

  // Notes & Penalties
  for (const pen of penalties) {
    cons.push(`Note caveat (-${pen.points} pts): ${pen.label} ("${option.notes}")`);
  }
  if (penalties.length === 0 && option.notes) {
    pros.push(`Evaluator note: ${option.notes}`);
  }

  // Construct concise 1-sentence explanation matching user prompt style
  const topStrengths = strengthPhrases.slice(0, 3);
  const topTradeoffs = tradeoffPhrases.slice(0, 2);

  const capitalize = (str: string) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : '');
  const formatList = (items: string[]) => {
    if (items.length === 0) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
  };

  let explanation = '';
  const penaltySummary =
    penalties.length > 0
      ? `penalized (-${penalties.reduce((sum, p) => sum + p.points, 0)} pts) due to ${penalties[0].label.toLowerCase()}`
      : '';

  if (topStrengths.length > 0 && penaltySummary) {
    explanation = `${capitalize(formatList(topStrengths))}, but ${
      topTradeoffs.length > 0 ? `${topTradeoffs[0]} and ` : ''
    }${penaltySummary}.`;
  } else if (topStrengths.length > 0 && topTradeoffs.length > 0) {
    explanation = `${capitalize(formatList(topStrengths))}, but ${formatList(topTradeoffs)}.`;
  } else if (topStrengths.length > 0) {
    explanation = `${capitalize(formatList(topStrengths))} with no major hardware caveats at ${formatPHP(option.price)}.`;
  } else if (penaltySummary) {
    explanation = `Budget ${option.gpuDisplay} configuration, ${penaltySummary}.`;
  } else {
    explanation = `Balanced ${option.gpuDisplay} system (${formatList(topTradeoffs) || 'standard specs'}).`;
  }

  // Final recommendation summary for export
  let verdictTier = 'Solid mid-pack contender';
  if (penalties.some((p) => p.points >= 12)) {
    verdictTier = 'Proceed with caution — verify hardware/thermal caveats before purchasing';
  } else if (recommendationRank === 1) {
    verdictTier = 'Top #1 overall recommendation under your current priority weights';
  } else if (recommendationRank <= 3) {
    verdictTier = `Top-tier contender (#${recommendationRank} of ${totalOptions}) under your current weights`;
  } else if (recommendationRank <= 8) {
    verdictTier = `Strong shortlist alternative (#${recommendationRank} of ${totalOptions})`;
  } else {
    verdictTier = `Lower-ranked option (#${recommendationRank} of ${totalOptions}) compared to stronger value configurations`;
  }

  const finalRecommendationSummary = `${option.cleanName} (${option.source}, ${formatPHP(
    option.price
  )}) ranks #${recommendationRank} of ${totalOptions} with a weighted recommendation score of ${recommendationScore.toFixed(
    1
  )}/100 (source Value Index: ${option.valueScore.toFixed(2)}). ${verdictTier}. ${explanation}`;

  return {
    explanation,
    pros,
    cons,
    finalRecommendationSummary,
  };
}

/**
 * Calculates the weighted recommendation score for every option, applies negative-note penalties,
 * sorts options from highest to lowest recommendation score (breaking ties by Value score),
 * and attaches rank + human-readable explanations.
 *
 * Formula:
 *   NormalizedWeight_i = Weight_i / Sum(Weights)
 *   RawWeightedScore = Sum(NormalizedWeight_i * ComponentScore_i)   [0 to 100]
 *   RecommendationScore = max(0, RawWeightedScore - Sum(NotePenalties))
 */
export function rankLaptopOptions(
  options: LaptopOption[],
  weights: RecommendationWeights
): RankedLaptopOption[] {
  const weightKeys = Object.keys(weights) as (keyof RecommendationWeights)[];
  const totalWeight = weightKeys.reduce((acc, key) => acc + Math.max(0, weights[key]), 0);

  // Step 1: Score each option before sorting so we know its rank
  const scored = options.map((option) => {
    const breakdown = computeComponentBreakdown(option);

    let rawWeightedScore = 0;
    if (totalWeight > 0) {
      for (const key of weightKeys) {
        const normalizedShare = Math.max(0, weights[key]) / totalWeight;
        rawWeightedScore += breakdown[key] * normalizedShare;
      }
    } else {
      // Equal weights fallback if user sets every slider to 0
      for (const key of weightKeys) {
        rawWeightedScore += breakdown[key] / weightKeys.length;
      }
    }

    const penalties = evaluateNotePenalties(option.notes);
    const penaltyPoints = penalties.reduce((sum, p) => sum + p.points, 0);
    const recommendationScore = Math.max(
      0,
      Number((rawWeightedScore - penaltyPoints).toFixed(2))
    );

    return {
      option,
      breakdown,
      rawWeightedScore: Number(rawWeightedScore.toFixed(2)),
      penalties,
      penaltyPoints,
      recommendationScore,
    };
  });

  // Step 2: Sort descending by recommendationScore, then source Value Index, then lower price
  scored.sort((a, b) => {
    if (b.recommendationScore !== a.recommendationScore) {
      return b.recommendationScore - a.recommendationScore;
    }
    if (b.option.valueScore !== a.option.valueScore) {
      return b.option.valueScore - a.option.valueScore;
    }
    return a.option.price - b.option.price;
  });

  // Step 3: Assign 1-indexed recommendationRank and generate explanations/pros/cons
  return scored.map((entry, idx) => {
    const recommendationRank = idx + 1;
    const { explanation, pros, cons, finalRecommendationSummary } = buildInsights(
      entry.option,
      entry.penalties,
      recommendationRank,
      scored.length,
      entry.recommendationScore
    );

    return {
      ...entry.option,
      recommendationScore: entry.recommendationScore,
      rawWeightedScore: entry.rawWeightedScore,
      recommendationRank,
      penaltyPoints: entry.penaltyPoints,
      penalties: entry.penalties,
      componentBreakdown: entry.breakdown,
      explanation,
      pros,
      cons,
      finalRecommendationSummary,
    };
  });
}

/**
 * Helper for CompareView: given numeric values across 2–4 selected laptops, returns a boolean array
 * indicating which cells hold the best value (`higher` or `lower`), only highlighting when values differ.
 */
export function findBestIndices(
  values: (number | null)[],
  direction: 'higher' | 'lower'
): boolean[] {
  const valid = values.filter((v): v is number => v !== null && Number.isFinite(v));
  if (valid.length < 2) {
    return values.map(() => false);
  }

  const min = Math.min(...valid);
  const max = Math.max(...valid);

  // Do not highlight if every compared item has the exact same value
  if (Math.abs(max - min) < 0.001) {
    return values.map(() => false);
  }

  const target = direction === 'higher' ? max : min;
  return values.map((v) => v !== null && Math.abs(v - target) < 0.001);
}
