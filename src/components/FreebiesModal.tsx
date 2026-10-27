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

/**
 * Derives clear, accurate bundle details based on the option's freebies rating, form factor,
 * and notes documented in `all_laptop_options.md`.
 */
function describeFreebiesBundle(option: RankedLaptopOption): {
  tierTitle: string;
  summary: string;
  highlights: string[];
} {
  if (option.formFactor === 'Desktop' && option.freebies === 10) {
    return {
      tierTitle: 'Complete Desktop Monitor & Peripherals Bundle (10/10)',
      summary:
        'Scored at the maximum 10/10 bundle tier in all_laptop_options.md because it includes a high-refresh gaming monitor and full peripheral set out of the box.',
      highlights: [
        'External 25-inch FHD 320Hz gaming monitor included in ₱143,187 total price',
        'Bundled keyboard, mouse, and headset included so the desktop is immediately usable',
        'Contributes the maximum +3.33 points to the original Spec Score (10 ÷ 3)',
      ],
    };
  }

  if (option.freebies >= 10) {
    return {
      tierTitle: 'Full Promotional Bundle — Top Tier (10/10)',
      summary:
        'Receives the maximum 10/10 bundle score defined in all_laptop_options.md ("10 for the full Lenovo bundle"), eliminating extra spend on essential accessories.',
      highlights: [
        'Full multi-item promotional bundle (highest laptop bundle tier in the dataset)',
        `Available via ${option.source} (${option.listingPrefix || option.sourceChannel})`,
        'Contributes the maximum +3.33 points to the original Spec Score (10 ÷ 3)',
      ],
    };
  }

  if (option.freebies >= 9) {
    return {
      tierTitle: 'Near-Full Premium Store Bundle (9/10)',
      summary:
        'Comprehensive physical store promotional bundle rated just one point shy of the maximum 10/10 Lenovo bundle.',
      highlights: [
        'Extensive store accessory inclusion (9/10 bundle rating)',
        `Contributes +${option.freebieScore.toFixed(2)} points to the original Spec Score`,
      ],
    };
  }

  if (option.freebies >= 6) {
    const isWhiteOptionB = option.cleanName.toLowerCase().includes('(12gb, b)');
    return {
      tierTitle: `Mid-Tier Store Bundle (${option.freebies}/10)`,
      summary: isWhiteOptionB
        ? 'Mid-tier store bundle (6/10). Note from all_laptop_options.md: the ₱162,999 listing of this same model includes the full 10/10 bundle at a lower price.'
        : 'Solid store-included accessory bundle above standard single-bag retail inclusions.',
      highlights: [
        `Rated ${option.freebies}/10 on the comparison bundle scale`,
        `Contributes +${option.freebieScore.toFixed(2)} points to the original Spec Score`,
        ...(isWhiteOptionB
          ? ['Compare against the ₱162,999 Legion 5 White listing which offers a 10/10 bundle']
          : []),
      ],
    };
  }

  if (option.freebies >= 4) {
    return {
      tierTitle: `Standard Store Accessory Bundle (${option.freebies}/10)`,
      summary:
        'Moderate retail freebie package included with the physical store purchase.',
      highlights: [
        `Rated ${option.freebies}/10 on the comparison bundle scale`,
        `Contributes +${option.freebieScore.toFixed(2)} points to the original Spec Score`,
      ],
    };
  }

  if (option.freebies >= 1) {
    return {
      tierTitle: `Basic Store Freebies (${option.freebies}/10)`,
      summary:
        'Entry-level retail freebies (e.g., standard carry bag / basic accessory tier) with minimal extra bundle value.',
      highlights: [
        `Rated ${option.freebies}/10 on the comparison bundle scale`,
        `Contributes +${option.freebieScore.toFixed(2)} points to the original Spec Score`,
        'Budget extra if you need a dedicated gaming mouse, headset, or upgraded backpack',
      ],
    };
  }

  return {
    tierTitle: 'No Extra Freebies Listed (0/10)',
    summary:
      'Scored as 0/10 for extra bundle items in all_laptop_options.md (unit + standard box contents only).',
    highlights: [
      '0/10 promotional bundle rating in source comparison table',
      'Contributes +0.00 points to the Spec Score',
      'Factor in separate accessory costs when comparing total out-of-pocket price',
    ],
  };
}

export const FreebiesModal: React.FC<FreebiesModalProps> = ({
  option,
  weights,
  onClose,
}) => {
  useEffect(() => {
    if (!option) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [option, onClose]);

  if (!option) return null;

  const details = describeFreebiesBundle(option);
  const totalWeight =
    Object.values(weights).reduce((sum, val) => sum + Math.max(0, val), 0) || 1;
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
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200 rounded-xl max-w-lg w-full shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
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
            aria-label="Close freebies popup"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Rating Bar & Numeric Breakdown */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900 text-sm">
                <Gift className="w-4 h-4 text-slate-700 shrink-0" aria-hidden="true" />
                <span>Freebies / Bundle Rating</span>
              </span>
              <span className="text-base font-bold font-mono tabular-nums text-slate-950">
                {option.freebies} / 10
              </span>
            </div>

            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  option.freebies >= 9
                    ? 'bg-emerald-600'
                    : option.freebies >= 5
                      ? 'bg-slate-800'
                      : option.freebies >= 1
                        ? 'bg-amber-500'
                        : 'bg-slate-300'
                }`}
                style={{ width: `${Math.max(4, option.freebies * 10)}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <div className="text-slate-500">Original Spec Score Bonus</div>
                <div className="font-mono tabular-nums font-semibold text-slate-900 mt-0.5">
                  +{option.freebieScore.toFixed(2)} pts{' '}
                  <span className="font-normal text-slate-500">(max 3.33)</span>
                </div>
              </div>
              <div>
                <div className="text-slate-500">
                  Weighted Rec. Impact ({freebiesSharePct}% weight)
                </div>
                <div className="font-mono tabular-nums font-semibold text-slate-900 mt-0.5">
                  +{weightedContribution} / 100 pts
                </div>
              </div>
            </div>
          </div>

          {/* Bundle Explanation */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900 text-[13px]">
              <PackageCheck className="w-4 h-4 text-slate-700 shrink-0" aria-hidden="true" />
              <span>{details.tierTitle}</span>
            </div>
            <p className="text-slate-600 leading-relaxed">{details.summary}</p>
            <ul className="space-y-1.5 text-slate-700 list-disc pl-4 leading-relaxed">
              {details.highlights.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Evaluator Note Context */}
          {option.notes && (
            <div className="pt-3 border-t border-slate-100 text-slate-600">
              <span className="font-semibold text-slate-800">Option Note: </span>
              {option.notes}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500">
            Formula in <code className="font-mono">all_laptop_options.md</code>: Freebies ÷ 3
          </span>
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
