import React, { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  Gift,
  RotateCcw,
  Search,
} from 'lucide-react';
import {
  FilterState,
  RankedLaptopOption,
  SortDirection,
  SortField,
  SourceChannel,
} from '../types/laptop';
import { formatPHP, formatStorage } from '../utils/markdownParser';
import { SourcePill } from './SourcePill';
import { StickyHorizontalScroll } from './StickyHorizontalScroll';

interface OptionsTableViewProps {
  options: RankedLaptopOption[];
  filters: FilterState;
  onFiltersChange: React.Dispatch<React.SetStateAction<FilterState>>;
  onResetFilters: () => void;
  priceBounds: { min: number; max: number };
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  selectedCompareIds: string[];
  onToggleCompare: (id: string) => void;
  onClearCompare: () => void;
  onOpenCompare: () => void;
  onSelectForExport: (id: string) => void;
  onOpenFreebies: (option: RankedLaptopOption) => void;
}

export const OptionsTableView: React.FC<OptionsTableViewProps> = ({
  options,
  filters,
  onFiltersChange,
  onResetFilters,
  priceBounds,
  sortField,
  sortDirection,
  onSort,
  selectedCompareIds,
  onToggleCompare,
  onClearCompare,
  onOpenCompare,
  onSelectForExport,
  onOpenFreebies,
}) => {
  // Derive filter dropdown options from dataset + standard GPU tiers requested (including RTX 5050)
  const gpuOptions = useMemo(() => {
    const standard = ['RTX 5050', 'RTX 5060', 'RTX 5060 Ti', 'RTX 5070'];
    const dynamic = Array.from(new Set(options.map((o) => o.gpuModel)));
    const merged = Array.from(new Set([...standard, ...dynamic]));
    return merged.map((gpu) => ({
      value: gpu,
      count: options.filter((o) => o.gpuModel === gpu).length,
    }));
  }, [options]);

  const vramOptions = useMemo(() => {
    const vals = Array.from(new Set(options.map((o) => o.vram))).sort((a, b) => a - b);
    return vals.map((v) => ({
      value: String(v),
      label: `${v}GB`,
      count: options.filter((o) => o.vram === v).length,
    }));
  }, [options]);

  const ramOptions = useMemo(() => {
    const vals = Array.from(new Set(options.map((o) => o.ram))).sort((a, b) => a - b);
    return vals.map((r) => ({
      value: String(r),
      label: `${r}GB`,
      count: options.filter((o) => o.ram === r).length,
    }));
  }, [options]);

  const storageOptions = useMemo(() => {
    const vals = Array.from(new Set(options.map((o) => o.storage))).sort((a, b) => a - b);
    return vals.map((s) => ({
      value: String(s),
      label: formatStorage(s),
      count: options.filter((o) => o.storage === s).length,
    }));
  }, [options]);

  // Apply live search + multi-dimensional filters
  const filteredAndSorted = useMemo(() => {
    const q = filters.search.trim().toLowerCase();

    const filtered = options.filter((opt) => {
      if (filters.source !== 'All' && opt.sourceChannel !== filters.source) {
        return false;
      }
      if (filters.gpuModel !== 'All' && opt.gpuModel !== filters.gpuModel) {
        return false;
      }
      if (filters.vram !== 'All' && String(opt.vram) !== filters.vram) {
        return false;
      }
      if (filters.ram !== 'All' && String(opt.ram) !== filters.ram) {
        return false;
      }
      if (filters.storage !== 'All' && String(opt.storage) !== filters.storage) {
        return false;
      }
      if (opt.price > filters.maxPrice) {
        return false;
      }
      if (q) {
        const haystack = [
          opt.laptop,
          opt.cleanName,
          opt.cpu,
          opt.gpuDisplay,
          opt.gpuModel,
          opt.display,
          opt.source,
          opt.notes,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) {
          return false;
        }
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortField === 'adjustedRank') {
        if (a.adjustedRank === null) return b.adjustedRank === null ? 0 : 1;
        if (b.adjustedRank === null) return -1;
        return sortDirection === 'asc'
          ? a.adjustedRank - b.adjustedRank
          : b.adjustedRank - a.adjustedRank;
      }
      const valA = a[sortField];
      const valB = b[sortField];
      if (valA !== valB) {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      return a.finalRank - b.finalRank;
    });
  }, [options, filters, sortField, sortDirection]);

  const hasActiveFilters =
    filters.search.trim() !== '' ||
    filters.source !== 'All' ||
    filters.gpuModel !== 'All' ||
    filters.vram !== 'All' ||
    filters.ram !== 'All' ||
    filters.storage !== 'All' ||
    filters.maxPrice < priceBounds.max;

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-slate-900 shrink-0" aria-hidden="true" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-slate-900 shrink-0" aria-hidden="true" />
    );
  };

  const SortHeader: React.FC<{
    field: SortField;
    label: string;
    align?: 'left' | 'right';
  }> = ({ field, label, align = 'right' }) => (
    <th
      scope="col"
      className={`py-3 px-2.5 text-xs font-semibold text-slate-700 select-none ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`inline-flex items-center gap-1 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 rounded whitespace-nowrap shrink-0 transition-colors duration-150 ${
          sortField === field ? 'text-slate-950 font-semibold' : ''
        }`}
      >
        <span>{label}</span>
        {renderSortIcon(field)}
      </button>
    </th>
  );

  return (
    <div className="space-y-5">
      {/* Filter & Search Workspace Toolbar */}
      <section
        aria-label="Filter and search options"
        className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-xl">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={filters.search}
              onChange={(e) =>
                onFiltersChange((prev) => ({ ...prev, search: e.target.value }))
              }
              placeholder="Search model name, CPU, GPU, display, or notes..."
              aria-label="Search laptop options"
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-400 transition-colors duration-150"
            />
          </div>

          {/* Source Segmented Filter + Reset */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 whitespace-nowrap shrink-0">
                Source:
              </span>
              <div
                role="group"
                aria-label="Filter by purchase source"
                className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
              >
                {(['All', 'Store', 'Online'] as ('All' | SourceChannel)[]).map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() =>
                      onFiltersChange((prev) => ({ ...prev, source: src }))
                    }
                    className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors duration-150 ${
                      filters.source === src
                        ? 'bg-white text-slate-950 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {src}
                  </button>
                ))}
              </div>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200/70 rounded-lg whitespace-nowrap shrink-0 transition-colors duration-150"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reset filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Hardware Spec Filters + Max Price Slider & Number Input */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 items-end">
          {/* GPU Filter */}
          <div>
            <label
              htmlFor="filter-gpu"
              className="block text-xs font-medium text-slate-600 mb-1.5"
            >
              GPU Model
            </label>
            <select
              id="filter-gpu"
              value={filters.gpuModel}
              onChange={(e) =>
                onFiltersChange((prev) => ({ ...prev, gpuModel: e.target.value }))
              }
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-slate-400"
            >
              <option value="All">All GPUs ({options.length})</option>
              {gpuOptions.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.value} ({g.count})
                </option>
              ))}
            </select>
          </div>

          {/* VRAM Filter */}
          <div>
            <label
              htmlFor="filter-vram"
              className="block text-xs font-medium text-slate-600 mb-1.5"
            >
              VRAM
            </label>
            <select
              id="filter-vram"
              value={filters.vram}
              onChange={(e) =>
                onFiltersChange((prev) => ({ ...prev, vram: e.target.value }))
              }
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-slate-400"
            >
              <option value="All">All VRAM</option>
              {vramOptions.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label} ({v.count})
                </option>
              ))}
            </select>
          </div>

          {/* RAM Filter */}
          <div>
            <label
              htmlFor="filter-ram"
              className="block text-xs font-medium text-slate-600 mb-1.5"
            >
              RAM
            </label>
            <select
              id="filter-ram"
              value={filters.ram}
              onChange={(e) =>
                onFiltersChange((prev) => ({ ...prev, ram: e.target.value }))
              }
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-slate-400"
            >
              <option value="All">All RAM</option>
              {ramOptions.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label} ({r.count})
                </option>
              ))}
            </select>
          </div>

          {/* Storage Filter */}
          <div>
            <label
              htmlFor="filter-storage"
              className="block text-xs font-medium text-slate-600 mb-1.5"
            >
              Storage
            </label>
            <select
              id="filter-storage"
              value={filters.storage}
              onChange={(e) =>
                onFiltersChange((prev) => ({ ...prev, storage: e.target.value }))
              }
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-slate-400"
            >
              <option value="All">All Storage</option>
              {storageOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label} ({s.count})
                </option>
              ))}
            </select>
          </div>

          {/* Maximum Price Slider + Synced Number Input */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label
                htmlFor="filter-max-price-num"
                className="text-xs font-medium text-slate-600"
              >
                Max Price (PHP)
              </label>
              <span className="text-xs font-mono tabular-nums text-slate-700">
                Up to {formatPHP(filters.maxPrice)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                aria-label="Maximum price slider"
                min={priceBounds.min}
                max={priceBounds.max}
                step={500}
                value={Math.min(Math.max(filters.maxPrice, priceBounds.min), priceBounds.max)}
                onChange={(e) =>
                  onFiltersChange((prev) => ({
                    ...prev,
                    maxPrice: Number(e.target.value),
                  }))
                }
                className="flex-1 accent-slate-900 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <div className="relative w-32 shrink-0">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 pointer-events-none">
                  ₱
                </span>
                <input
                  id="filter-max-price-num"
                  type="number"
                  min={0}
                  max={300000}
                  step={1000}
                  value={filters.maxPrice}
                  onChange={(e) => {
                    const next = Number.parseInt(e.target.value, 10);
                    onFiltersChange((prev) => ({
                      ...prev,
                      maxPrice: Number.isFinite(next) ? next : priceBounds.max,
                    }));
                  }}
                  className="w-full pl-6 pr-2.5 py-1.5 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contextual Summary & Selection Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
          <span>
            Showing <strong className="font-mono tabular-nums text-slate-900">{filteredAndSorted.length}</strong> of{' '}
            <span className="font-mono tabular-nums">{options.length}</span> options
          </span>
          <span aria-hidden="true">·</span>
          <span>Check 2 to 4 rows to compare side by side</span>
          <span aria-hidden="true">·</span>
          <span>Click any gift button to inspect freebies</span>
        </div>

        {selectedCompareIds.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-700 font-mono tabular-nums">
              {selectedCompareIds.length} / 4 selected
            </span>
            <button
              type="button"
              onClick={onClearCompare}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap shrink-0 transition-colors"
            >
              Clear selection
            </button>
            <button
              type="button"
              disabled={selectedCompareIds.length < 2}
              onClick={onOpenCompare}
              className="px-4 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors duration-150 bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed"
            >
              {selectedCompareIds.length < 2
                ? 'Select 1 more to compare'
                : `Compare ${selectedCompareIds.length} options`}
            </button>
          </div>
        )}
      </div>

      {/* Main Sortable Data Table with Always-Visible Sticky Horizontal Scroll */}
      {filteredAndSorted.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-16 px-6 text-center space-y-3">
          <p className="text-base font-semibold text-slate-900">
            No laptop or desktop options match your current filters
          </p>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Try raising your maximum price ceiling, selecting a different GPU tier, or clearing your search query.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onResetFilters}
              className="px-4 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              Reset all filters
            </button>
          </div>
        </div>
      ) : (
        <StickyHorizontalScroll>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th scope="col" className="py-3 pl-4 pr-2 w-10 text-center">
                  <span className="sr-only">Compare</span>
                </th>
                <SortHeader field="finalRank" label="Rank" align="right" />
                <SortHeader field="adjustedRank" label="Adj. Rank" align="right" />
                <th scope="col" className="py-3 px-3 text-xs font-semibold text-slate-700 min-w-[235px]">
                  Option &amp; Source
                </th>
                <SortHeader field="price" label="Price" align="right" />
                <th scope="col" className="py-3 px-2.5 text-xs font-semibold text-slate-700 whitespace-nowrap">
                  GPU
                </th>
                <SortHeader field="vram" label="VRAM" align="right" />
                <SortHeader field="tgp" label="TGP" align="right" />
                <SortHeader field="ram" label="RAM" align="right" />
                <SortHeader field="storage" label="Storage" align="right" />
                <th scope="col" className="py-3 px-2.5 text-xs font-semibold text-slate-700 min-w-[165px]">
                  Display
                </th>
                <th scope="col" className="py-3 px-2.5 text-xs font-semibold text-slate-700 min-w-[140px]">
                  CPU
                </th>
                <SortHeader field="freebies" label="Freebies" align="right" />
                <SortHeader field="warranty" label="Warranty" align="right" />
                <SortHeader field="score" label="Total" align="right" />
                <SortHeader field="valueScore" label="Value Index" align="right" />
                <th scope="col" className="py-3 px-3 text-xs font-semibold text-slate-700 min-w-[210px]">
                  Notes
                </th>
                <th scope="col" className="py-3 pl-2 pr-4 text-right text-xs font-semibold text-slate-700">
                  Export
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredAndSorted.map((opt) => {
                const isSelected = selectedCompareIds.includes(opt.id);
                const disableCheckbox = !isSelected && selectedCompareIds.length >= 4;

                return (
                  <tr
                    key={opt.id}
                    className={`transition-colors duration-100 ${
                      isSelected ? 'bg-sky-50/50 hover:bg-sky-50/80' : 'hover:bg-slate-50/90'
                    }`}
                  >
                    {/* Compare Checkbox */}
                    <td className="py-3 pl-4 pr-2 text-center align-middle">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={disableCheckbox}
                        onChange={() => onToggleCompare(opt.id)}
                        aria-label={`Select ${opt.cleanName} for comparison`}
                        title={
                          disableCheckbox
                            ? 'Maximum of 4 options can be selected for comparison'
                            : `Compare ${opt.cleanName}`
                        }
                        className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                      />
                    </td>

                    {/* Original Final Rank */}
                    <td className="py-3 px-2.5 text-right font-mono tabular-nums text-slate-500 align-middle whitespace-nowrap">
                      #{opt.finalRank}
                    </td>

                    <td className="py-3 px-2.5 text-right font-mono tabular-nums text-slate-500 align-middle whitespace-nowrap">
                      {opt.adjustedRank ? `#${opt.adjustedRank}` : '—'}
                    </td>

                    {/* Laptop Name + Online / Store Pill */}
                    <td className="py-3 px-3 align-middle">
                      <div className="font-semibold text-slate-900 text-[13px] leading-snug">
                        {opt.cleanName}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <SourcePill
                          sourceChannel={opt.sourceChannel}
                          formFactor={opt.formFactor}
                          listingPrefix={opt.listingPrefix}
                        />
                        <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                          Custom #{opt.recommendationRank}
                        </span>
                      </div>
                    </td>

                    {/* Price in PHP */}
                    <td className="py-3 px-2.5 text-right font-mono tabular-nums font-semibold text-slate-900 align-middle whitespace-nowrap">
                      {formatPHP(opt.price)}
                    </td>

                    {/* GPU */}
                    <td className="py-3 px-2.5 font-medium text-slate-800 align-middle whitespace-nowrap">
                      {opt.gpuDisplay}
                    </td>

                    {/* VRAM */}
                    <td className="py-3 px-2.5 text-right font-mono tabular-nums text-slate-800 align-middle whitespace-nowrap">
                      {opt.vram}GB
                    </td>

                    {/* TGP */}
                    <td className="py-3 px-2.5 text-right font-mono tabular-nums text-slate-700 align-middle whitespace-nowrap">
                      {opt.formFactor === 'Desktop' && opt.tgp === 0 ? (
                        <span title="Desktop PCIe GPU uses desktop power limits rather than laptop TGP">
                          Desktop
                        </span>
                      ) : (
                        `${opt.tgp}W`
                      )}
                    </td>

                    {/* RAM */}
                    <td className="py-3 px-2.5 text-right font-mono tabular-nums text-slate-800 align-middle whitespace-nowrap">
                      {opt.ramDescription}
                    </td>

                    {/* Storage */}
                    <td className="py-3 px-2.5 text-right font-mono tabular-nums text-slate-800 align-middle whitespace-nowrap">
                      {opt.storageDescription}
                    </td>

                    {/* Display */}
                    <td className="py-3 px-2.5 text-slate-700 align-middle">
                      {opt.display}
                    </td>

                    {/* CPU */}
                    <td className="py-3 px-2.5 text-slate-700 align-middle whitespace-nowrap">
                      {opt.cpu}
                    </td>

                    {/* Interactive Freebies Popup Trigger */}
                    <td className="py-3 px-2.5 text-right align-middle whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onOpenFreebies(opt)}
                        title={`View freebies and bundle details for ${opt.cleanName}`}
                        aria-label={`View bundle details and score (${opt.freebies.toFixed(1)} out of 100) for ${opt.cleanName}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-slate-800 font-mono tabular-nums transition-colors whitespace-nowrap shrink-0"
                      >
                        <Gift className="w-3.5 h-3.5 text-slate-600 shrink-0" aria-hidden="true" />
                        <span>{opt.freebies.toFixed(0)}/100</span>
                      </button>
                    </td>

                    {/* Warranty */}
                    <td className="py-3 px-2.5 text-right font-mono tabular-nums text-slate-700 align-middle whitespace-nowrap">
                      {opt.warranty} {opt.warranty === 1 ? 'yr' : 'yrs'}
                    </td>

                    {/* Score */}
                    <td className="py-3 px-2.5 text-right font-mono tabular-nums text-slate-800 align-middle whitespace-nowrap">
                      {opt.score.toFixed(2)}
                    </td>

                    {/* Value Score */}
                    <td className="py-3 px-2.5 text-right font-mono tabular-nums font-semibold text-slate-900 align-middle whitespace-nowrap">
                      {opt.valueScore.toFixed(2)}
                    </td>

                    {/* Notes */}
                    <td className="py-3 px-3 align-middle">
                      <div
                        className={`flex items-start gap-1.5 leading-snug ${
                          opt.riskSeverity === 'high'
                            ? 'text-red-700 font-medium'
                            : opt.riskSeverity === 'caution'
                              ? 'text-amber-800'
                              : 'text-slate-700'
                        }`}
                      >
                        {opt.hasRiskConcern && (
                          <AlertTriangle
                            className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                              opt.riskSeverity === 'high' ? 'text-red-600' : 'text-amber-600'
                            }`}
                            aria-label="Note caution"
                          />
                        )}
                        <span>{opt.notes}</span>
                      </div>
                    </td>

                    {/* Quick Export Action */}
                    <td className="py-3 pl-2 pr-4 text-right align-middle">
                      <button
                        type="button"
                        onClick={() => onSelectForExport(opt.id)}
                        title={`Export ${opt.cleanName} as JSON or Markdown`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200/80 rounded-md whitespace-nowrap shrink-0 transition-colors"
                      >
                        <Download className="w-3 h-3" aria-hidden="true" />
                        <span>Export</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </StickyHorizontalScroll>
      )}
    </div>
  );
};
