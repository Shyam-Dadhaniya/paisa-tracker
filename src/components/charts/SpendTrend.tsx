import { BarChart, Bar, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { formatINR, formatDate } from '@/utils/format';
import { getThemeColors } from '@/constants/theme';

export interface TrendPoint {
  date: string;
  value: number;
}

interface Props {
  data: TrendPoint[];
  height?: number;
}

function TrendTooltip({ active, payload }: { active?: boolean; payload?: { payload: TrendPoint }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="glass rounded-xl px-3 py-2 shadow-soft text-center">
      <p className="text-[11px] text-muted">{formatDate(p.date, 'd MMM')}</p>
      <p className="text-sm font-semibold tabular-nums">{formatINR(p.value)}</p>
    </div>
  );
}

/** Daily spend over the last N days as bars; tap a bar for its date + amount.
 *  Today (last point) is highlighted. Lazy-loaded (recharts is heavy). */
export default function SpendTrend({ data, height = 96 }: Props) {
  const colors = getThemeColors();
  const lastIdx = data.length - 1;

  return (
    <div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }} tabIndex={-1}>
            <XAxis dataKey="date" hide />
            <YAxis hide domain={[0, 'dataMax']} />
            <Tooltip
              cursor={false}
              wrapperStyle={{ outline: 'none' }}
              content={<TrendTooltip />}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive minPointSize={2}>
              {data.map((d, i) => (
                <Cell
                  key={d.date}
                  fill={colors.primary}
                  fillOpacity={i === lastIdx ? 1 : 0.4}
                  className="cursor-pointer"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between text-[10px] text-muted mt-1.5 px-0.5">
        <span>{data.length ? formatDate(data[0].date, 'd MMM') : ''}</span>
        <span>Today</span>
      </div>
    </div>
  );
}
