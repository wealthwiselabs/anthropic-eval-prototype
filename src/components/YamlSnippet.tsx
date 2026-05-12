import { useEffect, useState } from 'react';

// Lazy-loads Shiki only when the user actually opens a snippet preview, so the
// initial bundle stays slim. Falls back to a plain <pre> while Shiki loads.
// Langs are limited to the ones we actually render so the highlighter only
// pulls grammars we need.
type Lang = 'yaml' | 'bash' | 'python' | 'typescript';

type Props = { code: string; lang?: Lang };

export function YamlSnippet({ code, lang = 'yaml' }: Props) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Reset on lang/code change so the user doesn't see stale highlighted HTML
    // from a previous tab flash through before the new one resolves.
    setHtml(null);
    (async () => {
      try {
        const shiki = await import('shiki');
        const highlighter = await shiki.createHighlighter({
          themes: ['github-light'],
          langs: ['yaml', 'bash', 'python', 'typescript'],
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
