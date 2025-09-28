// resources/js/pages/Places.tsx
import { Head } from "@inertiajs/react";
import NavHeader from "@/components/NavHeader";
import NearbyMap from "@/components/NearbyMap";
import { useMemo, useState } from "react";

/** ---------- Types ---------- */
type PoiFeature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    name?: string;
    category?: "gym" | "nutritionist" | string;
    source?: "foursquare" | "overpass" | string;
    address?: string | null;
    website?: string | null;
    distance_m?: number | null;
  };
};
type PlaceTypesCsv = "gym" | "nutritionist" | "gym,nutritionist";

export default function Places() {
  const [radius, setRadius] = useState<number>(2500);
  const [types, setTypes] = useState<PlaceTypesCsv>("gym,nutritionist");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PoiFeature[]>([]);

  const totals = useMemo(() => {
    const gym = results.filter((f) => f.properties?.category === "gym").length;
    const nut = results.filter((f) => f.properties?.category === "nutritionist").length;
    return { gym, nut, all: results.length };
  }, [results]);

  return (
    <>
      <Head title="Nearby" />
      <NavHeader />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-4 pb-6 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Nearby Gyms &amp; Nutritionists</h1>

          <div className="flex items-center gap-3">
            <label className="text-sm">
              Radius (m)
              <input
                aria-label="Search radius in meters"
                type="number"
                min={100}
                step={50}
                value={radius}
                onChange={(e) => setRadius(Math.max(100, Number(e.target.value) || 100))}
                className="ml-2 w-28 rounded border px-2 py-1"
              />
            </label>

            <label className="text-sm">
              Types
              <select
                aria-label="Place types"
                value={types}
                onChange={(e) => setTypes(e.target.value as PlaceTypesCsv)}
                className="ml-2 rounded border px-2 py-1"
              >
                <option value="gym,nutritionist">Gym + Nutritionist</option>
                <option value="gym">Gym only</option>
                <option value="nutritionist">Nutritionist only</option>
              </select>
            </label>
          </div>
        </div>

        {/* Status / debug strip */}
        <div className="flex items-center gap-4 text-sm">
          <span className="rounded bg-gray-100 px-2 py-1">Total: {totals.all}</span>
          <span className="rounded bg-gray-100 px-2 py-1">Gyms: {totals.gym}</span>
          <span className="rounded bg-gray-100 px-2 py-1">Nutritionists: {totals.nut}</span>
          {loading && <span className="text-gray-500">Fetching places…</span>}
          {error && <span className="text-red-600">Error: {error}</span>}
        </div>

        {/* Two-pane layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" style={{ minHeight: "calc(100vh - 140px)" }}>
          {/* Map */}
          <div className="lg:col-span-8 rounded-2xl border overflow-hidden">
            <NearbyMap
              accessToken={import.meta.env.VITE_MAPBOX_TOKEN}
              radius={radius}                 
              types={types}                   
              onFetchStart={() => {
                setLoading(true);
                setError(null);
              }}
              onFetchError={(msg?: string) => {
                setLoading(false);
                setError(msg || "Failed to load POIs");
              }}
              onResults={(features?: PoiFeature[]) => {
                setLoading(false);
                setResults(features || []);
              }}
            />
          </div>

          {/* Results list */}
          <aside className="lg:col-span-4 rounded-2xl border bg-white p-4 overflow-y-auto">
            <h2 className="text-base font-semibold mb-3">Places</h2>

            {results.length === 0 ? (
              <div className="text-sm text-gray-500">
                No places found in this radius. Try increasing radius or switching types.
              </div>
            ) : (
              <ul className="space-y-3">
                {results.map((f, i) => {
                  const name = f.properties?.name || "Unnamed";
                  const category = f.properties?.category ?? "—";
                  const addr = f.properties?.address ?? "";
                  const src = f.properties?.source ?? "—";
                  const dist =
                    typeof f.properties?.distance_m === "number"
                      ? Math.round(f.properties.distance_m)
                      : null;

                  const website = f.properties?.website || "";
                  const safeHref =
                    website
                      ? website.startsWith("http://") || website.startsWith("https://")
                        ? website
                        : `https://${website}`
                      : "";

                  return (
                    <li key={`${name}-${i}`} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{name}</div>
                        <span className="text-xs rounded bg-gray-100 px-2 py-0.5">{category}</span>
                      </div>

                      {addr && <div className="text-xs text-gray-500 mt-1">{addr}</div>}

                      <div className="mt-1 text-xs text-gray-500">
                        Source: {src}
                        {dist !== null && <> · {dist} m</>}
                      </div>

                      {safeHref && (
                        <a
                          href={safeHref}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                        >
                          Website
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
