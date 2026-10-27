import React, { useState } from 'react';
import { AlertTriangle, Check, Download, Gift, Plus, Trash2 } from 'lucide-react';
import { RankedLaptopOption } from '../types/laptop';
import { formatPHP, formatStorage } from '../utils/markdownParser';
import {
  findBestIndices,
  getDisplayQualityScore,
  getEffectiveTgpScore,
  getGpuPerformanceScore,
} from '../utils/recommendation';
import { SourcePill } from './SourcePill';
import { StickyHorizontalScroll } from './StickyHorizontalScroll';

interface CompareViewProps {
  allOptions: RankedLaptopOption[];
  selectedCompareIds: string[];
  onToggleCompare: (id: string) => void;
  onSetCompareIds: (ids: string[]) => void;
  onSelectForExport: (id: string) => void;
  onNavigateToAll: () => void;
  onOpenFreebies: (option: RankedLaptopOption) => void;
}

export const CompareView: React.FC<CompareViewProps> = ({
  allOptions,
  selectedCompareIds,
  onToggleCompare,
  onSetCompareIds,
  onSelectForExport,
  onNavigateToAll,
  onOpenFreebies,
}) => {
  const [quickAddId, setQuickAddId] = useState<string>('');

  const selectedLaptops = selectedCompareIds
    .map((id) => allOptions.find((o) => o.id === id))
    .filter((o): o is RankedLaptopOption => Boolean(o));

  const unselectedOptions = allOptions.filter(
    (o) => !selectedCompareIds.includes(o.id)
  );

  const handleLoadTopContenders = () => {
    const topThree = allOptions.slice(0, 3).map((o) => o.id);
    onSetCompareIds(topThree);
  };

  const handleQuickAdd = () => {
    if (!quickAddId || selectedCompareIds.length >= 4) return;
    onToggleCompare(quickAddId);
    setQuickAddId('');
  };

  // Pre-compute row-by-row best value highlights when 2 to 4 laptops are selected
  const bestPrice = findBestIndices(
    selectedLaptops.map((o) => o.price),
    'lower'
  );
  const bestGpu = findBestIndices(
    selectedLaptops.map((o) => getGpuPerformanceScore(o)),
    'higher'
  );
  const bestVram = findBestIndices(
    selectedLaptops.map((o) => o.vram),
    'higher'
  );
  const bestTgp = findBestIndices(
    selectedLaptops.map((o) => getEffectiveTgpScore(o)),
    'higher'
  );
  const bestRam = findBestIndices(
    selectedLaptops.map((o) => o.ram),
    'higher'
  );
  const bestStorage = findBestIndices(
    selectedLaptops.map((o) => o.storage),
    'higher'
  );
  const bestDisplay = findBestIndices(
    selectedLaptops.map((o) => getDisplayQualityScore(o.display)),
    'higher'
  );
  const bestCpu = findBestIndices(
    selectedLaptops.map((o) => o.cpuScore),
    'higher'
  );
  const bestFreebies = findBestIndices(
    selectedLaptops.map((o) => o.freebies),
    'higher'
  );
  const bestWarranty = findBestIndices(
    selectedLaptops.map((o) => o.warranty),
    'higher'
  );
  const bestScore = findBestIndices(
    selectedLaptops.map((o) => o.score),
    'higher'
  );
  const bestValueScore = findBestIndices(
    selectedLaptops.map((o) => o.valueScore),
    'higher'
  );
  const bestRecScore = findBestIndices(
    selectedLaptops.map((o) => o.recommendationScore),
    'higher'
  );

  const lowestSelectedPrice =
    selectedLaptops.length > 0 ? Math.min(...selectedLaptops.map((o) => o.price)) : 0;

  const cellHighlightClass = (isBest: boolean) =>
    isBest
      ? 'bg-emerald-50/75 text-emerald-950 font-semibold'
      : 'text-slate-800';

  const BestMarker: React.FC<{ show: boolean; label?: string }> = ({
    show,
    label = 'Best',
  }) => {
    if (!show) return null;
    return (
      <span className="inline-flex items-center gap-1 ml-2 text-[11px] font-medium text-emerald-700 whitespace-nowrap">
        <Check className="w-3 h-3 shrink-0" aria-hidden="true" />
        <span>{label}</span>
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header Controls & Quick Slot Picker */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Side-by-Side Comparison ({selectedLaptops.length} of 4 slots)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Winning values in each specification row are highlighted with a checkmark and label where differences exist.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {selectedLaptops.length < 4 && unselectedOptions.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={quickAddId}
                onChange={(e) => setQuickAddId(e.target.value)}
                aria-label="Add an option to compare"
                className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 max-w-[260px] focus:bg-white focus:outline-none focus:border-slate-400"
              >
                <option value="">Add option to compare...</option>
                {unselectedOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.cleanName} ({formatPHP(opt.price)})
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!quickAddId}
                onClick={handleQuickAdd}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 whitespace-nowrap shrink-0 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Add</span>
              </button>
            </div>
          )}

          {selectedLaptops.length > 0 && (
            <button
              type="button"
              onClick={() => onSetCompareIds([])}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-950 bg-slate-100 hover:bg-slate-200/70 rounded-lg whitespace-nowrap shrink-0 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </section>

      {/* Empty or Single-Item State (Requires 2 to 4 Options) */}
      {selectedLaptops.length < 2 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-16 px-6 text-center space-y-4">
          <div className="space-y-1.5 max-w-lg mx-auto">
            <h3 className="text-base font-semibold text-slate-900">
              {selectedLaptops.length === 0
                ? 'Select 2 to 4 options to compare side by side'
                : `1 option selected (${selectedLaptops[0].cleanName}) — add at least 1 more`}
            </h3>
            <p className="text-sm text-slate-500">
              Use the checkboxes in the All Options table, pick models from the dropdown above, or load the top 3 recommended contenders immediately.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleLoadTopContenders}
              className="px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 whitespace-nowrap shrink-0 transition-colors"
            >
              Compare top 3 recommended picks
            </button>
            <button
              type="button"
              onClick={onNavigateToAll}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg whitespace-nowrap shrink-0 transition-colors"
            >
              Browse All Options table
            </button>
          </div>
        </div>
      ) : (
        /* Side-by-Side Comparison Matrix with Always-Visible Sticky Horizontal Scroll */
        <StickyHorizontalScroll>
          <table className="w-full text-left border-collapse table-fixed min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th
                  scope="col"
                  className="w-48 py-4 px-4 text-xs font-semibold text-slate-600 align-top"
                >
                  Specification
                </th>
                {selectedLaptops.map((opt) => (
                  <th
                    key={opt.id}
                    scope="col"
                    className="py-4 px-4 align-top border-l border-slate-200"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1.5">
                        <div className="text-sm font-semibold text-slate-900 leading-snug">
                          {opt.cleanName}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 font-normal">
                          <SourcePill
                            sourceChannel={opt.sourceChannel}
                            formFactor={opt.formFactor}
                            listingPrefix={opt.listingPrefix}
                          />
                          <span className="text-xs text-slate-500 font-mono tabular-nums">
                            Rank #{opt.finalRank}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleCompare(opt.id)}
                        title={`Remove ${opt.cleanName} from comparison`}
                        aria-label={`Remove ${opt.cleanName}`}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-100 transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {/* Price (Lower is better) */}
              <tr>
                <td className="py-3 px-4 font-medium text-slate-600">
                  Price (PHP)
                </td>
                {selectedLaptops.map((opt, idx) => {
                  const diff = opt.price - lowestSelectedPrice;
                  return (
                    <td
                      key={opt.id}
                      className={`py-3 px-4 border-l border-slate-100 font-mono tabular-nums ${cellHighlightClass(
                        bestPrice[idx]
                      )}`}
                    >
                      <div>
                        <span className="text-sm">{formatPHP(opt.price)}</span>
                        <BestMarker show={bestPrice[idx]} label="Lowest" />
                      </div>
                      {diff > 0 && (
                        <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                          +{formatPHP(diff)} vs lowest
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* GPU Tier */}
              <tr>
                <td className="py-3 px-4 font-medium text-slate-600">
                  GPU Model &amp; Tier
                </td>
                {selectedLaptops.map((opt, idx) => (
                  <td
                    key={opt.id}
                    className={`py-3 px-4 border-l border-slate-100 ${cellHighlightClass(
                      bestGpu[idx]
                    )}`}
                  >
                    <span>{opt.gpuDisplay}</span>
                    <span className="text-slate-500 font-normal font-mono tabular-nums ml-1.5">
                      ({opt.gpuScore} pts)
                    </span>
                    <BestMarker show={bestGpu[idx]} />
                  </td>
                ))}
              </tr>

              {/* VRAM */}
              <tr>
                <td className="py-3 px-4 font-medium text-slate-600">VRAM</td>
                {selectedLaptops.map((opt, idx) => (
                  <td
                    key={opt.id}
                    className={`py-3 px-4 border-l border-slate-100 font-mono tabular-nums ${cellHighlightClass(
                      bestVram[idx]
                    )}`}
                  >
                    <span>{opt.vram}GB</span>
                    <BestMarker show={bestVram[idx]} />
                  </td>
                ))}
              </tr>

              {/* GPU Power / TGP */}
              <tr>
                <td className="py-3 px-4 font-medium text-slate-600">
                  GPU Power / TGP
                </td>
                {selectedLaptops.map((opt, idx) => (
                  <td
                    key={opt.id}
                    className={`py-3 px-4 border-l border-slate-100 font-mono tabular-nums ${cellHighlightClass(
                      bestTgp[idx]
                    )}`}
                  >
                    <span>
                      {opt.formFactor === 'Desktop' && opt.tgp === 0
                        ? 'Desktop PCIe (Full Power)'
                        : `${opt.tgp}W`}
                    </span>
                    <BestMarker show={bestTgp[idx]} />
                  </td>
                ))}
              </tr>

              {/* RAM */}
              <tr>
                <td className="py-3 px-4 font-medium text-slate-600">RAM</td>
                {selectedLaptops.map((opt, idx) => (
                  <td
                    key={opt.id}
                    className={`py-3 px-4 border-l border-slate-100 font-mono tabular-nums ${cellHighlightClass(
                      bestRam[idx]
                    )}`}
                  >
                    <span>{opt.ram}GB</span>
                    <BestMarker show={bestRam[idx]} />
                  </td>
                ))}
              </tr>

              {/* Storage */}
              <tr>
                <td className="py-3 px-4 font-medium text-slate-600">
                  Storage
                </td>
                {selectedLaptops.map((opt, idx) => (
                  <td
                    key={opt.id}
                    className={`py-3 px-4 border-l border-slate-100 font-mono tabular-nums ${cellHighlightClass(
                      bestStorage[idx]
                    )}`}
                  >
                    <span>{formatStorage(opt.storage)}</span>
                    <span className="text-slate-400 font-normal ml-1">
                      ({opt.storage}GB)
                    </span>
                    <BestMarker show={bestStorage[idx]} />
                  </td>
                ))}
              </tr>

              {/* Display */}
              <tr>
                <td className="py-3 px-4 font-medium text-slate-600">
                  Display
                </td>
                {selectedLaptops.map((opt, idx) => (
                  <td
                    key={opt.id}
                    className={`py-3 px-4 border-l border-slate-100 ${cellHighlightClass(
                      bestDisplay[idx]
                    )}`}
                  >
                    <span>{opt.display}</span>
                    <BestMarker show={bestDisplay[idx]} />
                  </td>
                ))}
              </tr>

              {/* CPU */}
              <tr>
                <td className="py-3 px-4 font-medium text-slate-600">CPU</td>
                {selectedLaptops.map((opt, idx) => (
                  <td
                    key={opt.id}
                    className={`py-3 px-4 border-l border-slate-100 ${cellHighlightClass(
                      bestCpu[idx]
                    )}`}
                  >
                    <span>{opt.cpu}</span>
                    <span className="text-slate-500 font-normal font-mono tabular-nums ml-1.5">
                      ({opt.cpuScore}/5)
                    </span>
                    <BestMarker show={bestCpu[idx]} />
                  </td>
                ))}
              </tr>

              {/* Freebies / Bundle with Popup Button */}
              <tr>
                <td className="py-3 px-4 font-medium text-slate-600">
                  Freebies / Bundle
                </td>
                {selectedLaptops.map((opt, idx) => (
                  <td
                    key={opt.id}
                    className={`py-3 px-4 border-l border-slate-100 ${cellHighlightClass(
                      bestFreebies[idx]
                    )}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenFreebies(opt)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 font-mono tabular-nums font-medium transition-colors whitespace-nowrap shrink-0"
                      >
                        <Gift className="w-3.5 h-3.5 text-slate-600 shrink-0" aria-hidden="true" />
                        <span>{opt.freebies} / 10</span>
                      </button>
                      <BestMarker show={bestFreebies[idx]} />
                    </div>
                  </td>
                ))}
              </tr>

              {/* Warranty */}
              <tr>
                <td className="py-3 px-4 font-medium text-slate-600">
                  Warranty
                </td>
                {selectedLaptops.map((opt, idx) => (
                  <td
                    key={opt.id}
                    className={`py-3 px-4 border-l border-slate-100 font-mono tabular-nums ${cellHighlightClass(
                      bestWarranty[idx]
                    )}`}
                  >
                    <span>
                      {opt.warranty} {opt.warranty === 1 ? 'year' : 'years'}
                    </span>
                    <BestMarker show={bestWarranty[idx]} />
                  </td>
                ))}
              </tr>

              {/* Original Spec Score */}
              <tr>
                <td className="py-3 px-4 font-medium text-slate-600">
                  Spec Score
                </td>
                {selectedLaptops.map((opt, idx) => (
                  <td
                    key={opt.id}
                    className={`py-3 px-4 border-l border-slate-100 font-mono tabular-nums ${cellHighlightClass(
                      bestScore[idx]
                    )}`}
                  >
                    <span>{opt.score.toFixed(2)}</span>
                    <BestMarker show={bestScore[idx]} />
                  </td>
                ))}
              </tr>

              {/* Original Value Score */}
              <tr>
                <td className="py-3 px-4 font-medium text-slate-600">
                  Value Score (per ₱100k)
                </td>
                {selectedLaptops.map((opt, idx) => (
                  <td
                    key={opt.id}
                    className={`py-3 px-4 border-l border-slate-100 font-mono tabular-nums ${cellHighlightClass(
                      bestValueScore[idx]
                    )}`}
                  >
                    <span>{opt.valueScore.toFixed(2)}</span>
                    <BestMarker show={bestValueScore[idx]} />
                  </td>
                ))}
              </tr>

              {/* Weighted Recommendation Score */}
              <tr>
                <td className="py-3 px-4 font-medium text-slate-600">
                  Weighted Rec. Score
                </td>
                {selectedLaptops.map((opt, idx) => (
                  <td
                    key={opt.id}
                    className={`py-3 px-4 border-l border-slate-100 font-mono tabular-nums ${cellHighlightClass(
                      bestRecScore[idx]
                    )}`}
                  >
                    <span>{opt.recommendationScore.toFixed(1)} / 100</span>
                    <span className="text-slate-500 font-normal ml-1.5">
                      (#{opt.recommendationRank})
                    </span>
                    <BestMarker show={bestRecScore[idx]} />
                  </td>
                ))}
              </tr>

              {/* Notes & Reliability / Thermal / Value Concerns */}
              <tr className="bg-slate-50/40">
                <td className="py-4 px-4 font-semibold text-slate-700 align-top">
                  Notes &amp; Concerns
                </td>
                {selectedLaptops.map((opt) => (
                  <td
                    key={opt.id}
                    className={`py-4 px-4 border-l border-slate-100 align-top space-y-2 ${
                      opt.riskSeverity === 'high'
                        ? 'bg-red-50/60'
                        : opt.riskSeverity === 'caution'
                          ? 'bg-amber-50/50'
                          : ''
                    }`}
                  >
                    <div
                      className={`flex items-start gap-1.5 leading-relaxed ${
                        opt.riskSeverity === 'high'
                          ? 'text-red-800 font-semibold'
                          : opt.riskSeverity === 'caution'
                            ? 'text-amber-900 font-medium'
                            : 'text-slate-800 font-medium'
                      }`}
                    >
                      {opt.hasRiskConcern && (
                        <AlertTriangle
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            opt.riskSeverity === 'high'
                              ? 'text-red-600'
                              : 'text-amber-600'
                          }`}
                          aria-hidden="true"
                        />
                      )}
                      <span>{opt.notes}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {opt.explanation}
                    </p>
                  </td>
                ))}
              </tr>

              {/* Export Row */}
              <tr>
                <td className="py-3.5 px-4 font-medium text-slate-600">
                  Export Report
                </td>
                {selectedLaptops.map((opt) => (
                  <td
                    key={opt.id}
                    className="py-3.5 px-4 border-l border-slate-100"
                  >
                    <button
                      type="button"
                      onClick={() => onSelectForExport(opt.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-900 text-slate-800 hover:text-white rounded-lg whitespace-nowrap shrink-0 transition-colors duration-150"
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Export JSON / MD</span>
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </StickyHorizontalScroll>
      )}
    </div>
  );
};
