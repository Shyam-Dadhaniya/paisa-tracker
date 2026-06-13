import { useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';

interface Props {
  children: React.ReactNode;
  onDelete: () => void;
}

const THRESHOLD = -96;

/** Swipe-left to reveal & confirm a delete action. Snaps back if released
 *  before the threshold. */
export default function SwipeableRow({ children, onDelete }: Props) {
  const x = useMotionValue(0);
  const haptic = useHaptics();
  const [armed, setArmed] = useState(false);
  const iconOpacity = useTransform(x, [THRESHOLD, -40, 0], [1, 0.6, 0]);
  const iconScale = useTransform(x, [THRESHOLD, -40], [1, 0.7]);

  return (
    <div className="relative">
      {/* Delete affordance behind the row */}
      <motion.div
        style={{ opacity: iconOpacity }}
        className="absolute inset-y-0 right-0 flex items-center pr-5 rounded-2xl bg-danger/15"
      >
        <motion.span style={{ scale: iconScale }} className="text-danger">
          <Trash2 size={22} />
        </motion.span>
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={{ left: 0.4, right: 0 }}
        style={{ x }}
        onDrag={(_, info) => {
          const past = info.offset.x <= THRESHOLD;
          if (past !== armed) {
            setArmed(past);
            haptic('light');
          }
        }}
        onDragEnd={(_, info) => {
          if (info.offset.x <= THRESHOLD) {
            haptic('medium');
            animate(x, -400, { duration: 0.2 }).then(onDelete);
          } else {
            animate(x, 0, { type: 'spring', stiffness: 500, damping: 40 });
          }
          setArmed(false);
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
