import React, { useMemo, useState } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import NavHeader from "@/components/NavHeader";

type UserProfile = {
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  gender: string | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
};

type Prefs = {
  dietary_goal: string | null;
  fitness_goals: string[];
  diet_type: string | null;
  diet_other: string | null;
  allergies: string[];
} | null;

type Measurement = {
  date: string; // YYYY-MM-DD
  type: "weight" | "height";
  value: number; // kg or cm
};

type PageProps = {
  displayName: string;
  userProfile: UserProfile;
  prefs: Prefs;
  dietName: string;
  weightHistory?: Measurement[];
  heightHistory?: Measurement[];
};

const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
    {children}
  </span>
);

const FITNESS_GOAL_OPTIONS = [
  "Lose fat",
  "Build muscle",
  "Increase strength",
  "Improve endurance",
  "General health",
] as const;

const GENDER_OPTIONS = ["male", "female", "other", "prefer not to say"] as const;

const DIET_TYPES = [
  { value: "balanced", label: "Balanced" },
  { value: "high_protein", label: "High Protein" },
  { value: "low_carb", label: "Low Carb" },
  { value: "mediterranean", label: "Mediterranean" },
  { value: "keto", label: "Keto" },
  { value: "vegan", label: "Vegan" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "other", label: "Other" },
] as const;

export default function ProfileShow() {
  const {
    displayName,
    userProfile,
    prefs,
    dietName,
    weightHistory = [],
    heightHistory = [],
  } = usePage<PageProps>().props;

  // ---- Local editable state
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingPrefs, setEditingPrefs] = useState(false);

  const [firstName, setFirstName] = useState(userProfile.first_name ?? "");
  const [lastName, setLastName] = useState(userProfile.last_name ?? "");
  const [username, setUsername] = useState(userProfile.username ?? "");
  const [gender, setGender] = useState<string>(userProfile.gender ?? "");
  const [age, setAge] = useState<number | string>(userProfile.age ?? "");

  const [dietType, setDietType] = useState<string>(prefs?.diet_type ?? "");
  const [dietOther, setDietOther] = useState<string>(prefs?.diet_other ?? "");
  const [dietaryGoal, setDietaryGoal] = useState<string>(prefs?.dietary_goal ?? "");
  const [fitnessGoals, setFitnessGoals] = useState<string[]>(
    Array.isArray(prefs?.fitness_goals) ? prefs!.fitness_goals : []
  );
  const [allergies, setAllergies] = useState<string[]>(
    Array.isArray(prefs?.allergies) ? prefs!.allergies : []
  );
  const [newAllergy, setNewAllergy] = useState("");

  // measurements
  const [mDate, setMDate] = useState<string>("");
  const [mType, setMType] = useState<"weight" | "height">("weight");
  const [mValue, setMValue] = useState<string>("");

  const dietTypeLabel = useMemo(() => {
    const labelFromType =
      DIET_TYPES.find((d) => d.value === (prefs?.diet_type ?? ""))?.label ?? null;
    return labelFromType ?? dietName ?? "—";
  }, [prefs, dietName]);

  // ---- Actions
  const saveProfile = () => {
    const ageNum = typeof age === "string" && age !== "" ? Number(age) : age;
    router.post(
      "/profile/update",
      {
        first_name: firstName || null,
        last_name: lastName || null,
        username: username || null,
        gender: gender || null,
        age: ageNum === "" ? null : Number(ageNum),
      },
      {
        preserveScroll: true,
        onSuccess: () => setEditingProfile(false),
      }
    );
  };

  const savePrefs = () => {
    router.post(
      "/profile/prefs",
      {
        diet_type: dietType || null,
        diet_other: dietType === "other" ? (dietOther || null) : null,
        dietary_goal: dietaryGoal || null,
        fitness_goals: fitnessGoals,
        allergies,
      },
      {
        preserveScroll: true,
        onSuccess: () => setEditingPrefs(false),
      }
    );
  };

  const addAllergy = () => {
    const a = newAllergy.trim();
    if (!a) return;
    if (allergies.includes(a)) return;
    setAllergies((prev) => [...prev, a]);
    setNewAllergy("");
  };

  const removeAllergy = (a: string) => {
    setAllergies((prev) => prev.filter((x) => x !== a));
  };

  const addMeasurement = () => {
    const valueNum = Number(mValue);
    if (!mDate || !valueNum || valueNum <= 0) return;
    router.post(
      "/profile/measurements",
      { date: mDate, type: mType, value: valueNum },
      {
        preserveScroll: true,
        onSuccess: () => {
          setMDate("");
          setMValue("");
          // Reload only the pieces the controller returns (supported by the controller we wrote)
          router.reload({ only: ["weightHistory", "heightHistory", "userProfile"] });
        },
      }
    );
  };

  return (
    <>
      <Head title="Profile — Hayetak" />
      <NavHeader />

      <main className="mx-auto max-w-5xl px-4 py-6 grid gap-4">
        {/* Welcome / actions */}
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Welcome {displayName}, this is your profile</h2>
          <p className="text-sm text-gray-500">
            Review and update your info, preferences, and measurements.
          </p>
        </section>

        {/* Profile snapshot + edit */}
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Your profile snapshot</h3>
            <button
              type="button"
              onClick={() => setEditingProfile((v) => !v)}
              className="text-sm text-blue-600 hover:underline"
            >
              {editingProfile ? "Cancel" : "Edit"}
            </button>
          </div>

          {!editingProfile ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-xs text-gray-500">Name</div>
                <div>
                  {(userProfile.first_name ?? "")} {(userProfile.last_name ?? "")}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Username</div>
                <div>{userProfile.username || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Gender</div>
                <div>{userProfile.gender || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Age</div>
                <div>{typeof userProfile.age === "number" ? userProfile.age : "—"}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Height</div>
                <div>
                  {typeof userProfile.height_cm === "number" ? `${userProfile.height_cm} cm` : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Weight</div>
                <div>
                  {typeof userProfile.weight_kg === "number" ? `${userProfile.weight_kg} kg` : "—"}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs text-gray-500" htmlFor="firstName">
                  First name
                </label>
                <input
                  id="firstName"
                  className="mt-1 w-full border rounded px-3 py-2"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500" htmlFor="lastName">
                  Last name
                </label>
                <input
                  id="lastName"
                  className="mt-1 w-full border rounded px-3 py-2"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500" htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  className="mt-1 w-full border rounded px-3 py-2"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500" htmlFor="gender">
                  Gender
                </label>
                <select
                  id="gender"
                  className="mt-1 w-full border rounded px-3 py-2"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">—</option>
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500" htmlFor="age">
                  Age
                </label>
                <input
                  id="age"
                  type="number"
                  min={0}
                  className="mt-1 w-full border rounded px-3 py-2"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={saveProfile}
                  className="rounded-lg border px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700"
                >
                  Save profile
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Goals & prefs (view + edit) */}
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Your goals and preferences</h3>
            <button
              type="button"
              onClick={() => setEditingPrefs((v) => !v)}
              className="text-sm text-blue-600 hover:underline"
            >
              {editingPrefs ? "Cancel" : "Edit"}
            </button>
          </div>

          {!editingPrefs ? (
            prefs ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-xs text-gray-500">Dietary goal</div>
                  <div>{prefs.dietary_goal || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Diet type</div>
                  <div>{dietTypeLabel}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Fitness goals</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {prefs.fitness_goals?.length
                      ? prefs.fitness_goals.map((fg, i) => <Badge key={i}>{fg}</Badge>)
                      : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Allergies</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {prefs.allergies?.length
                      ? prefs.allergies.map((al, i) => <Badge key={i}>{al}</Badge>)
                      : "—"}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-500">No preferences saved yet.</p>
            )
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs text-gray-500" htmlFor="dietaryGoal">
                  Dietary goal
                </label>
                <input
                  id="dietaryGoal"
                  className="mt-1 w-full border rounded px-3 py-2"
                  value={dietaryGoal}
                  onChange={(e) => setDietaryGoal(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500" htmlFor="dietType">
                  Diet type
                </label>
                <select
                  id="dietType"
                  className="mt-1 w-full border rounded px-3 py-2"
                  value={dietType}
                  onChange={(e) => setDietType(e.target.value)}
                >
                  <option value="">—</option>
                  {DIET_TYPES.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {dietType === "other" && (
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-500" htmlFor="dietOther">
                    Diet type (other)
                  </label>
                  <input
                    id="dietOther"
                    className="mt-1 w-full border rounded px-3 py-2"
                    value={dietOther}
                    onChange={(e) => setDietOther(e.target.value)}
                  />
                </div>
              )}

              <div className="sm:col-span-2">
                <div className="text-xs text-gray-500">Fitness goals</div>
                <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {FITNESS_GOAL_OPTIONS.map((g) => {
                    const checked = fitnessGoals.includes(g);
                    return (
                      <label key={g} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setFitnessGoals((prev) =>
                              e.target.checked ? [...prev, g] : prev.filter((x) => x !== g)
                            )
                          }
                        />
                        <span>{g}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="sm:col-span-2">
                <div className="text-xs text-gray-500">Allergies</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {allergies.length ? (
                    allergies.map((a) => (
                      <span
                        key={a}
                        className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs"
                      >
                        {a}
                        <button
                          type="button"
                          className="ml-2 text-red-600 hover:underline"
                          onClick={() => removeAllergy(a)}
                          aria-label={`Remove ${a}`}
                        >
                          ×
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">—</span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    className="flex-1 border rounded px-3 py-2"
                    placeholder="Add an allergy (e.g., peanuts)"
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addAllergy();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addAllergy}
                    className="rounded border px-3 py-2 text-sm"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={savePrefs}
                  className="rounded-lg border px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700"
                >
                  Save preferences
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Measurements (height / weight by date) */}
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold">Measurements</h3>

          <div className="mt-3 grid gap-3 sm:grid-cols-[10rem,10rem,1fr,auto]">
            <div>
              <label className="text-xs text-gray-500" htmlFor="mdate">
                Date
              </label>
              <input
                id="mdate"
                type="date"
                className="mt-1 w-full border rounded px-3 py-2"
                value={mDate}
                onChange={(e) => setMDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500" htmlFor="mtype">
                Type
              </label>
              <select
                id="mtype"
                className="mt-1 w-full border rounded px-3 py-2"
                value={mType}
                onChange={(e) => setMType(e.target.value as "weight" | "height")}
              >
                <option value="weight">Weight (kg)</option>
                <option value="height">Height (cm)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500" htmlFor="mvalue">
                Value
              </label>
              <input
                id="mvalue"
                type="number"
                inputMode="decimal"
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder={mType === "weight" ? "e.g., 72" : "e.g., 175"}
                value={mValue}
                onChange={(e) => setMValue(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={addMeasurement}
                className="w-full rounded-lg border px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border p-3">
              <div className="font-medium">Recent Weight (kg)</div>
              {weightHistory.length ? (
                <ul className="mt-2 space-y-1 text-sm">
                  {weightHistory.slice(-6).reverse().map((m, i) => (
                    <li key={`w-${i}`} className="flex justify-between">
                      <span>{m.date}</span>
                      <span className="tabular-nums">{m.value}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-2 text-sm text-gray-500">No entries yet.</div>
              )}
            </div>
            <div className="rounded-xl border p-3">
              <div className="font-medium">Recent Height (cm)</div>
              {heightHistory.length ? (
                <ul className="mt-2 space-y-1 text-sm">
                  {heightHistory.slice(-6).reverse().map((m, i) => (
                    <li key={`h-${i}`} className="flex justify-between">
                      <span>{m.date}</span>
                      <span className="tabular-nums">{m.value}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-2 text-sm text-gray-500">No entries yet.</div>
              )}
            </div>
          </div>
        </section>

        <footer className="px-1 py-2 text-xs text-gray-500">
          Data is read from your database via Laravel. React escapes output by default.
        </footer>
      </main>
    </>
  );
}
