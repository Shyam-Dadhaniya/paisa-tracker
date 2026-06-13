import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface Props {
  /** Big emoji / glyph shown in the gradient halo. */
  emoji: string;
  title: string;
  subtitle?: string;
  cta?: { label: string; to: string };
}

/** Friendly illustrated empty state with an optional call-to-action. */
export default function EmptyState({ emoji, title, subtitle, cta }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center text-center px-6 py-12"
    >
      <div className="relative mb-4">
        <div className="absolute inset-0 bg-brand-gradient blur-2xl opacity-30 rounded-full" />
        <div className="relative w-20 h-20 rounded-3xl glass flex items-center justify-center text-4xl">
          {emoji}
        </div>
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {subtitle && <p className="text-sm text-muted mt-1 max-w-[16rem]">{subtitle}</p>}
      {cta && (
        <Link
          to={cta.to}
          className="mt-5 inline-flex items-center bg-brand-gradient text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-soft active:scale-95 transition"
        >
          {cta.label}
        </Link>
      )}
    </motion.div>
  );
}
