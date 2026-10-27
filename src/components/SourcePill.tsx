import React from 'react';
import { Globe, Monitor, Store } from 'lucide-react';
import { FormFactor, SourceChannel } from '../types/laptop';

interface SourcePillProps {
  sourceChannel: SourceChannel;
  formFactor?: FormFactor;
  listingPrefix?: string;
}

/**
 * Renders a clear, high-contrast pill indicating whether an option is sold Online or in a physical Store,
 * with a secondary indicator if it is the desktop tower bundle.
 */
export const SourcePill: React.FC<SourcePillProps> = ({
  sourceChannel,
  formFactor = 'Laptop',
  listingPrefix,
}) => {
  const isOnline = sourceChannel === 'Online';
  const isDesktop = formFactor === 'Desktop';

  // Extract sub-batch identifier like "4/5" or "1" from "Online 4/5" if present
  const batchSuffix =
    listingPrefix &&
    listingPrefix.toLowerCase().startsWith('online ') &&
    listingPrefix.toLowerCase() !== 'online desktop'
      ? listingPrefix.replace(/^online\s+/i, '').trim()
      : '';

  if (isOnline) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap shrink-0">
        {isDesktop ? (
          <Monitor className="w-3 h-3 text-indigo-600 shrink-0" aria-hidden="true" />
        ) : (
          <Globe className="w-3 h-3 text-indigo-600 shrink-0" aria-hidden="true" />
        )}
        <span>
          {isDesktop
            ? 'Online · Desktop'
            : batchSuffix
              ? `Online #${batchSuffix}`
              : 'Online'}
        </span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap shrink-0">
      <Store className="w-3 h-3 text-emerald-700 shrink-0" aria-hidden="true" />
      <span>Store</span>
    </span>
  );
};
