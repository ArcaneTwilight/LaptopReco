import { LaptopOption } from '../types/laptop';

export function formatPHP(amount: number): string {
  return `₱${Math.round(amount).toLocaleString('en-US')}`;
}

export function formatStorage(gb: number): string {
  if (gb >= 1024 && gb % 1024 === 0) {
    return `${gb / 1024}TB`;
  }
  if (gb >= 1024) {
    return `${(gb / 1024).toFixed(1)}TB`;
  }
  return `${gb}GB`;
}

export function toCleanSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`Invalid laptop dataset: ${label} must be an object.`);
  }
  return value as Record<string, unknown>;
}

function readString(record: Record<string, unknown>, key: string, label: string): string {
  const value = record[key];
  if (typeof value !== 'string') {
    throw new Error(`Invalid laptop dataset: ${label}.${key} must be a string.`);
  }
  return value;
}

function readNumber(record: Record<string, unknown>, key: string, label: string): number {
  const value = record[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Invalid laptop dataset: ${label}.${key} must be a finite number.`);
  }
  return value;
}

function nullableNumber(value: unknown, label: string): number | null {
  if (value === null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Invalid laptop dataset: ${label} must be a number or null.`);
  }
  return value;
}

function classifyRiskFromNotes(notes: string): {
  hasRiskConcern: boolean;
  riskSeverity: 'none' | 'caution' | 'high';
} {
  const lower = notes.toLowerCase();
  if (
    lower.includes('thermal') ||
    lower.includes('throttl') ||
    lower.includes('avoid') ||
    lower.includes('verified') ||
    lower.includes('red flag')
  ) {
    return { hasRiskConcern: true, riskSeverity: 'high' };
  }
  if (
    lower.includes('weak') ||
    lower.includes('worse value') ||
    lower.includes('poor value') ||
    lower.includes('high price')
  ) {
    return { hasRiskConcern: true, riskSeverity: 'caution' };
  }
  return { hasRiskConcern: false, riskSeverity: 'none' };
}

export function parseLaptopOptionsJson(data: unknown): LaptopOption[] {
  const dataset = asRecord(data, 'root');
  if (!Array.isArray(dataset.options) || dataset.options.length === 0) {
    throw new Error('Invalid laptop dataset: options must be a non-empty array.');
  }

  return dataset.options.map((rawOption, index) => {
    const label = `options[${index}]`;
    const option = asRecord(rawOption, label);
    const gpu = asRecord(option.gpu, `${label}.gpu`);
    const memory = asRecord(option.memory, `${label}.memory`);
    const warranty = asRecord(option.warranty, `${label}.warranty`);
    const freebies = asRecord(option.freebies, `${label}.freebies`);
    const benchmarks = asRecord(option.benchmarks, `${label}.benchmarks`);
    const componentScores = asRecord(option.componentScores, `${label}.componentScores`);
    const notes = readString(option, 'notes', label);
    const risk = classifyRiskFromNotes(notes);
    const tgp = readNumber(gpu, 'tgpWatts', `${label}.gpu`);
    const source = readString(option, 'source', label);
    const cleanName = readString(option, 'name', label);
    const formFactor = readString(option, 'formFactor', label);
    if (formFactor !== 'Laptop' && formFactor !== 'Desktop') {
      throw new Error(`Invalid laptop dataset: ${label}.formFactor is unsupported.`);
    }
    if (option.recommendation !== null && typeof option.recommendation !== 'string') {
      throw new Error(`Invalid laptop dataset: ${label}.recommendation must be a string or null.`);
    }
    const freebieScore = readNumber(componentScores, 'freebies', `${label}.componentScores`);

    return {
      id: readString(option, 'id', label),
      finalRank: readNumber(option, 'rank', label),
      adjustedRank: nullableNumber(option.adjustedRank, `${label}.adjustedRank`),
      adjustedScore: nullableNumber(option.adjustedScore, `${label}.adjustedScore`),
      adjustedValueIndex: nullableNumber(option.adjustedValueIndex, `${label}.adjustedValueIndex`),
      adjustedRecommendation: option.recommendation ?? '',
      laptop: readString(option, 'option', label),
      cleanName,
      listingPrefix: readString(option, 'listingPrefix', label),
      slug: toCleanSlug(cleanName),
      source,
      sourceChannel: source.toLowerCase().includes('online') ? 'Online' : 'Store',
      formFactor,
      price: readNumber(option, 'price', label),
      gpu: readNumber(gpu, 'code', `${label}.gpu`),
      gpuModel: readString(gpu, 'model', `${label}.gpu`),
      gpuDisplay: readString(gpu, 'name', `${label}.gpu`),
      vram: readNumber(gpu, 'vramGB', `${label}.gpu`),
      tgp,
      ram: readNumber(memory, 'ramGB', `${label}.memory`),
      ramDescription: readString(memory, 'ramDescription', `${label}.memory`),
      storage: readNumber(memory, 'storageGB', `${label}.memory`),
      storageDescription: readString(memory, 'storageDescription', `${label}.memory`),
      display: readString(option, 'display', label),
      wireless: readString(option, 'wireless', label),
      cpu: readString(option, 'cpu', label),
      freebies: freebieScore,
      freebiesDescription: readString(freebies, 'description', `${label}.freebies`),
      warranty: readNumber(warranty, 'years', `${label}.warranty`),
      warrantyDescription: readString(warranty, 'description', `${label}.warranty`),
      gpuScore: readNumber(componentScores, 'gpu', `${label}.componentScores`),
      vramScore: readNumber(componentScores, 'vram', `${label}.componentScores`),
      tgpScore: tgp > 0 ? Math.min(100, (tgp / 140) * 100) : 85,
      ramScore: readNumber(componentScores, 'ram', `${label}.componentScores`),
      storageScore: readNumber(componentScores, 'storage', `${label}.componentScores`),
      cpuScore: readNumber(componentScores, 'cpu', `${label}.componentScores`),
      displayScore: readNumber(componentScores, 'display', `${label}.componentScores`),
      freebieScore,
      warrantyScore: readNumber(componentScores, 'warranty', `${label}.componentScores`),
      score: readNumber(option, 'totalScore', label),
      valueScore: readNumber(option, 'valueIndex', label),
      avgFps: readNumber(benchmarks, 'averageFps', `${label}.benchmarks`),
      onePercentLowFps: readNumber(benchmarks, 'onePercentLowFps', `${label}.benchmarks`),
      cinebenchR23Single: readNumber(benchmarks, 'cinebenchR23Single', `${label}.benchmarks`),
      cinebenchR23Multi: readNumber(benchmarks, 'cinebenchR23Multi', `${label}.benchmarks`),
      notes,
      hasRiskConcern: risk.hasRiskConcern,
      riskSeverity: risk.riskSeverity,
    };
  });
}
