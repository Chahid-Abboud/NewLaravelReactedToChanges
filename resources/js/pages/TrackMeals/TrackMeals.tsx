import { Head, useForm, router } from "@inertiajs/react";
import { useMemo, useState } from "react";
import StyledFileInput from "@/components/StyledFileInput";
import BackHomeButton from "@/components/BackHomeButton";

type DietItem = {
  id?: number;
  category: "breakfast" | "lunch" | "dinner" | "snack" | "drink";
  label: string;
  default_portion?: string | null;
  calories?: number | null;
};
type Diet = {
  id: number;
  name: string;
  items: DietItem[];
} | null;

type Props = {
  diet: Diet;
  today: string; // "YYYY-MM-DD"
};

const CATS = ["breakfast", "lunch", "dinner", "snack", "drink"] as const;

export default function TrackMealsPage({ diet, today }: Props) {
  const [mode, setMode] = useState<"diet" | "log">(diet ? "log" : "diet");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // helper to show a transient success banner
  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    // auto-hide after 3s
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <>
      <Head title="Track Meals" />
      <div className="mx-auto max-w-4xl p-4 md:p-6">
        <h1 className="text-2xl font-semibold mb-4">Track Meals</h1>

        {successMsg && (
          <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-emerald-800">
            {successMsg}
          </div>
        )}

        <div className="mb-4 flex gap-2">
          <button
            className={`px-3 py-2 rounded-lg border ${mode === "diet" ? "bg-gray-900 text-white" : "bg-white"}`}
            onClick={() => setMode("diet")}
          >
            Diet Setup
          </button>
          <button
            className={`px-3 py-2 rounded-lg border ${mode === "log" ? "bg-gray-900 text-white" : "bg-white"}`}
            onClick={() => setMode("log")}
            disabled={!diet}
            title={!diet ? "Create and confirm your diet first" : ""}
          >
            Daily Log
          </button>
          <BackHomeButton className="mb-4" />
        </div>

        {mode === "diet" ? (
          <DietBuilder initial={diet} onSaved={() => showSuccess("Diet saved.")} />
        ) : (
          <DailyLog diet={diet!} today={today} onSaved={() => showSuccess("Your meals for the day were logged.")} />
        )}
      </div>
    </>
  );
}

function DietBuilder({ initial, onSaved }: { initial: Diet; onSaved: () => void }) {
  const { data, setData, processing } = useForm<{
    name: string;
    items: DietItem[];
    newItem: { [K in typeof CATS[number]]: string };
  }>({
    name: initial?.name ?? "My Diet",
    items: initial?.items ?? [],
    newItem: { breakfast: "", lunch: "", dinner: "", snack: "", drink: "" },
  });

  const grouped = useMemo(() => {
    const g: Record<string, DietItem[]> = {};
    for (const c of CATS) g[c] = [];
    for (const it of data.items) g[it.category].push(it);
    return g;
  }, [data.items]);

  const addItem = (cat: typeof CATS[number]) => {
    const label = data.newItem[cat].trim();
    if (!label) return;
    setData("items", [
      ...data.items,
      { category: cat, label, default_portion: null, calories: null },
    ]);
    setData("newItem", { ...data.newItem, [cat]: "" });
  };

  const removeItem = (cat: string, idx: number) => {
    const clone = [...data.items];
    // remove the idx-th occurrence in that category (stable)
    let seen = -1;
    const filtered: DietItem[] = [];
    for (const it of clone) {
      if (it.category === cat) {
        seen++;
        if (seen === idx) continue;
      }
      filtered.push(it);
    }
    setData("items", filtered);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Build FormData with CSRF token
    const form = new FormData();
    form.append("name", data.name);

    const tokenEl = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
    if (tokenEl?.content) form.append("_token", tokenEl.content);

    // Flatten items
    data.items.forEach((it, i) => {
      form.append(`items[${i}][category]`, it.category);
      form.append(`items[${i}][label]`, it.label);
      if (it.default_portion != null) form.append(`items[${i}][default_portion]`, String(it.default_portion));
      if (it.calories != null) form.append(`items[${i}][calories]`, String(it.calories));
    });

    router.post("/track-meals/diet", form, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: onSaved, // ✅ show green banner
      onError: (errs) => console.error("Diet save validation errors:", errs),
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1">Diet name</label>
        <input
          className="w-full rounded-lg border px-3 py-2"
          value={data.name}
          onChange={(e) => setData("name", e.target.value)}
          placeholder="My Diet"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {CATS.map((cat) => (
          <div key={cat} className="rounded-xl border p-4">
            <h3 className="font-medium capitalize mb-3">{cat}</h3>

            <div className="space-y-2 mb-3">
              {grouped[cat].map((it, i) => (
                <div key={`${cat}-${i}`} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <span className="truncate">{it.label}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(cat, i)}
                    className="text-red-600 hover:underline text-sm"
                  >
                    remove
                  </button>
                </div>
              ))}
              {grouped[cat].length === 0 && (
                <div className="text-sm text-gray-500">No items yet.</div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                className="flex-1 rounded-lg border px-3 py-2"
                value={data.newItem[cat]}
                onChange={(e) => setData("newItem", { ...data.newItem, [cat]: e.target.value })}
                placeholder={`Add a ${cat} item, e.g. "Oatmeal"`}
              />
              <button
                type="button"
                onClick={() => addItem(cat)}
                className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50"
              >
                Add
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={processing}
          className="inline-flex items-center rounded-xl px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {processing ? "Saving..." : "Confirm Diet"}
        </button>
      </div>
    </form>
  );
}

function DailyLog({
  diet,
  today,
  onSaved,
}: {
  diet: NonNullable<Diet>;
  today: string;
  onSaved: () => void;
}) {
  const [photo, setPhoto] = useState<File | null>(null);

  // Build checklists from diet
  const baseSelections = useMemo(() => {
    const initial: {
      [K in typeof CATS[number]]: { label: string; checked: boolean; quantity?: number; unit?: string }[];
    } = { breakfast: [], lunch: [], dinner: [], snack: [], drink: [] };
    for (const it of diet.items) {
      initial[it.category].push({ label: it.label, checked: false });
    }
    return initial;
  }, [diet.items]);

  const { data, setData, processing } = useForm<{
    consumed_at: string;
    other_notes: string;
    selections: { category: string; label: string; quantity?: number; unit?: string }[];
    dynamic: typeof baseSelections;
    otherByCat: { [K in typeof CATS[number]]: boolean }; // toggles "Other" per category
    otherText: { [K in typeof CATS[number]]: string }; // text for "Other"
    photo: File | null;
  }>({
    consumed_at: today,
    other_notes: "",
    selections: [],
    dynamic: baseSelections,
    otherByCat: { breakfast: false, lunch: false, dinner: false, snack: false, drink: false },
    otherText: { breakfast: "", lunch: "", dinner: "", snack: "", drink: "" },
    photo: null,
  });

  const toggle = (cat: typeof CATS[number], idx: number, checked: boolean) => {
    const copy = { ...data.dynamic };
    copy[cat][idx].checked = checked;
    setData("dynamic", copy);
  };

  const resetAfterSave = () => {
    // uncheck everything & clear “other” texts; keep date and notes
    const cleared: typeof baseSelections = { breakfast: [], lunch: [], dinner: [], snack: [], drink: [] };
    for (const cat of CATS) {
      cleared[cat] = data.dynamic[cat].map((it) => ({ ...it, checked: false, quantity: undefined, unit: undefined }));
    }
    setData("dynamic", cleared);
    setData("otherText", { breakfast: "", lunch: "", dinner: "", snack: "", drink: "" });
    setPhoto(null);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Collect chosen items + “Other” textboxes
    const selections: { category: string; label: string; quantity?: number; unit?: string }[] = [];

    for (const cat of CATS) {
      for (const it of data.dynamic[cat]) {
        if (it.checked) selections.push({ category: cat, label: it.label, quantity: it.quantity, unit: it.unit });
      }
      const txt = data.otherText[cat]?.trim();
      if (data.otherByCat[cat] && txt) {
        selections.push({ category: cat, label: txt });
      }
    }

    // Submit using FormData because of the photo
    const form = new FormData();
    form.append("consumed_at", data.consumed_at);
    form.append("other_notes", data.other_notes);

    // ✅ CSRF token
    const tokenEl = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
    if (tokenEl?.content) form.append("_token", tokenEl.content);

    selections.forEach((s, i) => {
      form.append(`selections[${i}][category]`, s.category);
      form.append(`selections[${i}][label]`, s.label);
      if (s.quantity != null) form.append(`selections[${i}][quantity]`, String(s.quantity));
      if (s.unit) form.append(`selections[${i}][unit]`, s.unit);
    });
    if (photo) form.append("photo", photo);

    router.post("/track-meals/log", form, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => {
        onSaved(); // ✅ show green banner
        resetAfterSave();
      },
      onError: (errs) => console.error("Daily log validation errors:", errs),
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Log date</label>
          <input
            type="date"
            className="w-full rounded-lg border px-3 py-2"
            value={data.consumed_at}
            onChange={(e) => setData("consumed_at", e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Notes (optional)</label>
          <input
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Anything special today?"
            value={data.other_notes}
            onChange={(e) => setData("other_notes", e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border p-4">
        <h3 className="font-medium mb-2">Meal photo (optional)</h3>
        <StyledFileInput onFile={setPhoto} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {CATS.map((cat) => (
          <div key={cat} className="rounded-xl border p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium capitalize">{cat}</h3>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={data.otherByCat[cat]}
                  onChange={(e) => setData("otherByCat", { ...data.otherByCat, [cat]: e.target.checked })}
                />
                Other
              </label>
            </div>

            <div className="space-y-2">
              {data.dynamic[cat].map((it, i) => (
                <div key={`${cat}-${i}`} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={!!it.checked}
                    onChange={(e) => toggle(cat, i, e.target.checked)}
                  />
                  <span className="flex-1">{it.label}</span>
                  <input
                    type="number"
                    className="w-24 rounded-lg border px-2 py-1"
                    placeholder="Qty"
                    value={it.quantity ?? ""}
                    onChange={(e) => {
                      const copy = { ...data.dynamic };
                      copy[cat][i].quantity = e.target.value ? Number(e.target.value) : undefined;
                      setData("dynamic", copy);
                    }}
                  />
                  <input
                    type="text"
                    className="w-20 rounded-lg border px-2 py-1"
                    placeholder="Unit"
                    value={it.unit ?? ""}
                    onChange={(e) => {
                      const copy = { ...data.dynamic };
                      copy[cat][i].unit = e.target.value || undefined;
                      setData("dynamic", copy);
                    }}
                  />
                </div>
              ))}

              {data.otherByCat[cat] && (
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder={`Add other ${cat}...`}
                  value={data.otherText[cat]}
                  onChange={(e) => setData("otherText", { ...data.otherText, [cat]: e.target.value })}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={processing}
          className="inline-flex items-center rounded-xl px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {processing ? "Saving..." : "Confirm meals for the day"}
        </button>
      </div>
    </form>
  );
}
