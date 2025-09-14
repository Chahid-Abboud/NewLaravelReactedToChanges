import React from "react";
import { Link } from "@inertiajs/react";

type Profile = { height_cm: number; weight_kg: number };
type Props = {
  isGuest: boolean;
  profile?: Profile; // undefined when not enough data
};

function round1(x: number) {
  return Math.round(x * 10) / 10;
}

function category(bmi: number) {
  if (bmi < 18.5) return { label: "Underweight", hint: "Aim to gain safely." };
  if (bmi < 25)   return { label: "Normal",      hint: "Great—keep it up!" };
  if (bmi < 30)   return { label: "Overweight",  hint: "Small changes help." };
  return { label: "Obesity",     hint: "Consider a tailored plan." };
}

function Progress({ bmi }: { bmi: number }) {
  // visualize on a 15–40 scale
  const min = 15, max = 40;
  const clamped = Math.max(min, Math.min(max, bmi));
  const pct = ((clamped - min) / (max - min)) * 100;
  return (
    <div className="mt-3">
      <div className="h-2 w-full rounded bg-gray-200">
        <div className="h-2 rounded bg-blue-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs text-gray-500 mt-1 flex justify-between">
        <span>15</span><span>20</span><span>25</span><span>30</span><span>35</span><span>40</span>
      </div>
    </div>
  );
}

export default function BmiCard({ isGuest, profile }: Props) {
  if (!profile || !profile.height_cm || !profile.weight_kg) {
    return (
      <div className="text-gray-600">
        {isGuest ? (
          <>Sign in to calculate your BMI.</>
        ) : (
          <>
            Add your height & weight to see your BMI.{" "}
            <Link href="/profile" className="text-blue-600 hover:underline">Update profile</Link>
          </>
        )}
      </div>
    );
  }

  const height_m = profile.height_cm / 100;
  if (!isFinite(height_m) || height_m <= 0) {
    return <div className="text-gray-600">Height looks invalid.</div>;
  }

  const bmi = round1(profile.weight_kg / (height_m * height_m));
  if (!isFinite(bmi) || bmi <= 0) {
    return <div className="text-gray-600">Weight looks invalid.</div>;
  }

  const { label, hint } = category(bmi);

  return (
    <div>
      <div className="flex items-baseline gap-3">
        <div className="text-3xl font-bold">{bmi}</div>
        <div className="text-sm text-gray-600">{label}</div>
      </div>
      <Progress bmi={bmi} />
      <div className="text-xs text-gray-500 mt-2">{hint}</div>
    </div>
  );
}
