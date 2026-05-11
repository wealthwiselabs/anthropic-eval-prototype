import type { JudgeDimension } from '../types';

const LABELS: Record<JudgeDimension, string> = {
  'tool-use': 'Tool-use',
  safety: 'Safety',
  faithfulness: 'Faithful.',
  'task-completion': 'Task',
};

// Tailwind-only color classes per dimension. Keep both bg + text in one token
// so consumers can't accidentally split them and end up with unreadable pills.
const BG: Record<JudgeDimension, string> = {
  'tool-use': 'bg-node-agent text-ink',
  safety: 'bg-node-classify text-ink',
  faithfulness: 'bg-node-subagent text-ink',
  'task-completion': 'bg-node-skill text-ink',
};

const VERDICT_BORDER: Record<NonNullable<JudgePillProps['verdict']>, string> = {
  pass: 'border-transparent',
  partial: 'border-coral/40',
  fail: 'border-coral',
};

type JudgePillProps = {
  dimension: JudgeDimension;
  verdict?: 'pass' | 'partial' | 'fail';
  size?: 'sm' | 'md';
};

export function JudgePill({ dimension, verdict, size = 'md' }: JudgePillProps) {
  const sizeCls = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';
  const borderCls = verdict ? VERDICT_BORDER[verdict] : 'border-transparent';
  return (
    <span
      className={
        'inline-flex items-center rounded border font-medium tracking-tight ' +
        BG[dimension] +
        ' ' +
        borderCls +
        ' ' +
        sizeCls
      }
    >
      {LABELS[dimension]}
    </span>
  );
}
