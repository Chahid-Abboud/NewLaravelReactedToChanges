// resources/js/components/ElasticSlider.tsx
import React, { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { motion, useMotionValue, useSpring, animate } from "framer-motion";

type Props = {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  label?: string;
  formatValue?: (v: number) => string;
  className?: string;
  /** Height of the bar (px) */
  height?: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function ElasticSlider({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  formatValue = (v) => String(v),
  className = "",
  height = 12,
}: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  // position in pixels of the thumb relative to track
  const x = useMotionValue(0);
  const xSpring = useSpring(x, { stiffness: 400, damping: 30, mass: 0.3 });

  // squish effect while dragging
  const squish = useMotionValue(1);
  const squishSpring = useSpring(squish, { stiffness: 300, damping: 20 });

  // compute percentage based on value
  const pct = useMemo(() => (value - min) / (max - min), [value, min, max]);

  // when value changes from the outside, animate the thumb to that spot
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const w = track.clientWidth;
    const target = clamp(pct * w, 0, w);
    animate(x, target, { type: "spring", stiffness: 400, damping: 30, mass: 0.3 });
  }, [pct, x]);

  // pointer → value mapping
  function pixelToValue(clientX: number) {
    const track = trackRef.current;
    if (!track) return value;
    const rect = track.getBoundingClientRect();
    const rel = clamp(clientX - rect.left, 0, rect.width);
    const raw = min + (rel / rect.width) * (max - min);
    // round to step
    const stepped = Math.round(raw / step) * step;
    return clamp(stepped, min, max);
  }

  // pointer handlers
  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    squish.set(1.15); // squish a bit
    onChange(pixelToValue(e.clientX));
  }
  function onPointerMove(e: React.PointerEvent) {
    if (e.buttons !== 1) return; // only while pressed
    onChange(pixelToValue(e.clientX));
  }
  function onPointerUp() {
    squish.set(1); // relax
  }

  // keyboard accessibility
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") onChange(clamp(value - step, min, max));
    if (e.key === "ArrowRight") onChange(clamp(value + step, min, max));
    if (e.key === "Home") onChange(min);
    if (e.key === "End") onChange(max);
  }

  return (
    <div className={`select-none ${className}`}>
      {label && <div className="mb-1 text-sm font-medium">{label}</div>}

      <div
        ref={trackRef}
        className="relative w-full rounded-full bg-muted"
        style={{ height }}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* progress fill */}
        <motion.div
          className="absolute left-0 top-0 rounded-full bg-[#1C2C64]"
          style={{ width: xSpring, height }}
        />

        {/* thumb */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 rounded-full shadow"
          style={{
            x: xSpring,
            width: height * 2,
            height: height * 2,
            marginLeft: -(height), // center over x
            background: "#e11d48", // thumb color
            scaleY: squishSpring, // elastic feel
            scaleX: squishSpring,
          }}
        />

        {/* value bubble */}
        <motion.div
          className="absolute -top-8 rounded-md border bg-background px-2 py-0.5 text-xs"
          style={{ x: xSpring, translateX: "-50%" }}
        >
          {formatValue(value)}
        </motion.div>
      </div>
    </div>
  );
}
