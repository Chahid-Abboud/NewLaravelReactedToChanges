// resources/js/components/ElasticSlider.tsx
import React, { useLayoutEffect, useMemo, useRef } from "react";
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

// 🔒 Hard cap for radius slider (10 km)
const HARD_MAX = 10000;

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

  const effectiveMin = min;
  const effectiveMax = Math.min(max, HARD_MAX);

  // position in pixels of the thumb relative to track
  const x = useMotionValue(0);
  const xSpring = useSpring(x, { stiffness: 400, damping: 30, mass: 0.3 });

  // squish effect while dragging
  const squish = useMotionValue(1);
  const squishSpring = useSpring(squish, { stiffness: 300, damping: 20 });

  const pct = useMemo(
    () => (value - effectiveMin) / (effectiveMax - effectiveMin),
    [value, effectiveMin, effectiveMax]
  );

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
    const raw = effectiveMin + (rel / rect.width) * (effectiveMax - effectiveMin);
    const stepped = Math.round(raw / step) * step;
    return clamp(stepped, effectiveMin, effectiveMax);
  }

  // pointer handlers
  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    squish.set(1.15);
    onChange(pixelToValue(e.clientX));
  }
  function onPointerMove(e: React.PointerEvent) {
    if (e.buttons !== 1) return;
    onChange(pixelToValue(e.clientX));
  }
  function onPointerUp() {
    squish.set(1);
  }

  // keyboard accessibility
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") onChange(clamp(value - step, effectiveMin, effectiveMax));
    if (e.key === "ArrowRight") onChange(clamp(value + step, effectiveMin, effectiveMax));
    if (e.key === "Home") onChange(effectiveMin);
    if (e.key === "End") onChange(effectiveMax);
  }

  return (
    <div className={`select-none ${className}`}>
      {label && <div className="mb-1 text-sm font-medium">{label}</div>}

      <div
        ref={trackRef}
        className="relative w-full rounded-full bg-slate-200/70 dark:bg-slate-800/70"
        style={{ height }}
        role="slider"
        aria-valuemin={effectiveMin}
        aria-valuemax={effectiveMax}
        aria-valuenow={Math.min(value, effectiveMax)}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* progress fill — same palette as header: navy → teal */}
        <motion.div
          className="absolute left-0 top-0 rounded-full bg-gradient-to-r from-[#1C2C64] to-teal-600"
          style={{ width: xSpring, height }}
        />

        {/* thumb — white pill with navy ring */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 rounded-full shadow-md ring-2 ring-[#1C2C64] bg-white"
          style={{
            x: xSpring,
            width: height * 2,
            height: height * 2,
            marginLeft: -height, // center over x
            scaleY: squishSpring,
            scaleX: squishSpring,
          }}
        />

        {/* value bubble — navy chip with white text */}
        <motion.div
          className="absolute -top-8 rounded-md border border-white/10 bg-[#1C2C64] px-2 py-0.5 text-xs text-white"
          style={{ x: xSpring, translateX: "-50%" }}
        >
          {formatValue(Math.min(value, effectiveMax))}
        </motion.div>
      </div>
    </div>
  );
}
