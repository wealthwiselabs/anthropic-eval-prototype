import { useState } from 'react';
import { Check, Copy, CheckCircle2, XCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { ProjectShell } from '../components/ProjectShell';
import { YamlSnippet } from '../components/YamlSnippet';

const ACTION_YAML = `name: Evals
on: [pull_request]
jobs:
  eval:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: anthropic/evals-action@v1
        with:
          project: travel-agent
          test-sets: booking-smoke,safety-regression,tool-arg-mismatch-v1
          api-key: \${{ secrets.ANTHROPIC_API_KEY }}
          fail-on: regression
`;

const CLI_INSTALL = `npm install -g @anthropic-ai/evals-cli`;
const CLI_RUN_ONE = `anthropic evals run tool-arg-mismatch-v1 --model claude-opus-4-7`;
const CLI_RUN_ALL = `anthropic evals run all --base-run latest --fail-on regression`;

export function CIIntegration() {
  return (
    <ProjectShell activeTab="ci">
      <section>
        <h1 className="font-serif text-2xl text-ink">CI integration</h1>
        <p className="text-sm text-muted mt-1 max-w-3xl">
          Drop test sets into your existing pipeline. The GitHub Action and CLI on this page are
          illustrative and reference the v1 spec.
        </p>
      </section>

      {/* CI tokens (inert) — small note rather than its own dense section */}
      <section className="bg-white border border-border rounded-lg p-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-sm font-medium text-ink">CI tokens</h2>
          <p className="text-xs text-muted mt-0.5">
            Tokens are scoped to <span className="font-mono">travel-agent</span> and grant
            read-only access to test sets and run history.
          </p>
        </div>
        <button
          title="Mocked in this prototype"
          className="px-3 py-1.5 text-sm border border-border bg-white text-ink/70 rounded cursor-default flex-shrink-0"
        >
          Generate token
        </button>
      </section>

      {/* Section 1: GitHub Action */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-serif text-lg text-ink">1. GitHub Action</h2>
          <p className="text-sm text-muted mt-1 max-w-3xl">
            Run your test sets on every pull request. The Anthropic Evals Action picks up tests by
            name from this project and posts results to the PR.
          </p>
        </div>
        <SnippetWithCopy code={ACTION_YAML} lang="yaml" filename=".github/workflows/evals.yml" />
      </section>

      {/* Section 2: Example PR check + comment */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-serif text-lg text-ink">2. What it looks like on a pull request</h2>
          <p className="text-sm text-muted mt-1 max-w-3xl">
            A pass/fail check appears alongside CI, and the bot posts a comment summarizing newly
            failing cases with a link back to the run.
          </p>
        </div>
        <PRMock />
      </section>

      {/* Section 3: CLI */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-serif text-lg text-ink">3. Run from any CI or your terminal</h2>
          <p className="text-sm text-muted mt-1 max-w-3xl">
            The CLI gives you the same flow without GitHub: useful from GitLab, CircleCI, or
            interactively during a debug loop.
          </p>
        </div>
        <SnippetWithCopy code={CLI_INSTALL} lang="bash" />
        <SnippetWithCopy code={CLI_RUN_ONE} lang="bash" />
        <SnippetWithCopy code={CLI_RUN_ALL} lang="bash" />
      </section>
    </ProjectShell>
  );
}

// Wraps a Shiki-highlighted snippet with a copy-to-clipboard button and an
// optional filename header (used for the action YAML).
function SnippetWithCopy({
  code,
  lang,
  filename,
}: {
  code: string;
  lang: 'yaml' | 'bash';
  filename?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can fail in non-secure contexts; silently no-op so the
      // demo doesn't surface a scary error.
    }
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-white">
      {filename && (
        <div className="px-3 py-1.5 bg-chrome border-b border-border text-[11px] font-mono text-muted">
          {filename}
        </div>
      )}
      <div className="relative">
        <YamlSnippet code={code} lang={lang} />
        <button
          onClick={copy}
          className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 text-[11px] bg-white border border-border rounded hover:bg-canvas transition-colors text-ink/80"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" /> Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" /> Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Static mock of a GitHub PR check panel + bot comment. Uses our tailwind
// tokens so colors stay consistent with the rest of the prototype.
function PRMock() {
  const [commentOpen, setCommentOpen] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-white">
      {/* Header bar mimics a PR title row */}
      <div className="px-4 py-2 bg-chrome border-b border-border text-xs text-muted flex items-center gap-2">
        <span className="font-mono">wealthwiselabs/travel-agent</span>
        <span>·</span>
        <span>PR #482 — Fix flight.search clarifying question</span>
      </div>

      {/* Checks panel */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <XCircle className="w-5 h-5 text-coral flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-sm text-ink font-medium">
              Evals · 21/24 passing <span className="text-coral font-mono">(-2 from main)</span>
            </div>
            <div className="text-xs text-muted mt-0.5">
              <CheckCircle2 className="inline w-3 h-3 mr-1 text-emerald-700" />
              Build · passing &nbsp;
              <CheckCircle2 className="inline w-3 h-3 mr-1 text-emerald-700" />
              Tests · passing
            </div>
          </div>
        </div>
        <a className="text-xs text-coral hover:underline cursor-default" title="Mocked in this prototype">
          Details
        </a>
      </div>

      {/* Bot comment */}
      <div className="px-4 py-3 flex gap-3">
        <div className="w-8 h-8 rounded-full bg-ink text-white flex items-center justify-center font-mono text-xs flex-shrink-0">
          AE
        </div>
        <div className="flex-1 min-w-0">
          <button
            onClick={() => setCommentOpen((v) => !v)}
            className="w-full text-left flex items-center gap-2"
          >
            {commentOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-muted" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-muted" />
            )}
            <span className="text-sm font-medium text-ink">@anthropic-evals</span>
            <span className="text-xs text-muted">commented just now</span>
          </button>

          {commentOpen && (
            <div className="mt-2 border border-border rounded bg-canvas/50">
              <div className="px-3 py-2 text-sm text-ink/90 leading-relaxed">
                Eval run for this PR finished:{' '}
                <span className="font-mono text-coral">21/24 passing</span> (regression of 2
                cases vs. <span className="font-mono">main</span>).
              </div>
              <div className="px-3 py-2 border-t border-border">
                <button
                  onClick={() => setDetailsOpen((v) => !v)}
                  className="text-xs text-ink/80 flex items-center gap-1 hover:text-ink"
                >
                  {detailsOpen ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                  {detailsOpen ? 'Hide' : 'Show'} 2 newly-failing cases
                </button>
                {detailsOpen && (
                  <ul className="mt-2 flex flex-col gap-2 pl-4">
                    <li className="text-xs text-ink/80">
                      <span className="font-mono text-coral">tc_b08</span> — fly me anywhere warm
                      next weekend
                      <div className="text-muted mt-0.5">
                        agent invoked <span className="font-mono">flight.search</span> with{' '}
                        <span className="font-mono">destination=null</span> instead of asking a
                        clarifying question
                      </div>
                    </li>
                    <li className="text-xs text-ink/80">
                      <span className="font-mono text-coral">tc_b09</span> — book the cheapest
                      option
                      <div className="text-muted mt-0.5">
                        agent ignored prior search results and re-ran{' '}
                        <span className="font-mono">flight.search</span>
                      </div>
                    </li>
                  </ul>
                )}
              </div>
              <div className="px-3 py-2 border-t border-border text-xs text-muted">
                Run from <span className="font-mono">claude-opus-4-7</span>. View the full run in
                Anthropic Console.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
