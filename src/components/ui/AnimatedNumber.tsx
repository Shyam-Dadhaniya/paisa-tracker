import { useCountUp } from '@/hooks/useCountUp';

interface Props {
  /** The numeric value to animate to. */
  value: number;
  /** Formats the (animated) number for display, e.g. formatINR. */
  format: (n: number) => string;
  duration?: number;
  className?: string;
}

/** Count-up animated number. Pass a formatter so currency/decimals render
 *  correctly throughout the tween. */
export default function AnimatedNumber({ value, format, duration, className }: Props) {
  const animated = useCountUp(value, duration);
  // Round during the tween to avoid a jittering decimal tail, but render the
  // exact value once settled so currency precision (paise) is preserved.
  const display = animated === value ? value : Math.round(animated);
  return <span className={`tabular-nums ${className ?? ''}`}>{format(display)}</span>;
}
