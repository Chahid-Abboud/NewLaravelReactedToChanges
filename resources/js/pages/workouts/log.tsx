import React, { useRef, useState } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import NavHeader from "@/components/NavHeader";

type Exercise = { id:number; name:string; primary_muscle:string; demo_url?:string|null };
type Day = { id:number; day_index:number; title?:string|null; exercises: Exercise[] } | null;
type Plan = { id:number; name:string; days: Day[] } | null;

type WorkoutLogSet = {
  id:number;
  exercise:{id:number; name:string};
  weight_kg:number|null;
  reps:number;
  set_number:number;
};

type WorkoutLog = {
  id:number;
  workout_date:string;
  sets: WorkoutLogSet[];
  workout_plan_day_id?: number | null;
};

type Props = {
  plan: Plan;
  currentDay: Day | null;
  today: string;
  recentLogs: WorkoutLog[];
  flash?: { activeLogId?: number };
};

const fmtDate = (iso: string) => {
  try { return new Date(iso).toLocaleDateString(); } catch { return iso; }
};

// Group sets by exercise name to render a compact digest
function groupSetsByExercise(sets: WorkoutLogSet[]) {
  const map = new Map<string, WorkoutLogSet[]>();
  for (const s of sets) {
    const key = s.exercise?.name ?? "Exercise";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  for (const [, arr] of map) arr.sort((a,b)=>a.set_number-b.set_number);
  return Array.from(map.entries());
}

export default function LogPage() {
  const { plan, currentDay, today, recentLogs, flash } = usePage<Props>().props;

  const latestLog = recentLogs?.[0];

  // active log id to write sets into (assigned after first Add Set)
  const activeLogIdRef = useRef<number | undefined>(
    flash?.activeLogId ?? latestLog?.id
  );

  // Day picker state
  const [isPickerOpen, setPickerOpen] = useState(false);
  const [pickedDayId, setPickedDayId] = useState<number | "none">(
    (currentDay?.id as number) ?? "none"
  );

  // Local inputs per exercise
  const [weights, setWeights] = useState<Record<number, string>>({});
  const [reps, setReps] = useState<Record<number, string>>({});
  const [status, setStatus] = useState<string | null>(null);

  // Local start + saving state
  const [startedLocally, setStartedLocally] = useState(false);
  const [saving, setSaving] = useState(false);

  // Which day to render
// BEFORE
// const dayForForm: Day | null =
//   (pickedDayId !== "none" && plan?.days?.find(d => d?.id === pickedDayId)) ?? currentDay ?? null;

// AFTER
const dayForForm: Day | null = pickedDayId !== "none"
  ? (plan?.days?.find(d => d?.id === pickedDayId) ?? null)
  : (currentDay ?? null);


  // Sets in current server log for an exercise (sorted)
  const setsForExercise = (exerciseId:number) =>
    (latestLog?.sets || [])
      .filter(s => s.exercise?.id === exerciseId)
      .sort((a,b)=>a.set_number-b.set_number);

  const openStartDialog = () => {
    setPickerOpen(true);
    setPickedDayId((currentDay?.id as number) ?? "none");
  };
  const confirmStart = () => {
    setPickerOpen(false);
    setStartedLocally(true);
  };

  // After we create the workout, grab new id then run cb
  const afterStartedEnsureId = (cb: (newLogId:number) => void) => {
    router.reload({
      only: ["recentLogs","flash"],
      onSuccess: () => {
        const props = (usePage() as any).props as Props;
        const fromFlash = props.flash?.activeLogId;
        const fromRecent = props.recentLogs?.[0]?.id;
        const id = fromFlash ?? fromRecent;
        if (!id) return setStatus("Could not determine new workout ID.");
        activeLogIdRef.current = id;
        cb(id);
      },
    });
  };

  const createWorkoutIfNeeded = (after?: (newLogId:number) => void) => {
    if (activeLogIdRef.current) return after?.(activeLogIdRef.current);
    router.post(
      "/workouts/log/start",
      {
        workout_date: today,
        workout_plan_day_id: pickedDayId === "none" ? null : pickedDayId,
      },
      { onSuccess: () => afterStartedEnsureId((id) => after?.(id)) }
    );
  };

  const addSet = (exerciseId:number) => {
    setStatus(null);
    const w = weights[exerciseId];
    const r = reps[exerciseId];
    const repsNum = r ? Number(r) : NaN;
    const weightNum = w?.length ? Number(w) : null;

    if (!repsNum || repsNum <= 0) return setStatus("Please enter reps (>0).");
    if (w && isNaN(Number(w))) return setStatus("Weight must be a number (or leave empty for bodyweight).");

    const send = (logId:number) => {
      const next = (setsForExercise(exerciseId).slice(-1)[0]?.set_number ?? 0) + 1;
      router.post(
        `/workouts/log/${logId}/add-set`,
        { exercise_id: exerciseId, set_number: next, weight_kg: weightNum, reps: repsNum },
        {
          preserveScroll: true,
          onSuccess: () => {
            setWeights((prev) => ({ ...prev, [exerciseId]: "" }));
            setReps((prev) => ({ ...prev, [exerciseId]: "" }));
            setStatus("Set added.");
            router.reload({ only: ["recentLogs"] });
          },
        }
      );
    };

    createWorkoutIfNeeded((id) => send(id));
  };

  const saveWorkout = () => {
    const id = activeLogIdRef.current;
    if (!id) return setStatus("You haven’t added any sets yet. Add at least one set before saving.");
    const hasAnySets = !!(recentLogs?.[0]?.sets?.length);
    if (!hasAnySets) return setStatus("Your workout has no sets yet. Add at least one set before saving.");

    setSaving(true);
    router.post(
      `/workouts/log/${id}/finish`,
      { duration_min: null, notes: null },
      {
        onSuccess: () => {
          setStatus("Workout saved — great job!");
          router.reload({ only: ["recentLogs","plan","currentDay"] });
        },
        onFinish: () => setSaving(false),
      }
    );
  };

  const recentNonEmpty = (recentLogs || []).filter(l => (l.sets?.length ?? 0) > 0);

  return (
    <>
      <Head title="Workout Log" />

      {/* ✅ Shared sticky header */}
      <NavHeader />

      <main className="mx-auto max-w-6xl px-6 py-8 space-y-10">
        <div aria-live="polite" className="sr-only">{status ?? ""}</div>

        {/* Hero row */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Workout Log</h1>
          <button
            onClick={openStartDialog}
            className="px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700"
            aria-label="Start today's workout"
          >
            Start Today’s Workout
          </button>
        </div>

        {/* Start picker (inline) */}
        {isPickerOpen && (
          <section className="rounded-2xl border p-4 bg-white shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="font-medium">Choose plan day for {fmtDate(today)}:</div>
              <label className="sr-only" htmlFor="day-picker">Workout day</label>
              <select
                id="day-picker"
                className="border rounded px-2 py-1"
                value={pickedDayId === "none" ? "" : pickedDayId}
                onChange={(e) => setPickedDayId(e.target.value ? Number(e.target.value) : "none")}
              >
                <option value="">No plan (freestyle)</option>
                {plan?.days?.filter(Boolean).map((d) => (
                  <option key={d!.id} value={d!.id}>
                    Day {d!.day_index}{d!.title ? ` · ${d!.title}` : ""}
                  </option>
                ))}
              </select>
              <div className="md:ml-auto flex items-center gap-2">
                <button onClick={() => setPickerOpen(false)} className="px-3 py-1.5 rounded border">Cancel</button>
                <button onClick={confirmStart} className="px-3 py-1.5 rounded bg-green-600 text-white">Start</button>
              </div>
            </div>
          </section>
        )}

        {/* Today quick logger */}
        <section className="rounded-2xl border p-6 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Today</h2>
            <div className="text-sm text-gray-500">{fmtDate(today)}</div>
          </div>

          {(startedLocally && dayForForm?.exercises?.length) ? (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                {dayForForm.exercises.map((ex) => {
                  const prevSets = setsForExercise(ex.id);
                  const last = prevSets.slice(-1)[0];
                  const weightValue =
                    weights[ex.id] ?? (last?.weight_kg != null ? String(last.weight_kg) : "");

                  return (
                    <div key={ex.id} className="rounded-xl border p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold">{ex.name}</div>
                          <div className="text-xs text-gray-500 capitalize">{ex.primary_muscle}</div>
                        </div>
                        {ex.demo_url && (
                          <a href={ex.demo_url} target="_blank" className="text-xs text-blue-600 hover:underline" rel="noreferrer">
                            demo
                          </a>
                        )}
                      </div>

                      {/* Inputs for adding a new set */}
                      <div className="mt-3 grid grid-cols-[6rem,6rem,auto] items-end gap-2">
                        <div>
                          <label htmlFor={`w-${ex.id}`} className="text-xs text-gray-600">Weight (kg)</label>
                          <input
                            id={`w-${ex.id}`}
                            type="number"
                            inputMode="decimal"
                            placeholder="kg"
                            className="mt-1 border rounded px-3 py-1 w-full"
                            value={weightValue}
                            onChange={(e) => setWeights((p) => ({ ...p, [ex.id]: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label htmlFor={`r-${ex.id}`} className="text-xs text-gray-600">Reps</label>
                          <input
                            id={`r-${ex.id}`}
                            type="number"
                            inputMode="numeric"
                            placeholder="reps"
                            className="mt-1 border rounded px-3 py-1 w-full"
                            value={reps[ex.id] ?? ""}
                            onChange={(e) => setReps((p) => ({ ...p, [ex.id]: e.target.value }))}
                          />
                        </div>
                        <div className="flex">
                          <button
                            onClick={() => addSet(ex.id)}
                            className="ml-auto px-3 py-2 rounded bg-gray-900 text-white"
                          >
                            Add Set
                          </button>
                        </div>
                      </div>

                      {/* Existing sets (from server) */}
                      {prevSets.length ? (
                        <div className="mt-3 text-sm space-y-1">
                          {prevSets.map((s) => (
                            <div key={s.id} className="flex justify-between">
                              <div className="text-gray-600">Set {s.set_number}</div>
                              <div className="tabular-nums">{s.weight_kg ?? "BW"} kg × {s.reps}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-3 text-sm text-gray-400">No sets yet.</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Save workout (finish) */}
              <div className="mt-6 flex items-center justify-end">
                <button
                  disabled={saving}
                  onClick={saveWorkout}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save Workout"}
                </button>
              </div>
            </>
          ) : (
            <div className="text-gray-600">
              No workout plan chosen for today yet. Click{" "}
              <button className="text-blue-600 hover:underline" onClick={openStartDialog}>
                Start Today’s Workout
              </button>{" "}
              to pick a plan day, or{" "}
              <a className="text-blue-600 hover:underline" href="/workouts/plan">
                open Planner
              </a>
              .
            </div>
          )}
        </section>

        {/* Your plan snapshot */}
        <section className="rounded-2xl border p-6 bg-white shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Your Plan</h2>
          {plan?.days?.length ? (
            <div className="grid md:grid-cols-2 gap-6">
              {plan.days.filter(Boolean).map((d) => (
                <div key={d!.id} className="rounded-xl border p-4">
                  <div className="font-semibold">
                    Day {d!.day_index} {d!.title ? <span className="text-gray-500">· {d!.title}</span> : null}
                  </div>
                  <ul className="mt-2 text-sm text-gray-800 space-y-1 list-disc pl-5">
                    {d!.exercises?.length ? (
                      d!.exercises.map((ex) => (
                        <li key={ex.id}>
                          {ex.name}{" "}
                          <span className="text-gray-500 lowercase">({ex.primary_muscle})</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-400">No exercises.</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-600">
              No workout plan yet.{" "}
              <a href="/workouts/plan" className="text-blue-600 hover:underline">
                Create one
              </a>
              .
            </div>
          )}
        </section>

        {/* Recent sessions (grouped, empties hidden) */}
        <section className="rounded-2xl border p-6 bg-white shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Recent Logs</h2>
          {recentNonEmpty.length ? (
            <div className="space-y-4">
              {recentNonEmpty.map((l) => {
                const grouped = groupSetsByExercise(l.sets);
                return (
                  <div key={l.id} className="rounded-xl border p-4">
                    <div className="font-medium">{fmtDate(l.workout_date)}</div>
                    <div className="mt-2 grid md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      {grouped.map(([exName, sets]) => (
                        <div key={exName} className="border rounded-lg p-2">
                          <div className="font-medium truncate">{exName}</div>
                          <div className="mt-1 text-gray-700 tabular-nums">
                            {sets.map((s, idx) => (
                              <span key={s.id}>
                                {s.weight_kg ?? "BW"}×{s.reps}
                                {idx < sets.length - 1 ? ", " : ""}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-gray-600">No recent workouts yet.</div>
          )}
        </section>
      </main>
    </>
  );
}
