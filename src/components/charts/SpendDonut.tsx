import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { formatINR } from '@/utils/format';
import { useHaptics } from '@/hooks/useHaptics';

export interface DonutSlice {
  id: string;
  label: string;
  value: number;
  color: string;
}

export interface ActiveInfo {
  label: string;
  value: number;
  pct: number;
}

interface Props {
  slices: DonutSlice[];
  total: number;
  /** Small caption under the total, e.g. "spent in June". */
  caption?: string;
  /** Currently inspected slice id, or null for the month total. */
  activeId: string | null;
  /** Details for the active selection (computed from full stats by the parent). */
  activeInfo: ActiveInfo | null;
  onSelect: (id: string) => void;
}

/** Monthly-spend donut. Tap a slice to inspect that category in the center.
 *  Lazy-loaded (recharts is heavy). */
export default function SpendDonut({ slices, total, caption, activeId, activeInfo, onSelect }: Props) {
  const haptic = useHaptics();

  return (
    <div className="relative w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart tabIndex={-1}>
          <Pie
            data={slices}
            dataKey="value"
            nameKey="label"
            innerRadius="74%"
            outerRadius="100%"
            paddingAngle={slices.length > 1 ? 3 : 0}
            startAngle={90}
            endAngle={-270}
            stroke="none"
            cornerRadius={6}
            isAnimationActive
            onClick={(d: { id?: string }) => {
              if (d?.id) {
                haptic('light');
                onSelect(d.id);
              }
            }}
          >
            {slices.map((s) => (
              <Cell
                key={s.id}
                fill={s.color}
                fillOpacity={activeId && activeId !== s.id ? 0.3 : 1}
                className="cursor-pointer transition-opacity"
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2 pointer-events-none">
        {activeInfo ? (
          <div className="max-w-[64%] leading-tight">
            <p className="text-sm text-muted truncate">{activeInfo.label}</p>
            <p className="text-2xl font-bold tabular-nums">{formatINR(activeInfo.value)}</p>
            <p className="text-xs text-muted">{activeInfo.pct}% of month</p>
          </div>
        ) : (
          <div className="max-w-[60%] leading-tight">
            <p className="text-2xl font-bold tabular-nums text-gradient">{formatINR(total)}</p>
            {caption && <p className="text-xs text-muted mt-1">{caption}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
