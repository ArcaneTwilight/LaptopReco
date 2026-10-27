import React, { useMemo, useState } from 'react';
import { Check, Copy, Download, FileCode, FileText, Gift } from 'lucide-react';
import { RankedLaptopOption, RecommendationWeights } from '../types/laptop';
import {
  buildOptionExportJson,
  buildOptionExportMarkdown,
  triggerFileDownload,
} from '../utils/exporter';
import { formatPHP, formatStorage } from '../utils/markdownParser';
import { SourcePill } from './SourcePill';

interface ExportViewProps {
  rankedOptions: RankedLaptopOption[];
  selectedExportId: string;
  onChangeExportId: (id: string) => void;
  weights: RecommendationWeights;
  onOpenFreebies: (option: RankedLaptopOption) => void;
}

export const ExportView: React.FC<ExportViewProps> = ({
  rankedOptions,
  selectedExportId,
  onChangeExportId,
  weights,
  onOpenFreebies,
}) => {
  const [previewFormat, setPreviewFormat] = useState<'markdown' | 'json'>('markdown');
  const [copied, setCopied] = useState(false);

  const selectedOption = useMemo(() => {
    return (
      rankedOptions.find((o) => o.id === selectedExportId) || rankedOptions[0]
    );
  }, [rankedOptions, selectedExportId]);

  const jsonContent = useMemo(() => {
    if (!selectedOption) return '';
    return buildOptionExportJson(selectedOption, rankedOptions.length, weights);
  }, [selectedOption, rankedOptions.length, weights]);

  const markdownContent = useMemo(() => {
    if (!selectedOption) return '';
    return buildOptionExportMarkdown(selectedOption, rankedOptions.length, weights);
  }, [selectedOption, rankedOptions.length, weights]);

  if (!selectedOption) {
    return null;
  }

  const jsonFilename = `${selectedOption.slug}.json`;
  const mdFilename = `${selectedOption.slug}.md`;

  const handleDownloadJson = () => {
    triggerFileDownload(jsonContent, jsonFilename, 'application/json;charset=utf-8');
  };

  const handleDownloadMarkdown = () => {
    triggerFileDownload(markdownContent, mdFilename, 'text/markdown;charset=utf-8');
  };

  const handleCopyPreview = async () => {
    const text = previewFormat === 'json' ? jsonContent : markdownContent;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div className="space-y-6">
      {/* Option Picker & Direct Export Actions */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="flex-1 max-w-xl space-y-1.5">
            <label
              htmlFor="export-option-select"
              className="block text-xs font-semibold text-slate-700"
            >
              Select One Laptop or Desktop Option to Export
            </label>
            <select
              id="export-option-select"
              value={selectedOption.id}
              onChange={(e) => onChangeExportId(e.target.value)}
              className="w-full py-2.5 px-3.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-slate-400"
            >
              {rankedOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  #{opt.recommendationRank} Rec — {opt.cleanName} ({formatPHP(opt.price)} · {opt.sourceChannel})
                </option>
              ))}
            </select>
          </div>

          {/* Primary Export Buttons: JSON & Markdown */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadJson}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-lg whitespace-nowrap shrink-0 transition-colors"
            >
              <FileCode className="w-4 h-4" aria-hidden="true" />
              <span>Export JSON ({jsonFilename})</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadMarkdown}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-slate-100 text-slate-900 hover:bg-slate-200/80 border border-slate-200 rounded-lg whitespace-nowrap shrink-0 transition-colors"
            >
              <FileText className="w-4 h-4" aria-hidden="true" />
              <span>Export Markdown ({mdFilename})</span>
            </button>
          </div>
        </div>

        {/* Summary Overview of Selected Export Option */}
        <div className="pt-5 border-t border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-3">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <SourcePill
                  sourceChannel={selectedOption.sourceChannel}
                  formFactor={selectedOption.formFactor}
                  listingPrefix={selectedOption.listingPrefix}
                />
                <span>
                  Weighted Rank #{selectedOption.recommendationRank} of {rankedOptions.length} · Table Rank #{selectedOption.finalRank}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-950">
                {selectedOption.cleanName}
              </h2>
              <div className="text-lg font-mono tabular-nums font-semibold text-slate-900">
                {formatPHP(selectedOption.price)}
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs pt-2 border-t border-slate-100">
              <div>
                <dt className="text-slate-500">GPU / VRAM</dt>
                <dd className="font-medium text-slate-900 font-mono tabular-nums">
                  {selectedOption.gpuDisplay} ({selectedOption.vram}GB)
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">TGP</dt>
                <dd className="font-medium text-slate-900 font-mono tabular-nums">
                  {selectedOption.formFactor === 'Desktop' && selectedOption.tgp === 0
                    ? 'Desktop PCIe'
                    : `${selectedOption.tgp}W`}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">RAM / Storage</dt>
                <dd className="font-medium text-slate-900 font-mono tabular-nums">
                  {selectedOption.ram}GB / {formatStorage(selectedOption.storage)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Warranty &amp; Bundle</dt>
                <dd className="mt-0.5 flex items-center gap-2">
                  <span className="font-medium text-slate-900 font-mono tabular-nums">
                    {selectedOption.warranty} yr
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenFreebies(selectedOption)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-mono tabular-nums transition-colors whitespace-nowrap shrink-0"
                  >
                    <Gift className="w-3 h-3 text-slate-600 shrink-0" aria-hidden="true" />
                    <span>{selectedOption.freebies}/10</span>
                  </button>
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-500">Display &amp; CPU</dt>
                <dd className="font-medium text-slate-900">
                  {selectedOption.display} · {selectedOption.cpu}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Spec / Value Score</dt>
                <dd className="font-medium text-slate-900 font-mono tabular-nums">
                  {selectedOption.score.toFixed(2)} / {selectedOption.valueScore.toFixed(2)}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Recommendation Score</dt>
                <dd className="font-semibold text-slate-950 font-mono tabular-nums">
                  {selectedOption.recommendationScore.toFixed(2)} / 100
                </dd>
              </div>
            </dl>
          </div>

          {/* Derived Pros, Cons, & Final Summary */}
          <div className="lg:col-span-7 space-y-4 lg:border-l lg:border-slate-100 lg:pl-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <h3 className="font-semibold text-emerald-900">Derived Pros</h3>
                <ul className="space-y-1 text-slate-700 list-disc pl-4 leading-relaxed">
                  {selectedOption.pros.map((pro, i) => (
                    <li key={i}>{pro}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-amber-900">Derived Cons &amp; Caveats</h3>
                <ul className="space-y-1 text-slate-700 list-disc pl-4 leading-relaxed">
                  {selectedOption.cons.map((con, i) => (
                    <li key={i}>{con}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-xs space-y-1">
              <div className="font-semibold text-slate-800">
                Final Recommendation Summary
              </div>
              <p className="text-slate-600 leading-relaxed">
                {selectedOption.finalRecommendationSummary}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live File Output Preview (Markdown / JSON) */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              role="group"
              aria-label="Preview format"
              className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg"
            >
              <button
                type="button"
                onClick={() => setPreviewFormat('markdown')}
                className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                  previewFormat === 'markdown'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mdFilename}
              </button>
              <button
                type="button"
                onClick={() => setPreviewFormat('json')}
                className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                  previewFormat === 'json'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {jsonFilename}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyPreview}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-950 bg-white border border-slate-200 rounded-lg whitespace-nowrap shrink-0 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Copy {previewFormat === 'json' ? 'JSON' : 'Markdown'}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={
                previewFormat === 'json'
                  ? handleDownloadJson
                  : handleDownloadMarkdown
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-lg whitespace-nowrap shrink-0 transition-colors"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Download</span>
            </button>
          </div>
        </div>

        <pre className="p-5 text-xs font-mono text-slate-800 bg-slate-50/40 overflow-x-auto leading-relaxed max-h-[520px]">
          {previewFormat === 'json' ? jsonContent : markdownContent}
        </pre>
      </section>
    </div>
  );
};
