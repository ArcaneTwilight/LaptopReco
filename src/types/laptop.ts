export type SourceChannel = 'Store' | 'Online';
export type FormFactor = 'Laptop' | 'Desktop';

export interface LaptopOption {
  id: string;
  finalRank: number;
  adjustedRank: number | null;
  adjustedScore: number | null;
  adjustedValueIndex: number | null;
  adjustedRecommendation: string;
  laptop: string;
  cleanName: string;
  listingPrefix: string;
  slug: string;
  source: string;
  sourceChannel: SourceChannel;
  formFactor: FormFactor;
  price: number;
  gpu: number;
  gpuModel: string;
  gpuDisplay: string;
  vram: number;
  tgp: number;
  ram: number;
  ramDescription: string;
  storage: number;
  storageDescription: string;
  display: string;
  wireless: string;
  cpu: string;
  freebies: number;
  freebiesDescription: string;
  warranty: number;
  warrantyDescription: string;
  gpuScore: number;
  vramScore: number;
  tgpScore: number;
  ramScore: number;
  storageScore: number;
  cpuScore: number;
  displayScore: number;
  freebieScore: number;
  warrantyScore: number;
  score: number;
  valueScore: number;
  avgFps: number;
  onePercentLowFps: number;
  cinebenchR23Single: number;
  cinebenchR23Multi: number;
  notes: string;
  hasRiskConcern: boolean;
  riskSeverity: 'none' | 'caution' | 'high';
}

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

export interface RankedLaptopOption extends LaptopOption {
  recommendationScore: number;
  rawWeightedScore: number;
  recommendationRank: number;
  penaltyPoints: number;
  penalties: PenaltyDetail[];
  componentBreakdown: ComponentBreakdown;
  explanation: string;
  pros: string[];
  cons: string[];
  finalRecommendationSummary: string;
}

export type SortField =
  | 'finalRank'
  | 'adjustedRank'
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
