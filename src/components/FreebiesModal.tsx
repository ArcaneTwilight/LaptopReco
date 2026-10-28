import React, { useEffect } from 'react';
import { Gift, PackageCheck, X } from 'lucide-react';
import { RankedLaptopOption, RecommendationWeights } from '../types/laptop';
import { formatPHP } from '../utils/markdownParser';
import { SourcePill } from './SourcePill';

interface FreebiesModalProps {
  option: RankedLaptopOption | null;
  weights: RecommendationWeights;
  onClose: () => void;
}

export const FreebiesModal: React.FC<FreebiesModalProps> = ({
  option,
  weights,
  onClose,
}) => {
  useEffect(() => {
    if (!option) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [option, onClose]);

  if (!option) return null;

  const totalWeight =
    Object.values(weights).reduce((sum, value) => sum + Math.max(0, value), 0) || 1;
  const freebiesSharePct = Math.round(
    (Math.max(0, weights.freebies) / totalWeight) * 100
  );
  const weightedContribution = (
    option.componentBreakdown.freebies *
    (Math.max(0, weights.freebies) / totalWeight)
  ).toFixed(2);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-[2px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="freebies-modal-title"
        onClick={(event) => event.stopPropagation()}
        className="bg-white border border-slate-200 rounded-xl max-w-lg w-full shadow-xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50/70">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <SourcePill
                sourceChannel={option.sourceChannel}
                formFactor={option.formFactor}
                listingPrefix={option.listingPrefix}
              />
              <span className="text-xs font-mono tabular-nums text-slate-600">
                {formatPHP(option.price)}
              </span>
            </div>
            <h2
              id="freebies-modal-title"
              className="text-base font-bold text-slate-950 leading-snug"
            >
              {option.cleanName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close bundle details"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900 text-sm">
                <Gift className="w-4 h-4 text-slate-700 shrink-0" aria-hidden="true" />
                <span>Source Bundle Score</span>
              </span>
              <span className="text-base font-bold font-mono tabular-nums text-slate-950">
                {option.freebies.toFixed(1)} / 100
              </span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-slate-800"
                style={{ width: `${Math.min(100, Math.max(0, option.freebies))}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <div className="text-slate-500">Contribution to Total Score</div>
                <div className="font-mono tabular-nums font-semibold text-slate-900 mt-0.5">
                  {option.freebieScore.toFixed(1)} × 3%
                </div>
              </div>
              <div>
                <div className="text-slate-500">
                  Custom Weighted Impact ({freebiesSharePct}%)
                </div>
                <div className="font-mono tabular-nums font-semibold text-slate-900 mt-0.5">
                  +{weightedContribution} / 100 pts
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900 text-[13px]">
              <PackageCheck className="w-4 h-4 text-slate-700 shrink-0" aria-hidden="true" />
              <span>Included Bundle</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              {option.freebiesDescription || 'No freebies listed.'}
            </p>
            <p className="text-slate-500 leading-relaxed">
              The source scores bundle value as part of the total quality score; it is not a
              standalone cash valuation.
            </p>
          </div>

          {option.notes && (
            <div className="pt-3 border-t border-slate-100 text-slate-600">
              <span className="font-semibold text-slate-800">Option Note: </span>
              {option.notes}
            </div>
          )}
        </div>
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-lg whitespace-nowrap shrink-0 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
