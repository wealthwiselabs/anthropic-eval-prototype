import type { FailureCluster } from '../types';
import { JudgePill } from './JudgePill';
import { TrendArrow } from './TrendArrow';

type Props = {
  cluster: FailureCluster;
  onView: () => void;
  onSave: () => void;
};

export function ClusterCard({ cluster, onView, onSave }: Props) {
  return (
    <div className="bg-white border border-border rounded-lg p-4 flex flex-col gap-3 min-h-[180px]">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-serif text-base text-ink leading-snug">{cluster.title}</h3>
      </div>
      <div className="flex items-center gap-2">
        <JudgePill dimension={cluster.dimension} verdict="fail" size="sm" />
        <span className="text-sm text-ink font-mono">{cluster.count}</span>
        <span className="text-muted">·</span>
        <TrendArrow trend={cluster.trend7d} />
      </div>
      <p className="text-xs text-muted leading-relaxed line-clamp-3 flex-1">{cluster.description}</p>
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onView}
          className="px-3 py-1.5 text-sm border border-ink/80 text-ink rounded hover:bg-ink hover:text-white transition-colors"
        >
          View
        </button>
        <button
          onClick={onSave}
          className="px-3 py-1.5 text-sm text-ink/80 hover:text-ink hover:bg-canvas rounded transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}
