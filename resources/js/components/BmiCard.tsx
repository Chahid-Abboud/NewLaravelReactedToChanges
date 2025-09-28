import React from "react";
import { Link } from "@inertiajs/react";

type Profile = { height_cm: number; weight_kg: number };
type Props = {
  isGuest: boolean;
  profile?: Profile; // undefined when not enough data
  /** Optional: show skeleton while data loads */
  loading?: boolean;
};

function round1(x: number) {
  return Math.round(x * 10) / 10;
}

type BmiCatKey = "under" | "normal" | "over" | "obese";

function category(bmi: number): { key: BmiCatKey; label: string; hint: string } {
  if (bmi < 18.5) return { key: "under",  label: "Underweight", hint: "Aim to gain safely." };
  if (bmi < 25)   return { key: "normal", label: "Normal",      hint: "Great—keep it up!" };
  if (bmi < 30)   return { key: "over",   label: "Overweight",  hint: "Small changes help." };
  return { key: "obese", label: "Obesity", hint: "Consider a tailored plan." };
}

/** Color classes per category (kept token-first; one amber utility used for 'over') */
const CAT_FILL_CLASS: Record<BmiCatKey, string> = {
  under:  "bg-accent",         // hydration teal
  normal: "bg-secondary",      // leafy green
  over:   "bg-amber-500",      // warning amber (the only non-token)
  obese:  "bg-destructive",    // health alert red/orange
};
const CAT_TEXT_CLASS: Record<BmiCatKey, string> = {
  under:  "text-accent",
  normal: "text-secondary",
  over:   "text-amber-600",
  obese:  "text-destructive",
};

function Progress({
  bmi,
  categoryKey,
}: {
  bmi: number;
  categoryKey: BmiCatKey;
}) {
  // visualize on a 15–40 scale
  const min = 15, max = 40;
  const clamped = Math.max(min, Math.min(max, bmi));
  const pct = ((clamped - min) / (max - min)) * 100;

  // Track gradient (green → yellow → red). Works in light/dark equally well.
  const trackGradient =
    "linear-gradient(90deg, #2F9E66 0%, #E5B700 55%, #D64545 100%)";

  const fillClass = CAT_FILL_CLASS[categoryKey];

  return (
    <div className="mt-3" aria-label="BMI progress">
      {/* Track */}
      <div
        className="h-2 w-full rounded bg-muted"
        style={{ backgroundImage: trackGradient, backgroundSize: "100% 100%" }}
      >
        {/* Fill */}
        <div
          className={`h-2 rounded ${fillClass}`}
          style={{ width: `${pct}%`, transition: "width 300ms ease" }}
          role="progressbar"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={Number(clamped.toFixed(1))}
          aria-label="BMI position"
        />
      </div>

      {/* Scale marks */}
      <div className="text-xs text-muted-foreground mt-1 flex justify-between tabular-nums">
        <span>15</span><span>20</span><span>25</span><span>30</span><span>35</span><span>40</span>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-baseline gap-3">
        <div className="h-8 w-16 rounded bg-muted" />
        <div className="h-4 w-24 rounded bg-muted" />
      </div>
      <div className="mt-3 h-2 w-full rounded bg-muted" />
      <div className="mt-2 h-3 w-48 rounded bg-muted" />
    </div>
  );
}

export default function BmiCard({ isGuest, profile, loading }: Props) {
  if (loading) {
    return <Skeleton />;
  }

  if (!profile || !profile.height_cm || !profile.weight_kg) {
    return (
      <div className="text-muted-foreground">
        {isGuest ? (
          <>Sign in to calculate your BMI.</>
        ) : (
          <>
            Add your height &amp; weight to see your BMI.{" "}
            <Link href="/profile" className="text-accent hover:underline">
              Update profile
            </Link>
          </>
        )}
      </div>
    );
  }

  const height_m = profile.height_cm / 100;
  if (!isFinite(height_m) || height_m <= 0) {
    return <div className="text-muted-foreground">Height looks invalid.</div>;
  }

  const bmi = round1(profile.weight_kg / (height_m * height_m));
  if (!isFinite(bmi) || bmi <= 0) {
    return <div className="text-muted-foreground">Weight looks invalid.</div>;
  }

  const { key, label, hint } = category(bmi);

  return (
    <div>
      <div className="flex items-baseline gap-3">
        <div className="text-3xl font-bold">{bmi}</div>
        <div className={`text-sm ${CAT_TEXT_CLASS[key]}`}>{label}</div>
      </div>

      <Progress bmi={bmi} categoryKey={key} />

      <div className="text-xs text-muted-foreground mt-2">{hint}</div>
    </div>
  );
}
