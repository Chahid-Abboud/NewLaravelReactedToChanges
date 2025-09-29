/** ---------- Small UI Card WITH progress ---------- */
function StatCard({
  label,
  value,
  consumed,
  target,
  unit,
}: {
  label: string;
  value: string;
  consumed?: number;
  target?: number;
  unit?: "kcal" | "g";
}) {
  const hasTarget = typeof target === "number" && target > 0 && typeof consumed === "number";

  // Percentages like WaterCard
  const rawPct = hasTarget ? (consumed! / Math.max(1, target!)) * 100 : 0;
  const pct = Math.max(0, Math.round(rawPct));
  const basePct = Math.min(100, pct);                 // main bar
  const overflowPct = Math.min(100, Math.max(0, pct - 100)); // overflow strip

  // Simple color logic (feel free to tweak)
  // - under 50%: destructive (red-ish)
  // - 50–80%: accent (teal)
  // - >80%: secondary (green)
  let fillClass = "bg-accent";
  if (pct < 50) fillClass = "bg-destructive";
  else if (pct > 80) fillClass = "bg-secondary";

  return (
    <div className="rounded-xl border border-[#1C2C64]/20 p-4">
      <div className="text-xs uppercase tracking-wide text-[#1C2C64]/70">{label}</div>
      <div className="text-lg font-semibold text-[#1C2C64]">{value}</div>

      {/* progress area */}
      <div className="mt-3">
        {/* Overflow bar (like WaterCard, shown above main bar) */}
        {hasTarget && overflowPct > 0 && (
          <div className="mb-1">
            <div className="h-1.5 w-full rounded bg-muted">
              <div
                className="h-1.5 rounded bg-amber-500"
                style={{ width: `${overflowPct}%`, transition: "width 300ms ease" }}
                role="progressbar"
                aria-label={`${label} overflow`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={overflowPct}
              />
            </div>
            <div className="mt-1 text-[11px] leading-none text-amber-600">+{overflowPct}%</div>
          </div>
        )}

        {/* Main bar */}
        <div className="h-2 w-full rounded bg-muted">
          <div
            className={`h-2 rounded ${hasTarget ? fillClass : "bg-muted"}`}
            style={{ width: hasTarget ? `${basePct}%` : "0%", transition: "width 300ms ease" }}
            role="progressbar"
            aria-label={`${label} progress`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={hasTarget ? basePct : undefined}
          />
        </div>

        {/* Caption */}
        <div className="mt-1 text-[11px] text-[#1C2C64]/70">
          {hasTarget
            ? `${Math.round(consumed!)} ${unit} / ${Math.round(target!)} ${unit} (${pct}%)`
            : `No target provided for ${label.toLowerCase()}.`}
        </div>
      </div>
    </div>
  );
}
