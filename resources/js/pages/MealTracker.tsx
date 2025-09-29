// resources/js/pages/MealTracker.tsx
import { Head, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import NavHeader from "@/components/NavHeader";

/** ---------- Types ---------- */
type Totals = { calories: number; protein: number; carbs: number; fat: number };
type MealTotals = Record<"breakfast"|"lunch"|"dinner"|"snack"|"drink", Totals>;
type EntryItem = {
  id: number;
  meal_type: "breakfast"|"lunch"|"dinner"|"snack"|"drink";
  servings: number;
  eaten_at: string;
  food: {
    id: number; name: string; serving_unit: "g"|"ml"; serving_size: number;
    calories: number; protein: number; carbs: number; fat: number;
  };
};
type Targets = Partial<Totals>;

type PageProps = {
  date: string;
  dailyTotals: Totals;
  mealTotals: MealTotals;
  entries: EntryItem[];
  targets?: Targets;
};

type SearchFood = {
  id: number;
  name: string;
  serving_unit: "g" | "ml";
  serving_size: number;
  calories?: number; calories_kcal?: number;
  protein?: number; protein_g?: number;
  carbs?: number; carbs_g?: number;
  fat?: number; fat_g?: number;
};

/** ---------- Page ---------- */
export default function MealTracker() {
  const { date, dailyTotals, mealTotals, entries, targets } = usePage<PageProps>().props;

  const [category, setCategory] = useState<"breakfast"|"lunch"|"dinner"|"snack"|"drink">("breakfast");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  // Add dialog state (portions vs grams)
  const [openAdd, setOpenAdd] = useState(false);
  const [selected, setSelected] = useState<SearchFood | null>(null);
  const [addMode, setAddMode] = useState<"portion" | "grams">("portion");
  const [portionCount, setPortionCount] = useState<number>(1);
  const [gramsValue, setGramsValue] = useState<number | "">("");

  // debounce
  const debounceRef = useRef<number | null>(null);

  // search
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axios.get("/api/foods/search", { params: { category, q, page } });
        setResults(res.data?.data ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [category, q, page]);

  const title = useMemo(() => "Meal Tracker", []);

  // date navigation
  const goTo = (target: string) => {
    const sep = window.location.pathname.includes("?") ? "&" : "?";
    window.location.href = `/meal-tracker${sep}date=${target}`;
  };

  // ---------- Add flow ----------
  const openAddDialog = (food: SearchFood) => {
    setSelected(food);
    setAddMode("portion");
    setPortionCount(1);
    setGramsValue("");
    setOpenAdd(true);
  };

  const closeAddDialog = () => {
    setOpenAdd(false);
    setSelected(null);
  };

  const norm = (v?: number, alt?: number) => Math.max(0, Math.round((v ?? alt ?? 0) as number));
  const toBaseMacros = (f: SearchFood) => {
    const calories = norm(f.calories, f.calories_kcal);
    const protein = norm(f.protein, f.protein_g);
    const carbs   = norm(f.carbs, f.carbs_g);
    const fat     = norm(f.fat, f.fat_g);
    return { calories, protein, carbs, fat };
  };

  const computeServings = (): number => {
    if (!selected) return 0;
    if (addMode === "portion") {
      const p = Number(portionCount);
      return p > 0 ? p : 0;
    } else {
      const g = Number(gramsValue);
      const base = selected.serving_size || 100;
      return g > 0 && base > 0 ? g / base : 0;
    }
  };

  const computedPreview = () => {
    if (!selected) return { calories: 0, protein: 0, carbs: 0, fat: 0, grams: 0 };
    const servings = computeServings();
    const base = toBaseMacros(selected);
    const grams = servings * selected.serving_size;
    return {
      calories: Math.round(base.calories * servings),
      protein: Math.round(base.protein * servings),
      carbs: Math.round(base.carbs * servings),
      fat: Math.round(base.fat * servings),
      grams: Math.round(grams),
    };
  };

  const confirmAdd = async () => {
    if (!selected) return;
    const servings = computeServings();
    if (!(servings > 0)) return;

    await axios.post("/meal-entries", {
      food_id: selected.id,
      meal_type: category,
      servings,
      eaten_at: date,
    });

    closeAddDialog();
    window.location.reload();
  };

  const macro = (n: number) => Math.round(n);

  return (
    <>
      <Head title={title} />

      {/* Global Nav */}
      <NavHeader />

      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Top row: title + date controls */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-[#1C2C64]">{title}</h1>

          <div className="flex items-center gap-2">
            <button
              className="rounded-lg border border-[#1C2C64]/20 px-3 py-1.5 text-sm text-[#1C2C64]"
              onClick={() => {
                const d = new Date(date);
                d.setDate(d.getDate() - 1);
                goTo(d.toISOString().slice(0, 10));
              }}
            >
              ← Previous
            </button>
            <div className="rounded-lg border border-[#1C2C64]/20 px-3 py-1.5 text-sm text-[#1C2C64]">
              {date}
            </div>
            <button
              className="rounded-lg border border-[#1C2C64]/20 px-3 py-1.5 text-sm text-[#1C2C64]"
              onClick={() => {
                const d = new Date(date);
                d.setDate(d.getDate() + 1);
                goTo(d.toISOString().slice(0, 10));
              }}
            >
              Next →
            </button>
          </div>
        </div>

        {/* Stat cards WITH embedded progress bars */}
        <section aria-labelledby="totals" className="mb-6">
          <h2 id="totals" className="sr-only">Daily totals</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              label="Calories"
              value={`${macro(dailyTotals.calories)} kcal`}
              unit="kcal"
              consumed={dailyTotals.calories}
              target={targets?.calories}
            />
            <StatCard
              label="Protein"
              value={`${macro(dailyTotals.protein)} g`}
              unit="g"
              consumed={dailyTotals.protein}
              target={targets?.protein}
            />
            <StatCard
              label="Carbs"
              value={`${macro(dailyTotals.carbs)} g`}
              unit="g"
              consumed={dailyTotals.carbs}
              target={targets?.carbs}
            />
            <StatCard
              label="Fat"
              value={`${macro(dailyTotals.fat)} g`}
              unit="g"
              consumed={dailyTotals.fat}
              target={targets?.fat}
            />
          </div>

          {!targets && (
            <div className="mt-3 text-xs text-[#1C2C64]/70">
              Tip: pass <code>targets</code> from your controller (e.g., based on BMI &amp; goals) to enable percentages.
            </div>
          )}
        </section>

        {/* Meal type tabs */}
        <section aria-labelledby="meals" className="mb-6">
          <h2 id="meals" className="sr-only">Per-meal totals</h2>
          <div role="tablist" aria-label="Meal Types" className="grid grid-cols-1 gap-3 md:grid-cols-5">
            {(["breakfast","lunch","dinner","snack","drink"] as const).map((mt) => {
              const selectedTab = mt === category;
              return (
                <button
                  key={mt}
                  role="tab"
                  aria-selected={selectedTab}
                  aria-controls={`panel-${mt}`}
                  id={`tab-${mt}`}
                  onClick={() => setCategory(mt)}
                  className={`rounded-xl border p-3 text-left transition ${
                    selectedTab
                      ? "border-[#1C2C64] ring-1 ring-[#1C2C64]"
                      : "border-[#1C2C64]/20 hover:bg-[#1C2C64]/5"
                  }`}
                >
                  <div className="text-sm font-medium capitalize text-[#1C2C64]">{mt}</div>
                  <div className="text-xs text-[#1C2C64]/80">
                    {macro(mealTotals[mt].calories)} kcal · P {macro(mealTotals[mt].protein)} · C {macro(mealTotals[mt].carbs)} · F {macro(mealTotals[mt].fat)}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Search */}
        <section
          id={`panel-${category}`}
          role="tabpanel"
          aria-labelledby={`tab-${category}`}
          className="mb-6 rounded-xl border border-[#1C2C64]/20"
        >
          <h2 className="sr-only">Food search</h2>

          <div className="flex items-center justify-between border-b border-[#1C2C64]/10 px-3 py-2">
            <div className="text-sm font-medium text-[#1C2C64]">
              Add to <span className="capitalize">{category}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQ("")}
                className="rounded-lg border border-[#1C2C64]/20 px-3 py-1.5 text-sm text-[#1C2C64]"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="space-y-3 p-3">
            <label className="block text-sm text-[#1C2C64]" htmlFor="search-input">
              Search {category} foods
            </label>
            <input
              id="search-input"
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder={`e.g. "manakish", "labneh"`}
              className="w-full rounded-lg border border-[#1C2C64]/20 px-3 py-2 outline-none focus:ring-2 focus:ring-[#1C2C64]/40"
            />
            {loading ? <div className="text-sm text-[#1C2C64]/70">Searching…</div> : null}

            <ul className="divide-y divide-[#1C2C64]/10">
              {results.map((f) => {
                const base = `${f.serving_size}${f.serving_unit}`;
                const kcal = Math.round(f.calories_kcal ?? f.calories ?? 0);
                const p = Math.round((f.protein_g ?? f.protein ?? 0) as number);
                const c = Math.round((f.carbs_g   ?? f.carbs   ?? 0) as number);
                const fat = Math.round((f.fat_g     ?? f.fat     ?? 0) as number);
                return (
                  <li key={f.id} className="flex items-center justify-between py-2">
                    <div>
                      <div className="font-medium text-[#1C2C64]">{f.name}</div>
                      <div className="text-xs text-[#1C2C64]/80">
                        per {base} · {kcal} kcal · P {p} · C {c} · F {fat}
                      </div>
                    </div>
                    <button
                      onClick={() => openAddDialog(f)}
                      className="rounded-lg border border-[#1C2C64]/20 px-3 py-1.5 text-sm text-[#1C2C64] hover:bg-[#1C2C64]/5"
                    >
                      Add
                    </button>
                  </li>
                );
              })}
              {!loading && results.length === 0 && (
                <li className="py-4 text-sm text-[#1C2C64]/70">No results.</li>
              )}
            </ul>

            {/* Simple paging controls */}
            <div className="flex items-center justify-between pt-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-[#1C2C64]/20 px-3 py-1.5 text-sm text-[#1C2C64] disabled:opacity-40"
              >
                ← Prev
              </button>
              <div className="text-sm text-[#1C2C64]/80">Page {page}</div>
              <button
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-[#1C2C64]/20 px-3 py-1.5 text-sm text-[#1C2C64]"
              >
                Next →
              </button>
            </div>
          </div>
        </section>

        {/* Entries list */}
        <section aria-labelledby="entries" className="rounded-xl border border-[#1C2C64]/20">
          <div className="border-b border-[#1C2C64]/10 p-3 font-medium text-[#1C2C64]" id="entries">
            Your entries for {date}
          </div>
          <div className="p-3">
            <ul className="divide-y divide-[#1C2C64]/10">
              {entries.map((e) => {
                const approxGrams = Math.round(e.servings * e.food.serving_size);
                const portions = Number.isInteger(e.servings) ? e.servings : Math.round(e.servings * 10) / 10;
                return (
                  <li key={e.id} className="flex items-center justify-between py-2">
                    <div>
                      <div className="font-medium text-[#1C2C64]">
                        <span className="capitalize">{e.meal_type}</span> · {e.food.name}
                      </div>
                      <div className="text-xs text-[#1C2C64]/80">
                        {portions} portion{portions === 1 ? "" : "s"} (~{approxGrams}{e.food.serving_unit}) ·
                        {` ${Math.round(e.food.calories)} kcal · P ${Math.round(e.food.protein)} · C ${Math.round(e.food.carbs)} · F ${Math.round(e.food.fat)}`}
                      </div>
                    </div>
                    <form
                      method="post"
                      action={`/meal-entries/${e.id}`}
                      onSubmit={(ev) => { if (!confirm("Remove entry?")) ev.preventDefault(); }}
                    >
                      <input type="hidden" name="_method" value="delete" />
                      <input
                        type="hidden"
                        name="_token"
                        value={(document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ""}
                      />
                      <button className="text-sm text-red-600 hover:underline">Remove</button>
                    </form>
                  </li>
                );
              })}
              {entries.length === 0 && (
                <li className="py-4 text-sm text-[#1C2C64]/70">Nothing yet for today.</li>
              )}
            </ul>
          </div>
        </section>
      </main>

      {/* ---------- Add Dialog (portions or grams) ---------- */}
      {openAdd && selected && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/30" onClick={closeAddDialog} />
          {/* card */}
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-[#1C2C64]/20 bg-white p-4 shadow-xl">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-medium text-[#1C2C64]">
                Add to <span className="capitalize">{category}</span>
              </div>
              <button
                onClick={closeAddDialog}
                className="rounded-lg border border-[#1C2C64]/20 px-2 py-1 text-xs text-[#1C2C64]"
              >
                Close
              </button>
            </div>

            <div className="mb-2">
              <div className="font-semibold text-[#1C2C64]">{selected.name}</div>
              <div className="text-xs text-[#1C2C64]/70">
                Base: {selected.serving_size}{selected.serving_unit}
              </div>
            </div>

            {/* mode switch */}
            <div className="mb-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAddMode("portion")}
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  addMode === "portion" ? "border-[#1C2C64] ring-1 ring-[#1C2C64]" : "border-[#1C2C64]/20"
                }`}
              >
                Portions
              </button>
              <button
                type="button"
                onClick={() => setAddMode("grams")}
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  addMode === "grams" ? "border-[#1C2C64] ring-1 ring-[#1C2C64]" : "border-[#1C2C64]/20"
                }`}
              >
                Grams / mL
              </button>
            </div>

            {/* inputs */}
            {addMode === "portion" ? (
              <div className="mb-3">
                <label className="block text-sm text-[#1C2C64]" htmlFor="portionCount">
                  Portions (1 portion = {selected.serving_size}{selected.serving_unit})
                </label>
                <input
                  id="portionCount"
                  type="number"
                  min={0.25}
                  step={0.25}
                  value={portionCount}
                  onChange={(e) => setPortionCount(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-[#1C2C64]/20 px-3 py-2 outline-none focus:ring-2 focus:ring-[#1C2C64]/40"
                />
              </div>
            ) : (
              <div className="mb-3">
                <label className="block text-sm text-[#1C2C64]" htmlFor="gramsValue">
                  Amount in {selected.serving_unit}
                </label>
                <input
                  id="gramsValue"
                  type="number"
                  min={1}
                  step={1}
                  value={gramsValue}
                  onChange={(e) => setGramsValue(e.target.value === "" ? "" : Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-[#1C2C64]/20 px-3 py-2 outline-none focus:ring-2 focus:ring-[#1C2C64]/40"
                />
              </div>
            )}

            {/* preview */}
            <div className="mb-3 rounded-lg border border-[#1C2C64]/15 p-3">
              <div className="text-xs text-[#1C2C64]/70 mb-1">Preview for this addition</div>
              {(() => {
                const pr = computedPreview();
                return (
                  <div className="text-sm text-[#1C2C64]">
                    ~{pr.grams}{selected.serving_unit} · {pr.calories} kcal · P {pr.protein} · C {pr.carbs} · F {pr.fat}
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={closeAddDialog}
                className="rounded-lg border border-[#1C2C64]/20 px-3 py-1.5 text-sm text-[#1C2C64]"
              >
                Cancel
              </button>
              <button
                onClick={confirmAdd}
                className="rounded-lg border border-[#1C2C64] bg-[#1C2C64] px-3 py-1.5 text-sm text-white"
                >
                Add to {category}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** ---------- Small UI Card WITH progress (WaterCard-style) ---------- */
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

  // Same math as WaterCard: base (0–100) + overflow strip (>100)
  const rawPct = hasTarget ? (consumed! / Math.max(1, target!)) * 100 : 0;
  const pct = Math.max(0, Math.round(rawPct)); // can exceed 100
  const basePct = Math.min(100, pct);
  const overflowPct = Math.min(100, Math.max(0, pct - 100));

  // Color logic consistent with WaterCard feedback
  // <50%: destructive; 50–80%: accent; >80%: secondary
  let fillClass = "bg-accent";
  if (pct < 50) fillClass = "bg-destructive";
  else if (pct > 80) fillClass = "bg-secondary";

  return (
    <div className="rounded-xl border border-[#1C2C64]/20 p-4">
      <div className="text-xs uppercase tracking-wide text-[#1C2C64]/70">{label}</div>
      <div className="text-lg font-semibold text-[#1C2C64]">{value}</div>

      {/* progress area */}
      <div className="mt-3">
        {/* Overflow strip (above) */}
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

        {/* Main bar (0–100%) */}
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

        <div className="mt-1 text-[11px] text-[#1C2C64]/70">
          {hasTarget
            ? `${Math.round(consumed!)} ${unit} / ${Math.round(target!)} ${unit} (${pct}%)`
            : `No target provided for ${label.toLowerCase()}.`}
        </div>
      </div>
    </div>
  );
}
