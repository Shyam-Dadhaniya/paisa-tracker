interface Props {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

/** Pill-shaped multi-select chip used in filter rows (e.g. PDF export, banks). */
export default function ChipButton({ active, onClick, children }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
        active
          ? 'bg-primary/20 border-primary text-primary'
          : 'bg-surface2 border-border text-muted'
      }`}
    >
      {children}
    </button>
  );
}
