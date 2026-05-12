import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { colors } from '../lib/colors';

type SparkPoint = { day: string; value: number };

type Props = {
  label: string;
  value: string;
  sublabel?: string;
  sparkline?: SparkPoint[];
  subStats?: { label: string; value: string }[];
  formatValue?: (v: number) => string;
};

function defaultFormat(v: number): string {
  // Treat 0-1 as a percentage (matches the pass-rate sparkline values).
  if (v >= 0 && v <= 1) return `${Math.round(v * 100)}%`;
  return String(Math.round(v));
}

function formatDay(day: string): string {
  // Parse ISO date as UTC to avoid timezone shifting the day.
  const d = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return day;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

type TooltipPayload = { payload?: { day?: string; value?: number } };

function SparkTooltip({
  active,
  payload,
  formatValue,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  formatValue: (v: number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point || point.value === undefined || !point.day) return null;
  return (
    <div className="bg-white border border-border rounded px-2 py-1 text-xs text-ink shadow-sm">
      {formatDay(point.day)} · {formatValue(point.value)}
    </div>
  );
}

export function KPITile({ label, value, sublabel, sparkline, subStats, formatValue }: Props) {
  const fmt = formatValue ?? defaultFormat;
  const hasSparkline = sparkline && sparkline.length > 0;

  return (
    <div className="bg-white border border-border rounded-lg p-3 flex flex-col">
      <div className="text-xs text-muted uppercase tracking-wide">{label}</div>
      <div className="mt-1 font-serif text-2xl text-ink leading-tight">{value}</div>
      {subStats && subStats.length > 0 && (
        <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted">
          {subStats.map((s, i) => (
            <span key={s.label} className="flex items-center gap-2">
              {i > 0 && <span className="text-border">·</span>}
              <span>
                {s.label} {s.value}
              </span>
            </span>
          ))}
        </div>
      )}
      {sublabel && <div className="text-xs text-muted mt-1">{sublabel}</div>}
      {hasSparkline && (
        <div className="mt-2 h-[50px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkline} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <Tooltip
                cursor={{ stroke: colors.muted, strokeOpacity: 0.3, strokeWidth: 1 }}
                content={<SparkTooltip formatValue={fmt} />}
                wrapperStyle={{ outline: 'none' }}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="value"
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
