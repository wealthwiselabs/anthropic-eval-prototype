import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { colors } from '../lib/colors';

type Props = {
  label: string;
  value: string;
  sublabel?: string;
  sparkline?: { day: string; rate: number }[];
};

export function KPITile({ label, value, sublabel, sparkline }: Props) {
  return (
    <div className="bg-white border border-border rounded-lg p-4 flex flex-col">
      <div className="text-xs text-muted uppercase tracking-wide">{label}</div>
      <div className="mt-1 font-serif text-3xl text-ink leading-tight">{value}</div>
      {sublabel && <div className="text-xs text-muted mt-1">{sublabel}</div>}
      {sparkline && (
        <div className="mt-3 h-16">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkline} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <Line
                type="monotone"
                dataKey="rate"
                stroke={colors.coral}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
