import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { Trace, JudgeDimension } from '../types';
import { JudgePill } from './JudgePill';
import { OverallVerdictPill } from './OverallVerdictPill';
import { traceVerdict } from '../lib/verdict';
import { relTime } from '../lib/time';

type Props = {
  trace: Trace;
  sessionId?: string;
  defaultExpanded?: boolean;
};

const PILL_DIMENSIONS: JudgeDimension[] = ['tool-use', 'safety', 'faithfulness'];

// Renders a single trace as a card. Used in cluster detail (the hero content)
// and session detail (one card per turn). Input / output blocks are
// collapsible — collapsed by default unless `defaultExpanded` is set.
export function TraceCard({ trace, sessionId, defaultExpanded = false }: Props) {
  const [inputOpen, setInputOpen] = useState(defaultExpanded);
  const [outputOpen, setOutputOpen] = useState(defaultExpanded);

  const failedScores = trace.scores.filter((s) => s.verdict === 'fail' && s.reasoning);
  const passed = traceVerdict(trace) === 'pass';

  return (
    <div className="bg-white border border-border rounded-lg p-4 flex flex-col gap-3">
      {/* Header row: timestamp · session id · latency · tokens · overall verdict.
          The overall PASS/FAIL pill sits at the far right so reviewers can scan
          a stack of cards and immediately spot fails without reading judges. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span>{relTime(trace.timestamp)}</span>
        {sessionId && (
          <Link
            to={`/eval/travel-agent/sessions/${sessionId}`}
            className="font-mono text-ink/80 hover:text-coral truncate max-w-[260px]"
            title={sessionId}
          >
            {sessionId}
          </Link>
        )}
        <span className="font-mono">{trace.latencyMs}ms</span>
        <span className="font-mono">{trace.tokensIn + trace.tokensOut} tok</span>
        <span className="ml-auto">
          <OverallVerdictPill passed={passed} size="sm" />
        </span>
      </div>

      {/* Collapsible input section */}
      <CollapseRow
        label="Input"
        open={inputOpen}
        onToggle={() => setInputOpen((v) => !v)}
        preview={trace.inputPreview}
      >
        <div className="text-sm text-ink whitespace-pre-wrap">{trace.inputPreview}</div>
        {trace.toolCalls && trace.toolCalls.length > 0 && (
          <div className="mt-2 text-xs font-mono text-ink/80 bg-canvas border border-border rounded p-2 overflow-x-auto">
            {trace.toolCalls.map((tc, i) => (
              <div key={i}>
                <span className="text-coral">{tc.name}</span>(
                <span>{JSON.stringify(tc.args)}</span>)
              </div>
            ))}
          </div>
        )}
      </CollapseRow>

      {/* Collapsible output section */}
      <CollapseRow
        label="Output"
        open={outputOpen}
        onToggle={() => setOutputOpen((v) => !v)}
        preview={trace.outputPreview}
      >
        <div className="text-sm text-ink whitespace-pre-wrap">{trace.outputPreview}</div>
      </CollapseRow>

      {/* Judge verdicts: render whichever of the 3 default dimensions appear */}
      <div className="flex items-center gap-2 pt-1 border-t border-border/60">
        <span className="text-[11px] uppercase tracking-wide text-muted">Judge</span>
        {PILL_DIMENSIONS.map((dim) => {
          const score = trace.scores.find((s) => s.dimension === dim);
          if (!score) return null;
          return <JudgePill key={dim} dimension={dim} verdict={score.verdict} size="sm" />;
        })}
      </div>

      {/* Failed-score reasoning callouts */}
      {failedScores.length > 0 && (
        <div className="flex flex-col gap-2">
          {failedScores.map((s, i) => (
            <blockquote
              key={i}
              className="border-l-2 border-coral bg-coral/5 px-3 py-2 text-xs text-ink/80 italic leading-relaxed"
            >
              <span className="not-italic font-medium text-coral mr-1">
                {s.dimension}:
              </span>
              {s.reasoning}
            </blockquote>
          ))}
        </div>
      )}
    </div>
  );
}

function CollapseRow({
  label,
  open,
  onToggle,
  preview,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  preview: string;
  children: React.ReactNode;
}) {
  const Icon = open ? ChevronDown : ChevronRight;
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full text-left flex items-start gap-1.5 group"
      >
        <Icon className="w-4 h-4 mt-0.5 text-muted group-hover:text-ink flex-shrink-0" />
        <span className="text-[11px] uppercase tracking-wide text-muted mt-0.5 flex-shrink-0">
          {label}
        </span>
        {!open && (
          <span className="text-sm text-ink/80 truncate flex-1">{preview}</span>
        )}
      </button>
      {open && <div className="mt-2 ml-5">{children}</div>}
    </div>
  );
}
