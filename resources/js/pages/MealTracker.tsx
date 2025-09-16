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
type PageProps = {
  date: string;
  dailyTotals: Totals;
  mealTotals: MealTotals;
  entries: EntryItem[];
};

/** ---------- Page ---------- */
export default function MealTracker() {
  const { date, dailyTotals, mealTotals, entries } = usePage<PageProps>().props;

  const [category, setCategory] = useState<"breakfast"|"lunch"|"dinner"|"snack"|"drink">("breakfast");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  // useRef must have an initial value
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

  // quick add
  const addItem = async (food: any) => {
    const raw = window.prompt(
      `Amount in ${food.serving_unit} (base ${food.serving_size}${food.serving_unit}):`,
      "100"
    );
    if (!raw) return;
    const amount = Number(raw);
    if (!(amount > 0)) return;

    const servings = amount / food.serving_size;

    await axios.post("/meal-entries", {
      food_id: food.id,
      meal_type: category,
      servings,
      eaten_at: date,
    });

    window.location.reload();
  };

  const macro = (n: number) => Math.round(n);
  const title = useMemo(() => "Meal Tracker", []);

  // date navigation
  const goTo = (target: string) => {
    const sep = window.location.pathname.includes("?") ? "&" : "?";
    window.location.href = `/meal-tracker${sep}date=${target}`;
  };

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

        {/* Today totals */}
        <section aria-labelledby="totals" className="mb-6">
          <h2 id="totals" className="sr-only">Daily totals</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Calories" value={`${macro(dailyTotals.calories)} kcal`} />
            <StatCard label="Protein"  value={`${macro(dailyTotals.protein)} g`} />
            <StatCard label="Carbs"    value={`${macro(dailyTotals.carbs)} g`} />
            <StatCard label="Fat"      value={`${macro(dailyTotals.fat)} g`} />
          </div>
        </section>

        {/* Meal type tabs */}
        <section aria-labelledby="meals" className="mb-6">
          <h2 id="meals" className="sr-only">Per-meal totals</h2>
          <div role="tablist" aria-label="Meal Types" className="grid grid-cols-1 gap-3 md:grid-cols-5">
            {(["breakfast","lunch","dinner","snack","drink"] as const).map((mt) => {
              const selected = mt === category;
              return (
                <button
                  key={mt}
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`panel-${mt}`}
                  id={`tab-${mt}`}
                  onClick={() => setCategory(mt)}
                  className={`rounded-xl border p-3 text-left transition ${
                    selected
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

        {/* Search (fixed single aria-labelledby) */}
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
                const p = Math.round(f.protein_g ?? f.protein ?? 0);
                const c = Math.round(f.carbs_g ?? f.carbs ?? 0);
                const fat = Math.round(f.fat_g ?? f.fat ?? 0);
                return (
                  <li key={f.id} className="flex items-center justify-between py-2">
                    <div>
                      <div className="font-medium text-[#1C2C64]">{f.name}</div>
                      <div className="text-xs text-[#1C2C64]/80">
                        base {base} · {kcal} kcal · P {p} · C {c} · F {fat}
                      </div>
                    </div>
                    <button
                      onClick={() => addItem(f)}
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

            {/* Simple paging controls (server must support ?page=) */}
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
              {entries.map((e) => (
                <li key={e.id} className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-medium text-[#1C2C64]">
                      <span className="capitalize">{e.meal_type}</span> · {e.food.name}
                    </div>
                    <div className="text-xs text-[#1C2C64]/80">
                      {Math.round(e.servings * e.food.serving_size)}{e.food.serving_unit} ·
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
              ))}
              {entries.length === 0 && (
                <li className="py-4 text-sm text-[#1C2C64]/70">Nothing yet for today.</li>
              )}
            </ul>
          </div>
        </section>
      </main>
    </>
  );
}

/** ---------- Small UI Card ---------- */
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#1C2C64]/20 p-4">
      <div className="text-xs uppercase tracking-wide text-[#1C2C64]/70">{label}</div>
      <div className="text-lg font-semibold text-[#1C2C64]">{value}</div>
    </div>
  );
}
