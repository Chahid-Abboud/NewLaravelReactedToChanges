import React, { useEffect, useMemo, useState } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import NavHeader from "@/components/NavHeader";

type Exercise = {
  id: number;
  name: string;
  primary_muscle: string;
  equipment?: string | null;
  demo_url?: string | null;
};

type DayDraft = {
  day_index: number;
  title: string;
  exercises: { exercise_id: number; target_sets: number; target_reps: number }[];
};

type PlanDay = {
  day_index: number;
  title?: string | null;
  exercises: {
    id: number;
    name: string;
    primary_muscle: string;
    pivot: { target_sets: number; target_reps: number };
  }[];
};

type Plan = {
  id: number;
  name: string;
  days_per_week: number;
  days: PlanDay[];
} | null;

type Props = { plan: Plan; exercises: Exercise[] };

const MUSCLES = [
  "chest",
  "back",
  "shoulders",
  "legs",
  "glutes",
  "biceps",
  "triceps",
  "core",
  "calves",
];

export default function PlannerPage() {
  const { plan, exercises } = usePage<Props>().props;

  const [daysPerWeek, setDaysPerWeek] = useState<number>(plan?.days_per_week ?? 3);
  const [filter, setFilter] = useState<string>("all");
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Build initial editable state from the server plan once on mount (>=3 days)
  const initialDays: DayDraft[] = useMemo(() => {
    const map = new Map<number, DayDraft>();
    plan?.days?.forEach((d) =>
      map.set(d.day_index, {
        day_index: d.day_index,
        title: d.title ?? "",
        exercises: d.exercises.map((e) => ({
          exercise_id: e.id,
          target_sets: e.pivot?.target_sets ?? 3,
          target_reps: e.pivot?.target_reps ?? 10,
        })),
      })
    );
    const length = Math.max(3, plan?.days_per_week ?? 0); // at least 3 for first render
    return Array.from({ length }, (_, i) =>
      map.get(i + 1) ?? { day_index: i + 1, title: "", exercises: [] }
    );
  }, [plan]);

  const [days, setDays] = useState<DayDraft[]>(initialDays);

  // Keep local days array length in sync with the chosen daysPerWeek
  useEffect(() => {
    setDays((prev) => {
      const arr = [...prev];
      if (arr.length < daysPerWeek) {
        for (let i = arr.length; i < daysPerWeek; i++) {
          arr.push({ day_index: i + 1, title: "", exercises: [] });
        }
      } else if (arr.length > daysPerWeek) {
        arr.length = daysPerWeek;
      }
      return arr;
    });
  }, [daysPerWeek]);

  const addExercise = (dayIdx: number, ex: Exercise) => {
    setDays((prev) =>
      prev.map((d) =>
        d.day_index === dayIdx
          ? {
              ...d,
              exercises: [
                ...d.exercises,
                { exercise_id: ex.id, target_sets: 3, target_reps: 10 },
              ],
            }
          : d
      )
    );
  };

  const removeExercise = (dayIdx: number, i: number) => {
    setDays((prev) =>
      prev.map((d) =>
        d.day_index === dayIdx
          ? { ...d, exercises: d.exercises.filter((_, idx) => idx !== i) }
          : d
      )
    );
  };

  const save = () => {
    setSaving(true);
    setFlash(null);
    setErrors({});

    router.post(
      "/workouts/plan",
      {
        name: plan?.name ?? "My Plan",
        days_per_week: daysPerWeek,
        days,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          router.reload({ only: ["plan"] });
          setFlash("Plan saved!");
        },
        onError: (e) => {
          setErrors(e as any);
        },
        onFinish: () => setSaving(false),
      }
    );
  };

  const lib = useMemo(
    () => (filter === "all" ? exercises : exercises.filter((e) => e.primary_muscle === filter)),
    [exercises, filter]
  );

  return (
    <>
      <Head title="Workout Planner" />
      <NavHeader />

      <main className="mx-auto max-w-6xl p-6 space-y-8">
        {/* Page header */}
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Workout Planner</h1>
          <div className="flex items-center gap-3">
            <label className="text-sm" htmlFor="days-per-week">Days / week</label>
            <input
              id="days-per-week"
              type="number"
              min={1}
              max={7}
              value={daysPerWeek}
              onChange={(e) =>
                setDaysPerWeek(Math.min(7, Math.max(1, Number(e.target.value))))
              }
              className="w-20 border rounded px-2 py-1"
            />
            <button
              type="button"
              onClick={save}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "Saving…" : "Save Plan"}
            </button>
            {flash && (
              <span className="text-sm text-green-700 ml-2" role="status" aria-live="polite">
                {flash}
              </span>
            )}
          </div>
        </header>

        {/* Error banner */}
        {Object.keys(errors).length > 0 && (
          <div
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            role="alert"
            aria-live="assertive"
          >
            There were validation errors while saving. Check your sets/reps and try again.
          </div>
        )}

        {/* Days grid */}
        <section aria-labelledby="days-label" className="grid md:grid-cols-2 gap-6">
          <h2 id="days-label" className="sr-only">Plan days</h2>
          {days.slice(0, daysPerWeek).map((d) => (
            <div key={d.day_index} className="rounded-2xl border p-4 bg-white shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="font-semibold">Day {d.day_index}</div>
                <label className="sr-only" htmlFor={`title-${d.day_index}`}>Title</label>
                <input
                  id={`title-${d.day_index}`}
                  placeholder="Title (e.g., Push)"
                  value={d.title}
                  onChange={(e) =>
                    setDays((prev) =>
                      prev.map((x) =>
                        x.day_index === d.day_index ? { ...x, title: e.target.value } : x
                      )
                    )
                  }
                  className="border rounded px-3 py-1 flex-1"
                />
              </div>

              {/* Selected exercises */}
              <div className="space-y-2">
                {d.exercises.length ? (
                  d.exercises.map((ex, i) => {
                    const ref = exercises.find((e) => e.id === ex.exercise_id);
                    if (!ref) return null;
                    return (
                      <div key={`${ex.exercise_id}-${i}`} className="flex items-center gap-2 border rounded p-2">
                        <div className="flex-1">
                          <div className="font-medium">
                            {ref.name}{" "}
                            <span className="text-xs text-gray-500 capitalize">
                              ({ref.primary_muscle})
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Target: {ex.target_sets}×{ex.target_reps}
                          </div>
                        </div>

                        <label className="sr-only" htmlFor={`sets-${d.day_index}-${i}`}>Target sets</label>
                        <input
                          id={`sets-${d.day_index}-${i}`}
                          type="number"
                          min={1}
                          max={10}
                          value={ex.target_sets}
                          onChange={(e) =>
                            setDays((prev) =>
                              prev.map((x) =>
                                x.day_index === d.day_index
                                  ? {
                                      ...x,
                                      exercises: x.exercises.map((y, j) =>
                                        j === i ? { ...y, target_sets: Number(e.target.value) } : y
                                      ),
                                    }
                                  : x
                              )
                            )
                          }
                          className="w-16 border rounded px-2 py-1"
                        />
                        <span className="text-sm">sets</span>

                        <label className="sr-only" htmlFor={`reps-${d.day_index}-${i}`}>Target reps</label>
                        <input
                          id={`reps-${d.day_index}-${i}`}
                          type="number"
                          min={1}
                          max={30}
                          value={ex.target_reps}
                          onChange={(e) =>
                            setDays((prev) =>
                              prev.map((x) =>
                                x.day_index === d.day_index
                                  ? {
                                      ...x,
                                      exercises: x.exercises.map((y, j) =>
                                        j === i ? { ...y, target_reps: Number(e.target.value) } : y
                                      ),
                                    }
                                  : x
                              )
                            )
                          }
                          className="w-16 border rounded px-2 py-1"
                        />
                        <span className="text-sm">reps</span>

                        <button
                          type="button"
                          onClick={() => removeExercise(d.day_index, i)}
                          className="ml-2 text-sm text-red-600 hover:underline"
                        >
                          remove
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm text-gray-500">
                    No exercises yet. Add from the library below.
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>

        {/* Library */}
        <section className="rounded-2xl border p-4 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Exercise Library</h2>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600" htmlFor="filter-select">Filter:</label>
              <select
                id="filter-select"
                className="border rounded px-2 py-1"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All</option>
                {MUSCLES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {lib?.length ? (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {lib.map((ex) => (
                <div key={ex.id} className="border rounded-xl p-3">
                  <div className="font-medium">{ex.name}</div>
                  <div className="text-xs text-gray-500 capitalize">
                    {ex.primary_muscle} · {ex.equipment ?? "—"}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <label className="sr-only" htmlFor={`add-day-${ex.id}`}>Add to day</label>
                    <select
                      id={`add-day-${ex.id}`}
                      className="border rounded px-2 py-1"
                      onChange={(e) => addExercise(Number(e.target.value), ex)}
                      value=""
                    >
                      <option value="" disabled>
                        Add to day…
                      </option>
                      {days.slice(0, daysPerWeek).map((d) => (
                        <option key={d.day_index} value={d.day_index}>
                          Day {d.day_index}
                        </option>
                      ))}
                    </select>
                    {ex.demo_url && (
                      <a
                        href={ex.demo_url}
                        target="_blank"
                        className="text-xs text-blue-600 hover:underline"
                        rel="noreferrer"
                      >
                        demo
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">
              No exercises in the library. Seed the DB to populate this list.
            </div>
          )}
        </section>
      </main>
    </>
  );
}
