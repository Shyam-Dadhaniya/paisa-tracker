import type { UseFormRegisterReturn } from 'react-hook-form';
import { formatDate, formatTime } from '@/utils/format';

interface Props {
  date: string;
  time: string;
  registerDate: UseFormRegisterReturn<'date'>;
  registerTime: UseFormRegisterReturn<'time'>;
}

export default function DateTimePicker({ date, time, registerDate, registerTime }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-xs text-muted uppercase tracking-wider mb-2 block">Date</label>
        <div className="relative w-full">
          <div className="w-full bg-surface border border-border rounded-xl px-3 py-3 pointer-events-none select-none">
            {date ? formatDate(date, 'd MMM yyyy') : 'Select date'}
          </div>
          <input
            {...registerDate}
            type="date"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-muted uppercase tracking-wider mb-2 block">Time</label>
        <div className="relative w-full">
          <div className="w-full bg-surface border border-border rounded-xl px-3 py-3 pointer-events-none select-none">
            {time ? formatTime(time) : 'Select time'}
          </div>
          <input
            {...registerTime}
            type="time"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onClick={(e) => {
              try { (e.currentTarget as HTMLInputElement & { showPicker(): void }).showPicker(); } catch { /* iOS */ }
            }}
          />
        </div>
      </div>
    </div>
  );
}
