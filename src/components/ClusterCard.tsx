import type { FailureCluster } from '../types';
import { JudgePill } from './JudgePill';
import { TrendArrow } from './TrendArrow';

type Props = {
  cluster: FailureCluster;
  onView: () => void;
  onSave: () => void;
  // When true, omit the description paragraph — used on the project home where
  // the title + dimension + count already convey enough.
  compact?: boolean;
};

export function ClusterCard({ cluster, onView, onSave, compact }: Props) {
  return (
    <div className="bg-white border border-border rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-serif text-base text-ink leading-snug">{cluster.title}</h3>
      </div>
      <div className="flex items-center gap-2">
        <JudgePill dimension={cluster.dimension} verdict="fail" size="sm" />
        <span className="text-sm text-ink font-mono">{cluster.count}</span>
        <span className="text-muted">·</span>
        <TrendArrow trend={cluster.trend7d} />
      </div>
      {!compact && (
        <p className="text-xs text-muted leading-relaxed line-clamp-3 flex-1">{cluster.description}</p>
      )}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onView}
          className="px-3 py-1.5 text-sm border border-ink/80 text-ink rounded hover:bg-ink hover:text-white transition-colors"
        >
          View
        </button>
        <button
          onClick={onSave}
          className="text-sm text-ink/70 hover:text-ink underline-offset-2 hover:underline transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}
