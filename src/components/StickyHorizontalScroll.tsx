import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface StickyHorizontalScrollProps {
  children: React.ReactNode;
}

/**
 * Wraps a wide horizontal table so that a synchronized, always-visible horizontal scrollbar
 * sticks to the bottom of the browser viewport while the user scrolls vertically through the table.
 */
export const StickyHorizontalScroll: React.FC<StickyHorizontalScrollProps> = ({
  children,
}) => {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const stickyBarRef = useRef<HTMLDivElement | null>(null);
  const syncingSourceRef = useRef<'content' | 'bar' | null>(null);

  const [metrics, setMetrics] = useState({
    hasOverflow: false,
    dummyWidth: 0,
    atStart: true,
    atEnd: false,
  });

  const measure = useCallback(() => {
    const contentEl = contentRef.current;
    if (!contentEl) return;

    const { scrollWidth, clientWidth, scrollLeft } = contentEl;
    const hasOverflow = scrollWidth > clientWidth + 2;
    const barClientWidth = stickyBarRef.current?.clientWidth || clientWidth;

    // Scale inner track proportionally so scrollbar thumb width and travel match 1:1
    const dummyWidth =
      clientWidth > 0 ? Math.round((scrollWidth / clientWidth) * barClientWidth) : scrollWidth;

    setMetrics({
      hasOverflow,
      dummyWidth,
      atStart: scrollLeft <= 2,
      atEnd: scrollLeft + clientWidth >= scrollWidth - 2,
    });
  }, []);

  useEffect(() => {
    measure();

    const contentEl = contentRef.current;
    if (!contentEl) return;

    const observer = new ResizeObserver(() => {
      measure();
    });

    observer.observe(contentEl);
    if (contentEl.firstElementChild) {
      observer.observe(contentEl.firstElementChild);
    }

    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure, children]);

  // Re-measure dummyWidth once stickyBarRef mounts when overflow becomes true
  useEffect(() => {
    if (metrics.hasOverflow) {
      measure();
    }
  }, [metrics.hasOverflow, measure]);

  const handleContentScroll = () => {
    const contentEl = contentRef.current;
    if (!contentEl) return;

    const { scrollLeft, scrollWidth, clientWidth } = contentEl;
    setMetrics((prev) => ({
      ...prev,
      atStart: scrollLeft <= 2,
      atEnd: scrollLeft + clientWidth >= scrollWidth - 2,
    }));

    if (syncingSourceRef.current === 'bar') {
      syncingSourceRef.current = null;
      return;
    }

    const barEl = stickyBarRef.current;
    if (!barEl) return;

    const maxContent = scrollWidth - clientWidth;
    const maxBar = barEl.scrollWidth - barEl.clientWidth;
    if (maxContent > 0 && maxBar > 0) {
      syncingSourceRef.current = 'content';
      barEl.scrollLeft = (scrollLeft / maxContent) * maxBar;
    }
  };

  const handleBarScroll = () => {
    const barEl = stickyBarRef.current;
    const contentEl = contentRef.current;
    if (!barEl || !contentEl) return;

    if (syncingSourceRef.current === 'content') {
      syncingSourceRef.current = null;
      return;
    }

    const maxBar = barEl.scrollWidth - barEl.clientWidth;
    const maxContent = contentEl.scrollWidth - contentEl.clientWidth;
    if (maxBar > 0 && maxContent > 0) {
      syncingSourceRef.current = 'bar';
      contentEl.scrollLeft = (barEl.scrollLeft / maxBar) * maxContent;
    }
  };

  const nudgeScroll = (delta: number) => {
    const contentEl = contentRef.current;
    if (!contentEl) return;
    contentEl.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl">
      {/* Scrollable Table Viewport */}
      <div
        ref={contentRef}
        onScroll={handleContentScroll}
        className={`overflow-x-auto rounded-t-xl ${
          metrics.hasOverflow ? 'hide-scrollbar' : 'always-visible-scrollbar rounded-b-xl'
        }`}
      >
        {children}
      </div>

      {/* Pinned Bottom Horizontal Scrollbar — stays visible at bottom of viewport when scrolling vertically */}
      {metrics.hasOverflow && (
        <div
          aria-label="Horizontal table scroll controls"
          className="sticky bottom-0 z-20 bg-slate-50/95 backdrop-blur-xs border-t border-slate-200 rounded-b-xl px-3 py-2 flex items-center gap-2.5 shadow-[0_-3px_10px_rgba(15,23,42,0.05)]"
        >
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => nudgeScroll(-280)}
              disabled={metrics.atStart}
              aria-label="Scroll table left"
              title="Scroll left"
              className="p-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => nudgeScroll(280)}
              disabled={metrics.atEnd}
              aria-label="Scroll table right"
              title="Scroll right"
              className="p-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          <div
            ref={stickyBarRef}
            onScroll={handleBarScroll}
            className="flex-1 always-visible-scrollbar py-0.5"
          >
            <div
              style={{
                width: `${Math.max(metrics.dummyWidth, 1)}px`,
                height: '1px',
              }}
            />
          </div>

          <span className="hidden md:inline text-[11px] font-medium text-slate-500 whitespace-nowrap shrink-0">
            Horizontal scroll
          </span>
        </div>
      )}
    </div>
  );
};
