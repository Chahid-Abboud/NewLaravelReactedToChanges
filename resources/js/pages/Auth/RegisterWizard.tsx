import React, { useEffect, useMemo, useState } from "react";
import { Head, useForm } from "@inertiajs/react";

type Props = {
  dietOptions?: string[];
  allergyOptions?: string[];
  fitnessGoals?: string[];
  dietaryGoals?: string[];
};

type Gender = "male" | "female" | "other" | "";

/* ---------- Step 2 fallbacks (used if props not provided) ---------- */
const FALLBACK_DIETS = [
  "Mediterranean", "Keto", "Paleo", "Vegan", "Vegetarian",
  "DASH", "Low-Carb", "High-Protein", "Intermittent Fasting", "Whole30",
];

const FALLBACK_ALLERGIES = [
  "Peanuts","Tree Nuts","Milk","Eggs","Wheat","Soy","Fish","Shellfish","Sesame","Gluten",
  "Mustard","Celery","Lupin","Sulphites","Corn","Gelatin","Coconut","Kiwi","Banana","Avocado",
  "Tomato","Strawberry","Chocolate","Garlic","Onion",
];

const FALLBACK_FITNESS = [
  "Lose Weight","Maintain","Build Muscle","Improve Endurance","Recomposition",
];

const FALLBACK_DIETARY_GOALS = [
  "Calorie Deficit","Maintenance","Calorie Surplus","Balanced Nutrition",
];

/* ---------------- Numeric helpers ---------------- */
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const computeTotalSteps = (tried: "yes" | "no" | "") => (tried === "yes" ? 5 : 4);

// allow free typing; strip invalid chars. For decimals, keep at most one dot
function sanitizeNumericLoose(raw: string, allowDecimal = false) {
  let s = raw.replace(allowDecimal ? /[^0-9.]/g : /[^0-9]/g, "");
  if (allowDecimal) {
    const firstDot = s.indexOf(".");
    if (firstDot !== -1) {
      const head = s.slice(0, firstDot + 1);
      const tail = s.slice(firstDot + 1).replace(/\./g, "");
      s = head + tail;
    }
  }
  return s;
}

// clamp & format on blur (not while typing)
function clampAndFormat(
  str: string,
  { min, max, allowDecimal = false }: { min: number; max: number; allowDecimal?: boolean }
) {
  let cleaned = str.trim();
  if (allowDecimal && cleaned.startsWith(".")) cleaned = "0" + cleaned; // ".5" -> "0.5"
  if (cleaned === "" || cleaned === "." || cleaned === "0.") return "";

  const n = Number(cleaned);
  if (Number.isNaN(n)) return "";

  const clamped = clamp(n, min, max);
  if (allowDecimal) return String(Number(clamped.toFixed(2))); // up to 2 decimals
  return String(Math.round(clamped));
}

function preventNonNumericKeys(e: React.KeyboardEvent<HTMLInputElement>, allowDecimal = false) {
  const blocked = ["e", "E", "+", "-"];
  if (!allowDecimal) blocked.push(".");
  if (blocked.includes(e.key)) e.preventDefault();
}

export default function RegisterWizard(props: Props) {
  // Use fallbacks whenever arrays are missing/empty
  const dietOptions =
    props.dietOptions && props.dietOptions.length ? props.dietOptions : FALLBACK_DIETS;
  const allergyOptions =
    props.allergyOptions && props.allergyOptions.length ? props.allergyOptions : FALLBACK_ALLERGIES;
  const fitnessGoals =
    props.fitnessGoals && props.fitnessGoals.length ? props.fitnessGoals : FALLBACK_FITNESS;
  const dietaryGoals =
    props.dietaryGoals && props.dietaryGoals.length ? props.dietaryGoals : FALLBACK_DIETARY_GOALS;

  const [step, setStep] = useState<number>(1);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  const { data, setData, post, processing, errors, transform } = useForm({
    // Basic
    first_name: "",
    last_name: "",
    username: "",
    gender: "" as Gender,
    age: "" as string,
    height_cm: "" as string,
    weight_kg: "" as string,

    // Medical history
    has_medical_history: false,
    medical_history: "",

    // Goals
    dietary_goal: "",
    fitness_goal: "",
    diet_name: "",
    allergies: [] as string[],

    // Diet experience
    tried_diet_before: "" as "yes" | "no" | "",
    diet_failure_reasons: [] as string[],
    diet_failure_other: "",

    // Credentials
    email: "",
    password: "",
    password_confirmation: "",
  });

  const totalSteps = useMemo(
    () => computeTotalSteps(data.tried_diet_before),
    [data.tried_diet_before]
  );

  // Prevent blank page if totalSteps shrinks
  useEffect(() => {
    if (step > totalSteps) setStep(totalSteps);
  }, [totalSteps, step]);

  const reasons = [
    "Too restrictive","Hunger/low energy","Social/lifestyle conflicts","Too expensive","Time/meal prep burden",
    "Lack of results","Medical reasons","Travel/routine changes","Cravings","Confusing guidance",
  ];

  const back = () => setStep((s) => Math.max(1, s - 1));
  const next = () => {
    if (!validateStep(step)) return;
    const tSteps = computeTotalSteps(data.tried_diet_before);
    if (step === 3 && data.tried_diet_before === "no") {
      setStep(tSteps); // jump to credentials if skipping the conditional step
    } else {
      setStep((s) => Math.min(s + 1, tSteps));
    }
  };

  const submit = () => {
    if (!validateStep(totalSteps)) return;
    // cast numeric strings just before submit (avoids TS2353)
    transform((d) => ({
      ...d,
      age: d.age ? Number(d.age) : null,
      height_cm: d.height_cm ? Number(d.height_cm) : null,
      weight_kg: d.weight_kg ? Number(d.weight_kg) : null,
    }));
    post("/register");
  };

  // Numeric change/blur wrappers
  const onNumericChange =
    <K extends keyof typeof data>(key: K, allowDecimal = false) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = sanitizeNumericLoose(e.target.value, allowDecimal);
      setData(key, val as any);
    };

  const onNumericBlur =
    <K extends keyof typeof data>(key: K, opts: { min: number; max: number; allowDecimal?: boolean }) =>
    () => {
      const current = String(data[key] ?? "");
      const formatted = clampAndFormat(current, opts);
      setData(key, formatted as any);
    };

  function validateStep(s: number) {
    const ce: Record<string, string> = {};

    if (s === 1) {
      if (!data.first_name || String(data.first_name).trim().length < 2)
        ce.first_name = "Please enter at least 2 characters.";
      if (!data.last_name || String(data.last_name).trim().length < 2)
        ce.last_name = "Please enter at least 2 characters.";

      if (data.username) {
        if (!/^[A-Za-z0-9_.]+$/.test(data.username))
          ce.username = "Only letters, numbers, underscore and dot are allowed.";
        if (data.username.length > 24)
          ce.username = "Username must be ≤ 24 characters.";
      }

      const ageNum = Number(data.age);
      if (!ageNum || ageNum < 13 || ageNum > 100)
        ce.age = "Age must be between 13 and 100.";

      const hNum = Number(data.height_cm);
      if (!hNum || hNum < 80 || hNum > 250)
        ce.height_cm = "Height must be between 80 and 250 cm.";

      const wNum = Number(data.weight_kg);
      if (!wNum || wNum < 25 || wNum > 400)
        ce.weight_kg = "Weight must be between 25 and 400 kg.";

      if (!data.gender) ce.gender = "Please select a gender.";

      if (data.has_medical_history && !data.medical_history.trim()) {
        ce.medical_history = "Please describe your medical history.";
      }
    }

    if (s === 2) {
      if (!data.dietary_goal) ce.dietary_goal = "Select a dietary goal.";
      if (!data.fitness_goal) ce.fitness_goal = "Select a fitness goal.";
      if (!data.diet_name) ce.diet_name = "Select or type a diet.";
      if (data.diet_name === "Other" && data.diet_name.trim() === "Other")
        ce.diet_name = "Please type your diet name after choosing Other.";
    }

    if (s === 3) {
      if (!data.tried_diet_before) ce.tried_diet_before = "Please choose Yes or No.";
    }

    if (s === 4 && data.tried_diet_before === "yes") {
      if (data.diet_failure_reasons.length === 0 && !data.diet_failure_other.trim()) {
        ce.diet_failure_reasons = "Pick at least one reason or fill in Other.";
      }
      if (data.diet_failure_other.length > 120)
        ce.diet_failure_other = "Keep the 'Other' reason under 120 characters.";
    }

    if (s === totalSteps) {
      if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
        ce.email = "Enter a valid email address.";
      if (!data.password || data.password.length < 8)
        ce.password = "Password must be at least 8 characters.";
      if (data.password !== data.password_confirmation)
        ce.password_confirmation = "Passwords do not match.";
    }

    setClientErrors(ce);
    return Object.keys(ce).length === 0;
  }

  const showServerOrClientError = (field: string) =>
    clientErrors[field] || (errors as any)[field];

  const prog = useMemo(
    () => Array.from({ length: totalSteps }, (_, i) => i + 1),
    [totalSteps]
  );

  return (
    <>
      <Head title="Create your account" />
      <div className="mx-auto max-w-3xl p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Create your Hayetak account</h1>

        {/* Progress */}
        <div className="flex gap-2">
          {prog.map((i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded ${i <= step ? "bg-[#1C2C64]" : "bg-gray-200"}`}
              aria-label={`Step ${i} of ${totalSteps}`}
            />
          ))}
        </div>

        {/* Step 1: Basic */}
        {step === 1 && (
          <section className="space-y-4">
            <h2 className="text-lg font-medium">Basic Information</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm">First name</label>
                <input
                  className="w-full rounded border px-3 py-2"
                  value={data.first_name}
                  maxLength={40}
                  onChange={(e) => setData("first_name", e.target.value)}
                />
                {showServerOrClientError("first_name") && (
                  <p className="text-sm text-red-600">{showServerOrClientError("first_name")}</p>
                )}
              </div>

              <div>
                <label className="block text-sm">Last name</label>
                <input
                  className="w-full rounded border px-3 py-2"
                  value={data.last_name}
                  maxLength={40}
                  onChange={(e) => setData("last_name", e.target.value)}
                />
                {showServerOrClientError("last_name") && (
                  <p className="text-sm text-red-600">{showServerOrClientError("last_name")}</p>
                )}
              </div>

              <div>
                <label className="block text-sm">Username (optional, unique)</label>
                <input
                  className="w-full rounded border px-3 py-2"
                  value={data.username}
                  maxLength={24}
                  placeholder="letters, numbers, _ or ."
                  pattern="^[A-Za-z0-9_.]+$"
                  onChange={(e) => setData("username", e.target.value)}
                />
                {showServerOrClientError("username") && (
                  <p className="text-sm text-red-600">{showServerOrClientError("username")}</p>
                )}
              </div>

              <div>
                <label className="block text-sm">Gender</label>
                <select
                  className="w-full rounded border px-3 py-2"
                  value={data.gender}
                  onChange={(e) => setData("gender", e.target.value as Gender)}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {showServerOrClientError("gender") && (
                  <p className="text-sm text-red-600">{showServerOrClientError("gender")}</p>
                )}
              </div>

              {/* numeric text inputs (no arrows) */}
              <div>
                <label className="block text-sm">Age</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full rounded border px-3 py-2"
                  placeholder="e.g. 20"
                  value={data.age}
                  onKeyDown={(e) => preventNonNumericKeys(e, false)}
                  onChange={onNumericChange("age", false)}
                  onBlur={onNumericBlur("age", { min: 13, max: 100 })}
                />
                {showServerOrClientError("age") && (
                  <p className="text-sm text-red-600">{showServerOrClientError("age")}</p>
                )}
              </div>

              <div>
                <label className="block text-sm">Height (cm)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full rounded border px-3 py-2"
                  placeholder="e.g. 180"
                  value={data.height_cm}
                  onKeyDown={(e) => preventNonNumericKeys(e, false)}
                  onChange={onNumericChange("height_cm", false)}
                  onBlur={onNumericBlur("height_cm", { min: 80, max: 250 })}
                />
                {showServerOrClientError("height_cm") && (
                  <p className="text-sm text-red-600">{showServerOrClientError("height_cm")}</p>
                )}
              </div>

              <div>
                <label className="block text-sm">Weight (kg)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9.]*"
                  className="w-full rounded border px-3 py-2"
                  placeholder="e.g. 72.5"
                  value={data.weight_kg}
                  onKeyDown={(e) => preventNonNumericKeys(e, true)}
                  onChange={onNumericChange("weight_kg", true)}
                  onBlur={onNumericBlur("weight_kg", { min: 25, max: 400, allowDecimal: true })}
                />
                {showServerOrClientError("weight_kg") && (
                  <p className="text-sm text-red-600">{showServerOrClientError("weight_kg")}</p>
                )}
              </div>

              {/* Medical history */}
              <div className="md:col-span-2 space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={data.has_medical_history}
                    onChange={(e) => setData("has_medical_history", e.target.checked)}
                  />
                <span>I have a medical history relevant to diet/exercise</span>
                </label>
                {data.has_medical_history && (
                  <div>
                    <textarea
                      className="min-h-[90px] w-full rounded border px-3 py-2"
                      placeholder="Briefly list conditions (e.g., diabetes, thyroid, injuries)..."
                      maxLength={500}
                      value={data.medical_history}
                      onChange={(e) => setData("medical_history", e.target.value)}
                    />
                    {showServerOrClientError("medical_history") && (
                      <p className="text-sm text-red-600">{showServerOrClientError("medical_history")}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button className="rounded bg-[#1C2C64] px-4 py-2 text-white" onClick={next}>
                Next
              </button>
            </div>
          </section>
        )}

        {/* Step 2: Goals & Dietary */}
        {step === 2 && (
          <section className="space-y-4">
            <h2 className="text-lg font-medium">Goals & Dietary</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm">Dietary Goal</label>
                <select
                  className="w-full rounded border px-3 py-2"
                  value={data.dietary_goal}
                  onChange={(e) => setData("dietary_goal", e.target.value)}
                >
                  <option value="">Select</option>
                  {dietaryGoals.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                {showServerOrClientError("dietary_goal") && (
                  <p className="text-sm text-red-600">{showServerOrClientError("dietary_goal")}</p>
                )}
              </div>

              <div>
                <label className="block text-sm">Fitness Goal</label>
                <select
                  className="w-full rounded border px-3 py-2"
                  value={data.fitness_goal}
                  onChange={(e) => setData("fitness_goal", e.target.value)}
                >
                  <option value="">Select</option>
                  {fitnessGoals.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                {showServerOrClientError("fitness_goal") && (
                  <p className="text-sm text-red-600">{showServerOrClientError("fitness_goal")}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm">Diet</label>
                <div className="mb-2 flex flex-wrap gap-2">
                  {dietOptions.map((d) => (
                    <button
                      type="button"
                      key={d}
                      className={`rounded border px-3 py-1 ${data.diet_name === d ? "bg-[#1C2C64] text-white" : ""}`}
                      onClick={() => setData("diet_name", d)}
                    >
                      {d}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`rounded border px-3 py-1 ${data.diet_name === "Other" ? "bg-[#1C2C64] text-white" : ""}`}
                    onClick={() => setData("diet_name", "Other")}
                  >
                    Other
                  </button>
                </div>
                {data.diet_name === "Other" && (
                  <input
                    placeholder="Type your diet name"
                    className="w-full rounded border px-3 py-2"
                    maxLength={40}
                    onChange={(e) => setData("diet_name", e.target.value)}
                  />
                )}
                {showServerOrClientError("diet_name") && (
                  <p className="text-sm text-red-600">{showServerOrClientError("diet_name")}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm">Allergies (multi-select)</label>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {allergyOptions.map((a) => {
                    const active = data.allergies.includes(a);
                    return (
                      <label
                        key={a}
                        className={`flex items-center gap-2 rounded border px-3 py-2 ${active ? "bg-gray-100" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={(e) => {
                            if (e.target.checked) setData("allergies", [...data.allergies, a]);
                            else setData("allergies", data.allergies.filter((x) => x !== a));
                          }}
                        />
                        <span>{a}</span>
                      </label>
                    );
                  })}
                </div>
                {showServerOrClientError("allergies") && (
                  <p className="text-sm text-red-600">{showServerOrClientError("allergies")}</p>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <button className="rounded border px-4 py-2" onClick={back}>Back</button>
              <button className="rounded bg-[#1C2C64] px-4 py-2 text-white" onClick={next}>Next</button>
            </div>
          </section>
        )}

        {/* Step 3: Tried diet before? */}
        {step === 3 && (
          <section className="space-y-4">
            <h2 className="text-lg font-medium">Have you tried any dietary plans before?</h2>
            <div className="flex gap-3">
              {(["yes", "no"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`rounded border px-4 py-2 capitalize ${data.tried_diet_before === opt ? "bg-[#1C2C64] text-white" : ""}`}
                  onClick={() => setData("tried_diet_before", opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
            {showServerOrClientError("tried_diet_before") && (
              <p className="text-sm text-red-600">{showServerOrClientError("tried_diet_before")}</p>
            )}

            <div className="flex justify-between">
              <button className="rounded border px-4 py-2" onClick={back}>Back</button>
              <button className="rounded bg-[#1C2C64] px-4 py-2 text-white" onClick={next}>Next</button>
            </div>
          </section>
        )}

        {/* Step 4: Why didn’t it work? (conditional) */}
        {step === 4 && data.tried_diet_before === "yes" && (
          <section className="space-y-4">
            <h2 className="text-lg font-medium">Why didn’t it work out for you?</h2>
            <p className="text-sm text-gray-600">Select all that apply</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {reasons.map((r) => {
                const checked = data.diet_failure_reasons.includes(r);
                return (
                  <label
                    key={r}
                    className={`flex items-center gap-2 rounded border px-3 py-2 ${checked ? "bg-gray-100" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked)
                          setData("diet_failure_reasons", [...data.diet_failure_reasons, r]);
                        else
                          setData("diet_failure_reasons", data.diet_failure_reasons.filter((x) => x !== r));
                      }}
                    />
                    <span>{r}</span>
                  </label>
                );
              })}
            </div>

            <div>
              <label className="block text-sm">Other (optional)</label>
              <input
                className="w-full rounded border px-3 py-2"
                maxLength={120}
                placeholder="Your reason"
                value={data.diet_failure_other}
                onChange={(e) => setData("diet_failure_other", e.target.value)}
              />
              {showServerOrClientError("diet_failure_reasons") && (
                <p className="text-sm text-red-600">{showServerOrClientError("diet_failure_reasons")}</p>
              )}
              {showServerOrClientError("diet_failure_other") && (
                <p className="text-sm text-red-600">{showServerOrClientError("diet_failure_other")}</p>
              )}
            </div>

            <div className="flex justify-between">
              <button className="rounded border px-4 py-2" onClick={back}>Back</button>
              <button className="rounded bg-[#1C2C64] px-4 py-2 text-white" onClick={next}>Next</button>
            </div>
          </section>
        )}

        {/* Step 5 (or 4 if skipped): Credentials */}
        {step === totalSteps && (
          <section className="space-y-4">
            <h2 className="text-lg font-medium">Login Details</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm">Email</label>
                <input
                  type="email"
                  className="w-full rounded border px-3 py-2"
                  value={data.email}
                  maxLength={120}
                  inputMode="email"
                  placeholder="you@example.com"
                  onChange={(e) => setData("email", e.target.value.trim())}
                />
                {showServerOrClientError("email") && (
                  <p className="text-sm text-red-600">{showServerOrClientError("email")}</p>
                )}
              </div>

              <div>
                <label className="block text-sm">Password</label>
                <input
                  type="password"
                  className="w-full rounded border px-3 py-2"
                  value={data.password}
                  maxLength={72}
                  onChange={(e) => setData("password", e.target.value)}
                  placeholder="At least 8 characters"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use 8+ characters. Adding numbers & symbols helps.
                </p>
                {showServerOrClientError("password") && (
                  <p className="text-sm text-red-600">{showServerOrClientError("password")}</p>
                )}
              </div>

              <div>
                <label className="block text-sm">Confirm Password</label>
                <input
                  type="password"
                  className="w-full rounded border px-3 py-2"
                  value={data.password_confirmation}
                  maxLength={72}
                  onChange={(e) => setData("password_confirmation", e.target.value)}
                />
                {showServerOrClientError("password_confirmation") && (
                  <p className="text-sm text-red-600">
                    {showServerOrClientError("password_confirmation")}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <button className="rounded border px-4 py-2" onClick={back}>Back</button>
              <button
                className="rounded bg-[#1C2C64] px-4 py-2 text-white disabled:opacity-50"
                disabled={processing}
                onClick={submit}
              >
                Create Account
              </button>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
