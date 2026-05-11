import { useEffect, useState } from 'react';

// Lazy-loads Shiki only when the user actually opens a CI preview, so the
// initial bundle stays slim. Falls back to a plain <pre> while Shiki loads.
// Supports yaml + bash because the CI page renders both.
type Lang = 'yaml' | 'bash';

type Props = { code: string; lang?: Lang };

export function YamlSnippet({ code, lang = 'yaml' }: Props) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const shiki = await import('shiki');
        const highlighter = await shiki.createHighlighter({
          themes: ['github-light'],
          langs: ['yaml', 'bash'],
        });
        if (cancelled) return;
        const out = highlighter.codeToHtml(code, { lang, theme: 'github-light' });
        setHtml(out);
      } catch {
        // Fall through to plaintext fallback below
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, lang]);

  if (html) {
    return (
      <div
        className="text-xs font-mono [&_pre]:bg-canvas [&_pre]:border [&_pre]:border-border [&_pre]:rounded [&_pre]:p-3 [&_pre]:overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  return (
    <pre className="text-xs font-mono bg-canvas border border-border rounded p-3 overflow-x-auto text-ink">
      {code}
    </pre>
  );
}
