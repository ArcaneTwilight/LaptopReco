import React from 'react';
import {
  AlertTriangle,
  Award,
  Check,
  Download,
  Gift,
  Plus,
  RotateCcw,
  Sliders,
} from 'lucide-react';
import { RankedLaptopOption, RecommendationWeights } from '../types/laptop';
import { formatPHP, formatStorage } from '../utils/markdownParser';
import { DEFAULT_WEIGHTS, WEIGHT_LABELS } from '../utils/recommendation';
import { SourcePill } from './SourcePill';

interface RecommendedViewProps {
  rankedOptions: RankedLaptopOption[];
  weights: RecommendationWeights;
  onWeightsChange: React.Dispatch<React.SetStateAction<RecommendationWeights>>;
  selectedCompareIds: string[];
  onToggleCompare: (id: string) => void;
  onSelectForExport: (id: string) => void;
  onOpenFreebies: (option: RankedLaptopOption) => void;
}

const PRESET_PROFILES: { label: string; weights: RecommendationWeights }[] = [
  {
    label: 'Default',
    weights: DEFAULT_WEIGHTS,
  },
  {
    label: 'Max GPU',
    weights: {
      gpu: 45,
      vram: 25,
      tgp: 0,
      ram: 5,
      storage: 5,
      display: 5,
      cpu: 15,
      warranty: 0,
      freebies: 0,
    },
  },
  {
    label: 'Creator / 32GB',
    weights: {
      gpu: 20,
      vram: 15,
      tgp: 0,
      ram: 20,
      storage: 15,
      display: 15,
      cpu: 10,
      warranty: 0,
      freebies: 0,
    },
  },
];

export const RecommendedView: React.FC<RecommendedViewProps> = ({
  rankedOptions,
  weights,
  onWeightsChange,
  selectedCompareIds,
  onToggleCompare,
  onSelectForExport,
  onOpenFreebies,
}) => {
  const weightKeys = Object.keys(WEIGHT_LABELS) as (keyof RecommendationWeights)[];
  const totalWeight =
    weightKeys.reduce((sum, key) => sum + Math.max(0, weights[key]), 0) || 1;

  const isDefaultWeights = weightKeys.every(
    (key) => weights[key] === DEFAULT_WEIGHTS[key]
  );

  const topPick = rankedOptions[0];
  const adjustedOptions = [...rankedOptions]
    .filter((option) => option.adjustedRank !== null)
    .sort((a, b) => (a.adjustedRank ?? Infinity) - (b.adjustedRank ?? Infinity));
  const unadjustedOptions = rankedOptions.filter((option) => option.adjustedRank === null);

  const handleSliderChange = (key: keyof RecommendationWeights, value: number) => {
    onWeightsChange((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="space-y-6">
      <section
        aria-label="Source adjusted recommendations"
        className="bg-white border border-slate-200 rounded-xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Source Adjusted Ranking
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              The published decision ranking, including real-world caveats. Source score and
              adjusted score are shown separately because the source uses different calculations.
            </p>
          </div>
          <span className="text-xs text-slate-500">
            {adjustedOptions.length} adjusted recommendations
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {adjustedOptions.map((option) => (
            <article key={option.id} className="px-5 py-4 space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-semibold shrink-0">
                    #{option.adjustedRank}
                  </span>
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">
                        {option.cleanName}
                      </h3>
                      <SourcePill
                        sourceChannel={option.sourceChannel}
                        formFactor={option.formFactor}
                        listingPrefix={option.listingPrefix}
                      />
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {option.adjustedRecommendation}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap lg:flex-col lg:items-end gap-x-4 gap-y-1 text-xs font-mono tabular-nums shrink-0">
                  <strong className="text-slate-950">{formatPHP(option.price)}</strong>
                  <span className="text-slate-600">
                    Source {option.score.toFixed(2)} / 100 · Value {option.valueScore.toFixed(2)}
                  </span>
                  {option.adjustedScore !== null && option.adjustedValueIndex !== null && (
                    <span className="text-slate-600">
                      Adjusted {option.adjustedScore.toFixed(2)} / 100 · Value{' '}
                      {option.adjustedValueIndex.toFixed(3)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pl-11">
                {([
                  ['GPU', option.gpuScore],
                  ['CPU', option.cpuScore],
                  ['VRAM', option.vramScore],
                  ['Display', option.displayScore],
                  ['RAM', option.ramScore],
                  ['SSD', option.storageScore],
                  ['Warranty', option.warrantyScore],
                  ['Bundle', option.freebieScore],
                ] as const).map(([label, value]) => (
                  <span
                    key={label}
                    className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-700 font-mono tabular-nums"
                  >
                    {label} {value.toFixed(1)}
                  </span>
                ))}
                <span className="rounded-md bg-sky-50 px-2 py-1 text-[11px] text-sky-900 font-mono tabular-nums">
                  {option.avgFps} avg / {option.onePercentLowFps} 1% low FPS
                </span>
                <span className="rounded-md bg-sky-50 px-2 py-1 text-[11px] text-sky-900 font-mono tabular-nums">
                  Cinebench R23 {option.cinebenchR23Single} / {option.cinebenchR23Multi}
                </span>
              </div>

              <details className="pl-11 text-xs text-slate-600">
                <summary className="cursor-pointer font-medium text-slate-700">
                  Full specifications
                </summary>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 pt-3">
                  <div><dt className="font-medium">CPU</dt><dd>{option.cpu}</dd></div>
                  <div><dt className="font-medium">GPU</dt><dd>{option.gpuDisplay}</dd></div>
                  <div><dt className="font-medium">RAM</dt><dd>{option.ramDescription}</dd></div>
                  <div><dt className="font-medium">Storage</dt><dd>{option.storageDescription}</dd></div>
                  <div><dt className="font-medium">Display</dt><dd>{option.display}</dd></div>
                  <div><dt className="font-medium">Wireless</dt><dd>{option.wireless}</dd></div>
                  <div><dt className="font-medium">Warranty</dt><dd>{option.warrantyDescription}</dd></div>
                  <div><dt className="font-medium">Bundle</dt><dd>{option.freebiesDescription}</dd></div>
                </dl>
              </details>
            </article>
          ))}
        </div>
        {unadjustedOptions.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-500">
            {unadjustedOptions.length} additional configurations are listed in the source score
            table but do not have an adjusted-rank entry.
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Configurable Priority Weights Panel */}
      <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-5 lg:sticky lg:top-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-slate-900">
              <Sliders className="w-4 h-4 text-slate-700 shrink-0" aria-hidden="true" />
              <h2 className="text-base font-semibold">Scoring Weights</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Adjust priorities to recalculate a custom ranking using the source component scores. Negative notes apply additional score deductions.
            </p>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Default weights match the published rubric: GPU 30%, CPU 25%, VRAM 10%,
              display 15%, RAM 8%, SSD 5%, warranty 4%, and bundle 3%. TGP is already
              reflected in GPU benchmark scores. Value Index = total score ÷ price × 1,000.
            </p>
          </div>
        </div>

        {/* Quick Weight Presets */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {PRESET_PROFILES.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onWeightsChange({ ...preset.weights })}
              className="px-2.5 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-950 rounded-md whitespace-nowrap shrink-0 transition-colors"
            >
              {preset.label}
            </button>
          ))}
          {!isDefaultWeights && (
            <button
              type="button"
              onClick={() => onWeightsChange({ ...DEFAULT_WEIGHTS })}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-950 whitespace-nowrap shrink-0 transition-colors ml-auto"
            >
              <RotateCcw className="w-3 h-3" aria-hidden="true" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* 9 Weight Sliders */}
        <div className="space-y-3.5 pt-3 border-t border-slate-100">
          {weightKeys.map((key) => {
            const rawVal = weights[key];
            const normalizedPct = Math.round((Math.max(0, rawVal) / totalWeight) * 100);
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label
                    htmlFor={`weight-${key}`}
                    className="font-medium text-slate-700"
                  >
                    {WEIGHT_LABELS[key]}
                  </label>
                  <span className="font-mono tabular-nums text-slate-600">
                    {normalizedPct}%
                  </span>
                </div>
                <input
                  id={`weight-${key}`}
                  type="range"
                  min={0}
                  max={60}
                  step={5}
                  value={rawVal}
                  onChange={(e) => handleSliderChange(key, Number(e.target.value))}
                  className="w-full accent-slate-900 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
              </div>
            );
          })}
        </div>

        {/* Penalty Legend */}
        <div className="pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
          <div className="font-medium text-slate-700">Active Risk Penalties</div>
          <p className="leading-relaxed">
            Unverified GPU listing (<span className="font-mono tabular-nums">-15</span>) · Thermal throttling risk (<span className="font-mono tabular-nums">-12</span>) · Weak display or duplicate worse value (<span className="font-mono tabular-nums">-8</span>) · Weak platform / poor price-value (<span className="font-mono tabular-nums">-3 to -7</span>).
          </p>
        </div>
      </aside>

      {/* Right Column: Prominent #1 Recommendation + Full Ranked List */}
      <div className="lg:col-span-8 space-y-6">
        {/* Top Recommendation Spotlight */}
        {topPick && (
          <section
            aria-label="Top recommendation"
            className="bg-white border border-slate-900/20 rounded-xl p-6 space-y-5 shadow-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-800">
                  <Award className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                  <span>#1 Custom-Weighted Pick</span>
                  <SourcePill
                    sourceChannel={topPick.sourceChannel}
                    formFactor={topPick.formFactor}
                    listingPrefix={topPick.listingPrefix}
                  />
                </div>
                <h2 className="text-2xl font-bold text-slate-950 tracking-tight">
                  {topPick.cleanName}
                </h2>
                <p className="text-sm text-slate-700 leading-relaxed max-w-2xl">
                  {topPick.explanation}
                </p>
              </div>

              <div className="sm:text-right shrink-0">
                <div className="text-2xl font-bold font-mono tabular-nums text-slate-950">
                  {formatPHP(topPick.price)}
                </div>
                <div className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
                  Custom: <strong className="text-slate-900">{topPick.recommendationScore.toFixed(1)}</strong>/100 · Source Value Index: {topPick.valueScore.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Key Specifications Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-slate-100 text-xs">
              <div>
                <div className="text-slate-500">GPU &amp; VRAM</div>
                <div className="font-semibold text-slate-900 mt-0.5 font-mono tabular-nums">
                  {topPick.gpuDisplay} · {topPick.vram}GB
                </div>
              </div>
              <div>
                <div className="text-slate-500">Power / TGP</div>
                <div className="font-semibold text-slate-900 mt-0.5 font-mono tabular-nums">
                  {topPick.formFactor === 'Desktop' && topPick.tgp === 0
                    ? 'Desktop PCIe'
                    : `${topPick.tgp}W`}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Memory &amp; Storage</div>
                <div className="font-semibold text-slate-900 mt-0.5 font-mono tabular-nums">
                  {topPick.ram}GB · {formatStorage(topPick.storage)}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Display</div>
                <div className="font-semibold text-slate-900 mt-0.5">
                  {topPick.display}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Processor</div>
                <div className="font-semibold text-slate-900 mt-0.5">
                  {topPick.cpu}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Warranty</div>
                <div className="font-semibold text-slate-900 mt-0.5 font-mono tabular-nums">
                  {topPick.warranty} {topPick.warranty === 1 ? 'year' : 'years'}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Freebies / Bundle</div>
                <div className="mt-1">
                  <button
                    type="button"
                    onClick={() => onOpenFreebies(topPick)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900 font-semibold font-mono tabular-nums transition-colors whitespace-nowrap shrink-0"
                  >
                    <Gift className="w-3.5 h-3.5 text-slate-600 shrink-0" aria-hidden="true" />
                    <span>{topPick.freebies.toFixed(1)} / 100</span>
                  </button>
                </div>
              </div>
              <div>
                <div className="text-slate-500">Evaluator Note</div>
                <div className="font-medium text-slate-800 mt-0.5">
                  {topPick.notes}
                </div>
              </div>
            </div>

            {/* Spotlight Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500 font-mono tabular-nums">
                Source Total: {topPick.score.toFixed(2)} / 100 · Value Rank: #{topPick.finalRank}
                {topPick.adjustedRank !== null && ` · Adjusted Rank: #${topPick.adjustedRank}`}
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={
                    !selectedCompareIds.includes(topPick.id) &&
                    selectedCompareIds.length >= 4
                  }
                  onClick={() => onToggleCompare(topPick.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200/80 rounded-lg whitespace-nowrap shrink-0 transition-colors disabled:opacity-40"
                >
                  {selectedCompareIds.includes(topPick.id) ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                      <span>Selected for Compare</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Add to Compare</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onSelectForExport(topPick.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-lg whitespace-nowrap shrink-0 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Export #1 Pick</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Full Ranked List (#1 to #20) */}
        <section
          aria-label="Full weighted ranking list"
          className="bg-white border border-slate-200 rounded-xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
            <h3 className="text-sm font-semibold text-slate-900">
              All {rankedOptions.length} Options Ranked by Weighted Score
            </h3>
            <span className="text-xs text-slate-500">
              Updated live from sliders
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {rankedOptions.map((opt) => {
              const isSelected = selectedCompareIds.includes(opt.id);
              const disableCompare = !isSelected && selectedCompareIds.length >= 4;

              return (
                <div
                  key={opt.id}
                  className="p-5 hover:bg-slate-50/70 transition-colors duration-100 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Rank + Name + Source Pill */}
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono tabular-nums text-xs font-semibold shrink-0 ${
                          opt.recommendationRank === 1
                            ? 'bg-slate-900 text-white'
                            : opt.recommendationRank <= 3
                              ? 'bg-slate-200/80 text-slate-900'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        #{opt.recommendationRank}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-semibold text-slate-900">
                            {opt.cleanName}
                          </h4>
                          <SourcePill
                            sourceChannel={opt.sourceChannel}
                            formFactor={opt.formFactor}
                            listingPrefix={opt.listingPrefix}
                          />
                          <span className="text-xs text-slate-500">
                            {opt.gpuDisplay} ({opt.vram}GB) · {opt.ram}GB / {formatStorage(opt.storage)}
                          </span>
                        </div>

                        {/* Explanation Sentence */}
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {opt.explanation}
                        </p>

                        {/* Penalty Callout if Applicable */}
                        {opt.penalties.length > 0 && (
                          <div className="flex items-center gap-1.5 text-xs text-red-700 pt-0.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" aria-hidden="true" />
                            <span>
                              Penalty applied (<span className="font-mono tabular-nums">-{opt.penaltyPoints} pts</span>):{' '}
                              {opt.penalties.map((p) => p.label).join('; ')} — Note: &ldquo;{opt.notes}&rdquo;
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Price + Weighted Score + Actions */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pl-11 sm:pl-0">
                      <div className="sm:text-right">
                        <div className="text-sm font-bold font-mono tabular-nums text-slate-900">
                          {formatPHP(opt.price)}
                        </div>
                        <div className="text-xs font-mono tabular-nums text-slate-600 mt-0.5">
                          Custom <strong className="text-slate-950">{opt.recommendationScore.toFixed(1)}</strong>/100 · Value Index {opt.valueScore.toFixed(2)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenFreebies(opt)}
                          title={`Inspect bundle score (${opt.freebies.toFixed(1)}/100) for ${opt.cleanName}`}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono tabular-nums text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200/80 rounded-md whitespace-nowrap shrink-0 transition-colors"
                        >
                          <Gift className="w-3 h-3 text-slate-600 shrink-0" aria-hidden="true" />
                          <span>{opt.freebies.toFixed(0)}/100</span>
                        </button>
                        <button
                          type="button"
                          disabled={disableCompare}
                          onClick={() => onToggleCompare(opt.id)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-sky-100 text-sky-900'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 disabled:opacity-40'
                          }`}
                        >
                          {isSelected ? 'Comparing' : 'Compare'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectForExport(opt.id)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200/80 rounded-md whitespace-nowrap shrink-0 transition-colors"
                        >
                          Export
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Subtle Score Bar */}
                  <div className="pl-11">
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-150 ${
                          opt.penaltyPoints >= 10
                            ? 'bg-amber-600'
                            : opt.recommendationRank <= 3
                              ? 'bg-slate-900'
                              : 'bg-slate-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(4, opt.recommendationScore))}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
    </div>
  );
};
