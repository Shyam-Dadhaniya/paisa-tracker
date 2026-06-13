import { useId } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import { getThemeColors } from '@/constants/theme';

export interface TrendPoint {
  date: string;
  value: number;
}

interface Props {
  data: TrendPoint[];
  height?: number;
}

/** Compact spend-trend area chart. Lazy-loaded (recharts is heavy). */
export default function TrendSparkline({ data, height = 64 }: Props) {
  const colors = getThemeColors();
  const gradId = useId();

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.gradVia} stopOpacity={0.4} />
              <stop offset="100%" stopColor={colors.gradVia} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={[0, 'dataMax']} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={colors.primary}
            strokeWidth={2}
            fill={`url(#${gradId})`}
            isAnimationActive
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
