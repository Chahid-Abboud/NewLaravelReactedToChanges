import React from "react";

type Props = {
  isGuest: boolean;
  water: { today_ml: number; target_ml: number };
  onQuickAdd?: (ml: number) => void;
};

export default function WaterCard({ isGuest, water, onQuickAdd }: Props) {
  const pct = Math.min(
    100,
    Math.round((water.today_ml / Math.max(1, water.target_ml)) * 100)
  );

  return (
    <div>
      <div className="text-sm text-gray-600">
        Today: <span className="font-semibold">{water.today_ml}</span> / {water.target_ml} ml
      </div>

      {/* progress */}
      <div className="mt-3">
        <div className="h-2 w-full rounded bg-gray-200">
          <div className="h-2 rounded bg-green-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-xs text-gray-500 mt-1">{pct}%</div>
      </div>

      {!isGuest && onQuickAdd && (
        <div className="flex gap-2 mt-4">
          {[250, 500, 750].map((ml) => (
            <button
              key={ml}
              onClick={() => onQuickAdd(ml)}
              className="px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              +{ml} ml
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
