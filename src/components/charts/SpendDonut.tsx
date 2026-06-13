import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { formatINR } from '@/utils/format';

export interface DonutSlice {
  id: string;
  label: string;
  value: number;
  color: string;
}

interface Props {
  data: DonutSlice[];
  total: number;
  /** Small caption under the total, e.g. "spent in June". */
  caption?: string;
}

/** Monthly-spend donut with a centered total. Lazy-loaded (recharts is heavy). */
export default function SpendDonut({ data, total, caption }: Props) {
  return (
    <div className="relative w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius="68%"
            outerRadius="100%"
            paddingAngle={data.length > 1 ? 3 : 0}
            startAngle={90}
            endAngle={-270}
            stroke="none"
            cornerRadius={6}
            isAnimationActive
          >
            {data.map((s) => (
              <Cell key={s.id} fill={s.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <p className="text-3xl font-bold tabular-nums text-gradient">{formatINR(total)}</p>
        {caption && <p className="text-xs text-muted mt-1">{caption}</p>}
      </div>
    </div>
  );
}
