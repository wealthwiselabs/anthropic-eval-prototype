import { NavLink } from 'react-router-dom';
import type { FailureCluster } from '../types';
import type { Suggestion } from '../data/suggestions';
import { JudgePill } from './JudgePill';
import { agentBuilderUrl } from '../lib/links';

type Props = {
  suggestion: Suggestion;
  cluster: FailureCluster | undefined;
};

export function SuggestionCard({ suggestion, cluster }: Props) {
  const href = agentBuilderUrl({
    suggestion: suggestion.builderParams.suggestion,
    cluster: suggestion.clusterId,
    template: suggestion.builderParams.template,
    prefill: suggestion.builderParams.prefill,
    project: 'travel-agent',
  });

  return (
    <div className="bg-white border border-border rounded-lg p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wide text-muted font-medium">
          Suggestion
        </span>
        {cluster && <JudgePill dimension={cluster.dimension} size="sm" />}
      </div>

      <h3 className="font-medium text-base text-ink leading-snug">{suggestion.title}</h3>

      <p className="text-sm text-muted leading-relaxed flex-1">{suggestion.body}</p>

      <p className="text-xs italic text-muted leading-relaxed">{suggestion.impactNote}</p>

      <div className="flex items-center justify-between gap-2 pt-2">
        {cluster ? (
          <NavLink
            to={`/eval/travel-agent/clusters/${cluster.id}`}
            className="text-xs text-ink/70 hover:text-ink underline-offset-2 hover:underline"
          >
            Why this suggestion?
          </NavLink>
        ) : (
          <span />
        )}
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 text-sm bg-coral text-white rounded hover:bg-coral/90 transition-colors whitespace-nowrap"
        >
          Open in Agent Builder →
        </a>
      </div>
    </div>
  );
}
