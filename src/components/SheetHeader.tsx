import { X } from 'lucide-react';

interface Props {
  title: React.ReactNode;
  onClose: () => void;
}

/** Standard bottom/right sheet header: title on the left, close (X) on the right. */
export default function SheetHeader({ title, onClose }: Props) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
      <h2 className="text-base font-semibold">{title}</h2>
      <button
        onClick={onClose}
        className="p-1.5 rounded-lg text-muted active:scale-90 transition"
        aria-label="Close"
      >
        <X size={20} />
      </button>
    </div>
  );
}
