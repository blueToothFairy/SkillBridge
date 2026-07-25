import React from 'react';

/**
 * Parses basic markdown text for headers (e.g., #, ##, ###) and bold text (e.g., **bold** or __bold__).
 * Returns formatted React components.
 */
export function parseMarkdown(text: string): React.ReactNode[] | null {
  if (!text) return null;

  const lines = text.split('\n');
  return lines.map((line, idx) => {
    let content = line;
    let isHeader = false;
    let headerLevel = 0;

    // Match markdown header prefix (e.g. ### Header or ## Header)
    const headerMatch = content.match(/^(#{1,6})\s+(.*)$/);
    if (headerMatch) {
      isHeader = true;
      headerLevel = headerMatch[1].length;
      content = headerMatch[2];
    }

    // Split line content by ** or __ to parse bold elements
    const parts = content.split(/\*\*|__/);
    const elements = parts.map((part, pIdx) => {
      // Every odd index in parts is inside bold tags
      if (pIdx % 2 === 1) {
        return (
          <strong key={pIdx} className="font-bold text-slate-900">
            {part}
          </strong>
        );
      }
      return part;
    });

    if (isHeader) {
      const headingClass =
        headerLevel === 1
          ? 'text-lg sm:text-xl font-bold text-slate-900 mt-4 mb-2 first:mt-0'
          : headerLevel === 2
          ? 'text-base sm:text-lg font-bold text-slate-900 mt-3 mb-1.5 first:mt-0'
          : 'text-sm sm:text-base font-bold text-slate-900 mt-4 mb-2 first:mt-0 border-b border-slate-100 pb-1 w-full';

      if (headerLevel === 1) return <h1 key={idx} className={headingClass}>{elements}</h1>;
      if (headerLevel === 2) return <h2 key={idx} className={headingClass}>{elements}</h2>;
      return <h3 key={idx} className={headingClass}>{elements}</h3>;
    }

    // If the line is empty, render a small vertical spacing div
    if (content.trim() === '') {
      return <div key={idx} className="h-2" />;
    }

    return (
      <div key={idx} className="text-xs sm:text-sm text-slate-600 leading-relaxed my-1 min-h-[1.25rem]">
        {elements}
      </div>
    );
  });
}
