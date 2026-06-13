import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  open: boolean;
  onClose: () => void;
  side?: 'bottom' | 'right';
  children: React.ReactNode;
  className?: string;
}

const BOTTOM_VARIANTS = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
};

const RIGHT_VARIANTS = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
};

export default function BaseSheet({ open, onClose, side = 'bottom', children, className }: Props) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const variants = side === 'right' ? RIGHT_VARIANTS : BOTTOM_VARIANTS;
  const baseClass = side === 'right'
    ? 'fixed top-0 right-0 bottom-0 w-72 z-50 glass rounded-l-2xl flex flex-col shadow-elevated'
    : 'fixed left-0 right-0 bottom-0 z-50 glass rounded-t-3xl flex flex-col shadow-elevated max-w-md mx-auto';

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            className={`${baseClass} ${className ?? ''}`}
            initial={variants.initial}
            animate={variants.animate}
            exit={variants.exit}
            transition={{ type: 'spring', damping: 32, stiffness: 360 }}
          >
            {side === 'bottom' && (
              <div className="flex justify-center pt-2.5 pb-1 shrink-0">
                <span className="w-9 h-1.5 rounded-full bg-muted/40" />
              </div>
            )}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
