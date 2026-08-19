import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState, type MouseEventHandler, type PointerEventHandler, type ReactNode } from "react";

interface MagneticButtonProps {
  children: ReactNode;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  onPointerMove?: PointerEventHandler<HTMLButtonElement>;
  onPointerLeave?: PointerEventHandler<HTMLButtonElement>;
  tone?: "amber" | "quiet" | "sage" | "coral";
}

export function MagneticButton({ children, className = "", tone = "amber", onPointerMove, onPointerLeave, ...props }: MagneticButtonProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 280, damping: 18 });
  const springY = useSpring(y, { stiffness: 280, damping: 18 });
  const [finePointer, setFinePointer] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(pointer: fine)");
    const update = () => setFinePointer(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return (
    <motion.button
      {...props}
      className={`tether-button tether-button--${tone} ${className}`}
      style={{ x: springX, y: springY }}
      whileTap={{ scale: 0.97 }}
      onPointerMove={(event) => {
        if (finePointer) {
          const bounds = event.currentTarget.getBoundingClientRect();
          x.set((event.clientX - bounds.left - bounds.width / 2) * 0.08);
          y.set((event.clientY - bounds.top - bounds.height / 2) * 0.08);
        }
        onPointerMove?.(event);
      }}
      onPointerLeave={(event) => {
        x.set(0);
        y.set(0);
        onPointerLeave?.(event);
      }}
    >
      {children}
    </motion.button>
  );
}
