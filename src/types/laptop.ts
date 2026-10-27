export type SourceChannel = 'Store' | 'Online';
export type FormFactor = 'Laptop' | 'Desktop';

/**
 * Represents a single laptop or desktop purchase option parsed from `all_laptop_options.md`.
 * Preserves all 24 fields from the main "All options" table plus normalized helper properties.
 */
export interface LaptopOption {
  id: string;
  finalRank: number;
  laptop: string; // Full raw label from markdown (e.g., "Online 4/5 — Lenovo Legion 5i 83VKCTO1WW")
  cleanName: string; // Stripped model title (e.g., "Lenovo Legion 5i 83VKCTO1WW")
  listingPrefix: string; // Channel/batch tag (e.g., "Online 4/5", "Store", "Online Desktop")
  slug: string; // Clean filename slug (e.g., "lenovo-legion-5i-83vkcto1ww")
  source: string; // Raw source field (e.g., "Store laptop", "Online laptop", "Online desktop")
  sourceChannel: SourceChannel;
  formFactor: FormFactor;
  price: number; // Price in PHP
  gpu: number; // Raw numeric GPU code (e.g., 5070, 5060, 5050)
  gpuModel: string; // Normalized GPU family (e.g., "RTX 5070", "RTX 5060", "RTX 5060 Ti")
  gpuDisplay: string; // Display label (e.g., "RTX 5060 Ti (Desktop)", "RTX 5070")
  vram: number; // VRAM in GB
  tgp: number; // GPU power / TGP in Watts (0 for desktop PCIe GPUs)
  ram: number; // System memory in GB
  storage: number; // SSD storage in GB (e.g., 512, 1024)
  display: string; // Full display specification string
  cpu: string; // Processor model string
  freebies: number; // Raw freebies/bundle rating (0–10)
  warranty: number; // Included warranty duration in years
  gpuScore: number;
  vramScore: number;
  tgpScore: number;
  ramScore: number;
  storageScore: number;
  cpuScore: number;
  freebieScore: number;
  warrantyScore: number;
  score: number; // Original specification Score from markdown
  valueScore: number; // Original Value score (Score per ₱100,000) from markdown
  notes: string; // Original evaluation notes
  hasRiskConcern: boolean; // True when notes indicate thermal, verification, platform, or value risks
  riskSeverity: 'none' | 'caution' | 'high';
}

/**
 * Configurable percentage weights for the "Recommended to Buy" ranking engine.
 */
export interface RecommendationWeights {
  gpu: number;
  vram: number;
  tgp: number;
  ram: number;
  storage: number;
  display: number;
  cpu: number;
  warranty: number;
  freebies: number;
}

export interface PenaltyDetail {
  label: string;
  points: number;
}

/**
 * Normalized 0–100 sub-scores across each weighted hardware dimension.
 */
export interface ComponentBreakdown {
  gpu: number;
  vram: number;
  tgp: number;
  ram: number;
  storage: number;
  display: number;
  cpu: number;
  warranty: number;
  freebies: number;
}

/**
 * Enriched option returned by the recommendation engine with live score, rank,
 * natural-language explanation, pros/cons, and export summary.
 */
export interface RankedLaptopOption extends LaptopOption {
  recommendationScore: number; // Final 0–100 score after applying penalties
  rawWeightedScore: number; // Pre-penalty 0–100 weighted hardware score
  recommendationRank: number; // 1-indexed rank among all options under current weights
  penaltyPoints: number; // Total points deducted due to negative notes
  penalties: PenaltyDetail[];
  componentBreakdown: ComponentBreakdown;
  explanation: string; // Concise 1-sentence reason for ranking position
  pros: string[];
  cons: string[];
  finalRecommendationSummary: string;
}

export type SortField =
  | 'finalRank'
  | 'price'
  | 'score'
  | 'valueScore'
  | 'vram'
  | 'ram'
  | 'storage'
  | 'tgp'
  | 'freebies'
  | 'warranty'
  | 'recommendationScore';

export type SortDirection = 'asc' | 'desc';

export interface FilterState {
  search: string;
  source: 'All' | SourceChannel;
  gpuModel: string;
  vram: string;
  ram: string;
  storage: string;
  maxPrice: number;
}
