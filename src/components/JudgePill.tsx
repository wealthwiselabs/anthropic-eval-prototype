import type { JudgeDimension } from '../types';

const LABELS: Record<JudgeDimension, string> = {
  'tool-use': 'Tool-use',
  safety: 'Safety',
  faithfulness: 'Faithful.',
  'task-completion': 'Task',
};

// Binary judge pill: green = pass, red = fail. No score number — the pill
// stands alone as the verdict, with the dimension label as the only content.
// When `verdict` is undefined (catalog/judges pages) the pill renders in a
// neutral dimension-colored style, used purely as a dimension tag.
const DIMENSION_BG: Record<JudgeDimension, string> = {
  'tool-use': 'bg-node-agent text-ink',
  safety: 'bg-node-classify text-ink',
  faithfulness: 'bg-node-subagent text-ink',
  'task-completion': 'bg-node-skill text-ink',
};

type JudgePillProps = {
  dimension: JudgeDimension;
  verdict?: 'pass' | 'fail';
  size?: 'sm' | 'md';
};

export function JudgePill({ dimension, verdict, size = 'md' }: JudgePillProps) {
  const sizeCls = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

  // When a verdict is provided the pill takes a pass/fail color; without one we
  // fall back to the dimension-tinted neutral style (used in judge catalogs).
  let bgCls: string;
  if (verdict === 'pass') {
    bgCls = 'bg-node-start text-success border-transparent';
  } else if (verdict === 'fail') {
    bgCls = 'bg-coral/15 text-coral border-transparent';
  } else {
    bgCls = DIMENSION_BG[dimension] + ' border-transparent';
  }

  return (
    <span
      className={
        'inline-flex items-center rounded border font-medium tracking-tight ' +
        bgCls +
        ' ' +
        sizeCls
      }
    >
      {LABELS[dimension]}
    </span>
  );
}
