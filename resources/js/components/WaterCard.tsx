import React from "react";

type Props = {
  isGuest: boolean;
  water: { today_ml: number; target_ml: number };
  onQuickAdd?: (ml: number) => void;
  loading?: boolean;
};

function Skeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 w-40 bg-muted rounded" />
      <div className="h-2 w-full bg-muted rounded" />
      <div className="h-4 w-12 bg-muted rounded" />
      <div className="flex gap-2">
        <div className="h-8 w-16 bg-muted rounded-lg" />
        <div className="h-8 w-16 bg-muted rounded-lg" />
        <div className="h-8 w-16 bg-muted rounded-lg" />
      </div>
    </div>
  );
}

export default function WaterCard({ isGuest, water, onQuickAdd, loading }: Props) {
  if (loading) return <Skeleton />;

  const rawPct = (water.today_ml / Math.max(1, water.target_ml)) * 100;
  const pct = Math.max(0, Math.round(rawPct));         // total percentage (can exceed 100)
  const basePct = Math.min(100, pct);                  // fills main bar up to 100
  const overflowPct = Math.min(100, Math.max(0, pct - 100)); // part shown in overflow bar

  // Base bar color by hydration level
  let fillClass = "bg-accent"; // default teal
  if (pct < 50) fillClass = "bg-destructive"; // red under 50%
  else if (pct > 80) fillClass = "bg-secondary"; // green near goal

  return (
    <div>
      <div className="text-sm text-muted-foreground">
        Today: <span className="font-semibold text-foreground">{water.today_ml}</span> /{" "}
        {water.target_ml} ml
      </div>

      {/* progress */}
      <div className="mt-3">
        {/* Overflow bar (appears ABOVE main bar) */}
        {overflowPct > 0 && (
          <div className="mb-1">
            <div className="h-1.5 w-full rounded bg-muted">
              <div
                className="h-1.5 rounded bg-amber-500"
                style={{ width: `${overflowPct}%`, transition: "width 300ms ease" }}
                role="progressbar"
                aria-label="Water overflow"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={overflowPct}
              />
            </div>
            <div className="mt-1 text-[11px] leading-none text-amber-600">
              +{overflowPct}%
            </div>
          </div>
        )}

        {/* Main bar (0–100%) */}
        <div className="h-2 w-full rounded bg-muted">
          <div
            className={`h-2 rounded ${fillClass}`}
            style={{ width: `${basePct}%`, transition: "width 300ms ease" }}
            role="progressbar"
            aria-label="Water progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={basePct}
          />
        </div>

        <div className="text-xs text-muted-foreground mt-1">{pct}%</div>
      </div>

      {!isGuest && onQuickAdd && (
        <div className="flex gap-2 mt-4">
          {[250, 500, 750].map((ml) => (
            <button
              key={ml}
              onClick={() => onQuickAdd(ml)}
              className="px-3 py-1 rounded-lg bg-accent text-accent-foreground font-medium shadow hover:opacity-90 transition"
            >
              +{ml} ml
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
