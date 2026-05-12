type Props = {
  passed: boolean;
  size?: 'sm' | 'md';
};

// Trace/session-level overall verdict. More visually prominent than the
// per-dimension JudgePill (uppercase, bolder, stronger fill) so reviewers can
// scan a card and immediately see overall PASS/FAIL before scanning the
// per-judge breakdown.
export function OverallVerdictPill({ passed, size = 'md' }: Props) {
  const sizeCls = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-0.5';
  const colorCls = passed
    ? 'bg-success/15 text-success'
    : 'bg-coral/15 text-coral';
  return (
    <span
      className={
        'inline-flex items-center rounded font-bold uppercase tracking-wide ' +
        colorCls +
        ' ' +
        sizeCls
      }
    >
      {passed ? 'PASS' : 'FAIL'}
    </span>
  );
}
