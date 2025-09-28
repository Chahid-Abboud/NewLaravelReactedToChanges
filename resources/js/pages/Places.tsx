// resources/js/pages/Places.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Head } from "@inertiajs/react";
import NavHeader from "@/components/NavHeader";
import NearbyMap, {
  PoiFeature,
  PlaceTypesCsv,
  NearbyMapHandle,
} from "@/components/NearbyMap";
import ElasticSlider from "@/components/ElasticSlider"; // ✅ using the elastic slider

const DEFAULT_RADIUS = 1500; // meters

export default function Places() {
  const [radius, setRadius] = useState<number>(DEFAULT_RADIUS);
  const [types, setTypes] = useState<PlaceTypesCsv>("gym,nutritionist");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PoiFeature[]>([]);
  const [center, setCenter] = useState<[number, number] | null>(null); // [lng, lat]
  const [geoMsg, setGeoMsg] = useState<string | null>(null);

  const mapRef = useRef<NearbyMapHandle | null>(null);
  const token: string = (import.meta as any).env?.VITE_MAPBOX_TOKEN ?? "";

  // Auto-locate once on mount; render the map only after we have a center
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGeoMsg("Geolocation not supported by this browser.");
      return;
    }
    setGeoMsg("Locating…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCenter([longitude, latitude]); // [lng, lat]
        setGeoMsg(null);
      },
      (err) => {
        setGeoMsg(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Enable it in your browser settings."
            : "Could not get your location."
        );
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 }
    );
  }, []);

  const counts = useMemo(() => {
    const byCat = results.reduce(
      (acc, f) => {
        const cat = (f.properties?.category ?? "").toLowerCase();
        if (cat.includes("nutrition")) acc.nutritionist++;
        else acc.gym++;
        return acc;
      },
      { gym: 0, nutritionist: 0 }
    );
    return byCat;
  }, [results]);

  return (
    <>
      <Head title="Nearby — Hayetak" />
      <NavHeader />

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Header */}
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Nearby</h1>
            <p className="text-sm text-muted-foreground">
              Explore gyms and nutritionists around you.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {loading ? "Loading…" : error ? <span className="text-red-600">{error}</span> : `${results.length} results`}
          </div>
        </div>

        {/* Controls — single row, equal widths, no wrap on desktop */}
        <div className="mb-4 flex flex-wrap md:flex-nowrap items-end gap-4">
          {/* Radius (ElasticSlider) */}
          <div className="flex-1 min-w-[260px]">
            <ElasticSlider
              label="Radius (m)"
              value={radius}
              min={300}
              max={30000}
              step={100}
              onChange={setRadius}
              formatValue={(v) => `${v} m`}
            />
          </div>

          {/* Types */}
          <label className="flex-1 min-w-[260px] flex flex-col gap-1">
            <span className="text-sm font-medium">Types</span>
            <select
              value={types}
              onChange={(e) => setTypes(e.target.value as PlaceTypesCsv)}
              className="h-9 w-full rounded-md border bg-background px-3"
            >
              <option value="gym,nutritionist">Gyms + Nutritionists</option>
              <option value="gym">Gyms only</option>
              <option value="nutritionist">Nutritionists only</option>
            </select>
          </label>

          {/* Counts (button removed) */}
          <div className="flex-1 min-w-[260px]">
            <div className="h-9 w-full rounded-md border bg-background px-3 text-sm flex items-center justify-between">
              <span><span className="font-semibold">{counts.gym}</span> gyms</span>
              <span><span className="font-semibold">{counts.nutritionist}</span> nutritionists</span>
            </div>
            {geoMsg && <div className="mt-1 text-xs text-muted-foreground" aria-live="polite">{geoMsg}</div>}
          </div>
        </div>

        {/* Map + List */}
        <div className="grid gap-4 md:grid-cols-5">
          <div className="md:col-span-3">
            {center ? (
              <NearbyMap
                ref={mapRef}
                accessToken={token}
                radius={radius}
                types={types}
                center={center}
                onFetchStart={() => { setLoading(true); setError(null); }}
                onFetchError={(msg) => { setLoading(false); setError(msg || "Failed to load"); }}
                onResults={(features) => { setLoading(false); setResults(features || []); }}
                className="border"
                heightPx={480}
              />
            ) : (
              <div className="flex h-[480px] items-center justify-center rounded-xl border">
                <div className="text-sm text-muted-foreground">
                  {geoMsg ?? "Waiting for location permission…"}
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <div className="rounded-lg border p-3">
              <div className="mb-2 text-sm font-medium">Results</div>
              <ul className="max-h-[480px] space-y-2 overflow-auto pr-1">
                {results.length === 0 && !loading && !error && (
                  <li className="text-sm text-muted-foreground">No places found in this radius.</li>
                )}
                {results.map((f, i) => {
                  const p = f.properties || {};
                  const key = p._uid ?? `${p.name ?? "poi"}-${i}`;
                  return (
                    <li
                      key={key}
                      className="rounded-md border p-2 cursor-pointer hover:bg-muted/40 transition"
                      onClick={() => mapRef.current?.showFeature(f)}
                      title="Show on map"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{p.name || "(no name)"}</div>
                        <div className="text-xs text-muted-foreground">
                          {p.category || ""}{p.source ? ` · ${p.source}` : ""}
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{p.address || ""}</div>
                      {typeof p.distance_m === "number" && (
                        <div className="mt-1 text-xs">{Math.round(p.distance_m)} m away</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
