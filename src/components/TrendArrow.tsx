import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type Trend = 'up-spike' | 'up-steady' | 'flat' | 'down';

const COPY: Record<Trend, string> = {
  'up-spike': '3-day spike',
  'up-steady': 'steady rise',
  flat: 'flat',
  down: 'declining',
};

const COLOR: Record<Trend, string> = {
  'up-spike': 'text-coral',
  'up-steady': 'text-coral/80',
  flat: 'text-muted',
  down: 'text-ink/60',
};

export function TrendArrow({ trend }: { trend: Trend }) {
  const Icon = trend === 'flat' ? Minus : trend === 'down' ? TrendingDown : TrendingUp;
  return (
    <span className={'inline-flex items-center gap-1 text-xs ' + COLOR[trend]}>
      <Icon className="w-3.5 h-3.5" />
      {COPY[trend]}
    </span>
  );
}
