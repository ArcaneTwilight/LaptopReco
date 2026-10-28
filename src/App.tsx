import { useEffect, useMemo, useState } from 'react';
import { CompareView } from './components/CompareView';
import { ExportView } from './components/ExportView';
import { FreebiesModal } from './components/FreebiesModal';
import { OptionsTableView } from './components/OptionsTableView';
import { RecommendedView } from './components/RecommendedView';
import {
  FilterState,
  LaptopOption,
  RankedLaptopOption,
  RecommendationWeights,
  SortDirection,
  SortField,
} from './types/laptop';
import {
  formatPHP,
  parseLaptopOptionsJson,
} from './utils/markdownParser';
import { DEFAULT_WEIGHTS, rankLaptopOptions } from './utils/recommendation';

type ActiveTab = 'options' | 'compare' | 'recommended' | 'export';

const BASE_PREFIX = import.meta.env.BASE_URL.replace(/\/$/, '');
const DATASET_PATH = `${BASE_PREFIX}/laptop-options.json`;

export default function App() {
  const [rawOptions, setRawOptions] = useState<LaptopOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('options');
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [selectedExportId, setSelectedExportId] = useState<string>('');
  const [freebiesPopupId, setFreebiesPopupId] = useState<string | null>(null);
  const [weights, setWeights] = useState<RecommendationWeights>({
    ...DEFAULT_WEIGHTS,
  });

  const [sortField, setSortField] = useState<SortField>('finalRank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    source: 'All',
    gpuModel: 'All',
    vram: 'All',
    ram: 'All',
    storage: 'All',
    maxPrice: 180000,
  });

  // Load the merged specifications and scoring dataset on mount.
  useEffect(() => {
    let cancelled = false;

    async function loadLaptopOptions() {
      setIsLoading(true);
      try {
        const response = await fetch(DATASET_PATH);
        if (!response.ok) {
          throw new Error(`Dataset request failed (${response.status} ${response.statusText}).`);
        }
        const parsed = parseLaptopOptionsJson(await response.json());
        if (!cancelled) {
          setRawOptions(parsed);
          setLoadError(null);
          const maxP = Math.max(...parsed.map((option) => option.price));
          setFilters((prev) => ({ ...prev, maxPrice: maxP }));
        }
      } catch (error) {
        if (!cancelled) {
          setRawOptions([]);
          setLoadError(
            error instanceof Error
              ? `Unable to load laptop data: ${error.message}`
              : 'Unable to load laptop data due to an unknown error.'
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadLaptopOptions();
    return () => {
      cancelled = true;
    };
  }, []);

  // Compute min/max PHP price bounds from parsed options
  const priceBounds = useMemo(() => {
    if (rawOptions.length === 0) {
      return { min: 100000, max: 180000 };
    }
    const prices = rawOptions.map((o) => o.price);
    return {
      min: Math.floor(Math.min(...prices) / 1000) * 1000,
      max: Math.ceil(Math.max(...prices) / 500) * 500,
    };
  }, [rawOptions]);

  // Compute weighted recommendation rankings across all options
  const rankedOptions = useMemo(() => {
    return rankLaptopOptions(rawOptions, weights);
  }, [rawOptions, weights]);

  // Keep a valid default export option selected once options load
  useEffect(() => {
    if (!selectedExportId && rankedOptions.length > 0) {
      const preferred =
        rankedOptions.find((o) => o.slug === 'lenovo-legion-5i-83vkcto1ww') ||
        rankedOptions[0];
      if (preferred) {
        setSelectedExportId(preferred.id);
      }
    }
  }, [rankedOptions, selectedExportId]);

  const activeFreebiesOption: RankedLaptopOption | null = useMemo(() => {
    if (!freebiesPopupId) return null;
    return rankedOptions.find((o) => o.id === freebiesPopupId) || null;
  }, [freebiesPopupId, rankedOptions]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(
        field === 'finalRank' || field === 'adjustedRank' || field === 'price'
          ? 'asc'
          : 'desc'
      );
    }
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      source: 'All',
      gpuModel: 'All',
      vram: 'All',
      ram: 'All',
      storage: 'All',
      maxPrice: priceBounds.max,
    });
  };

  const handleToggleCompare = (id: string) => {
    setSelectedCompareIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleSelectForExport = (id: string) => {
    setSelectedExportId(id);
    setActiveTab('export');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenFreebies = (option: RankedLaptopOption) => {
    setFreebiesPopupId(option.id);
  };

  const topRecommendation = rankedOptions[0];

  const navItems: { id: ActiveTab; label: string }[] = [
    { id: 'options', label: 'All Options' },
    {
      id: 'compare',
      label:
        selectedCompareIds.length > 0
          ? `Compare (${selectedCompareIds.length})`
          : 'Compare',
    },
    { id: 'recommended', label: 'Recommended' },
    { id: 'export', label: 'Export' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar: 3-Zone Contract */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-8 px-6 py-4">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('options')}
            className="text-lg font-bold tracking-tight text-slate-950 whitespace-nowrap shrink-0 font-[var(--font-display)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 rounded"
          >
            SpecMatrix PH
          </button>

          {/* Zone 2: Clean Single-Line Text Navigation Links */}
          <nav
            aria-label="Primary views"
            className="hidden md:flex items-center gap-7 text-sm font-medium"
          >
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`py-1 whitespace-nowrap shrink-0 border-b-2 transition-colors duration-150 ${
                    isActive
                      ? 'border-slate-950 text-slate-950 font-semibold'
                      : 'border-transparent text-slate-600 hover:text-slate-950 hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('export')}
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              Export Option
            </button>
          </div>
        </div>
      </header>

      {/* Mobile View Switcher */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2.5 overflow-x-auto">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg min-w-full justify-between">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                activeTab === item.id
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Contextual Workspace Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-950 tracking-tight">
              {activeTab === 'options' && 'Laptop & Desktop Purchase Options'}
              {activeTab === 'compare' && 'Compare Selected Configurations'}
              {activeTab === 'recommended' && 'Recommended to Buy'}
              {activeTab === 'export' && 'Export Option Report'}
            </h1>
            {!isLoading && rawOptions.length > 0 && (
              <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-mono tabular-nums">
                  {rawOptions.length} configurations
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  Price range: {formatPHP(Math.min(...rawOptions.map((o) => o.price)))} –{' '}
                  {formatPHP(Math.max(...rawOptions.map((o) => o.price)))}
                </span>
                {topRecommendation && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      Current #1 weighted pick:{' '}
                      <button
                        type="button"
                        onClick={() => setActiveTab('recommended')}
                        className="font-medium text-slate-800 underline decoration-slate-300 hover:decoration-slate-800 underline-offset-2"
                      >
                        {topRecommendation.cleanName}
                      </button>{' '}
                      (<span className="font-mono tabular-nums">{topRecommendation.recommendationScore.toFixed(1)}/100</span>)
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {loadError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {loadError}
          </div>
        )}

        {/* Loading Skeleton State */}
        {isLoading ? (
          <div
            aria-busy="true"
            aria-label="Loading laptop options"
            className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
          >
            <div className="h-9 bg-slate-100 rounded-lg w-full max-w-md animate-pulse" />
            <div className="space-y-2.5 pt-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 bg-slate-100/80 rounded-md w-full animate-pulse"
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'options' && (
              <OptionsTableView
                options={rankedOptions}
                filters={filters}
                onFiltersChange={setFilters}
                onResetFilters={handleResetFilters}
                priceBounds={priceBounds}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                selectedCompareIds={selectedCompareIds}
                onToggleCompare={handleToggleCompare}
                onClearCompare={() => setSelectedCompareIds([])}
                onOpenCompare={() => setActiveTab('compare')}
                onSelectForExport={handleSelectForExport}
                onOpenFreebies={handleOpenFreebies}
              />
            )}

            {activeTab === 'compare' && (
              <CompareView
                allOptions={rankedOptions}
                selectedCompareIds={selectedCompareIds}
                onToggleCompare={handleToggleCompare}
                onSetCompareIds={setSelectedCompareIds}
                onSelectForExport={handleSelectForExport}
                onNavigateToAll={() => setActiveTab('options')}
                onOpenFreebies={handleOpenFreebies}
              />
            )}

            {activeTab === 'recommended' && (
              <RecommendedView
                rankedOptions={rankedOptions}
                weights={weights}
                onWeightsChange={setWeights}
                selectedCompareIds={selectedCompareIds}
                onToggleCompare={handleToggleCompare}
                onSelectForExport={handleSelectForExport}
                onOpenFreebies={handleOpenFreebies}
              />
            )}

            {activeTab === 'export' && (
              <ExportView
                rankedOptions={rankedOptions}
                selectedExportId={selectedExportId}
                onChangeExportId={setSelectedExportId}
                weights={weights}
                onOpenFreebies={handleOpenFreebies}
              />
            )}
          </>
        )}
      </main>

      {/* Freebies & Bundle Details Popup Modal */}
      <FreebiesModal
        option={activeFreebiesOption}
        weights={weights}
        onClose={() => setFreebiesPopupId(null)}
      />

      {/* Quiet Footer with Data Source Attribution */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-[1440px] mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            Data source:{' '}
            <code className="font-mono text-slate-700">public/laptop-options.json</code>
            {' '}merges the source markdown and specification/scoring CSV files.
          </div>
          <div>
            All calculations, comparisons, and exports run locally in your browser.
          </div>
        </div>
      </footer>
    </div>
  );
}
