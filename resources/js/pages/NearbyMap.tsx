import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import * as turf from "@turf/turf";
import type { FeatureCollection, Feature, Point } from "geojson";

/** CSV accepted by the API; keep union for safer props */
export type PlaceTypesCsv = "gym" | "nutritionist" | "gym,nutritionist";

export type PoiFeature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    name?: string;
    category?: "gym" | "nutritionist" | string;
    source?: "db" | "foursquare" | "overpass" | string;
    address?: string | null;
    website?: string | null;
    distance_m?: number | null;
  };
};

export type NearbyMapProps = {
  /** Mapbox public token */
  accessToken: string;
  /** Controlled radius from parent (meters) */
  radius: number;
  /** Controlled types from parent */
  types: PlaceTypesCsv;
  /** Make the map div fill its parent container */
  fillHeight?: boolean;
  /** Optional base URL for Laravel API (useful in dev or different origin) */
  apiBaseUrl?: string;

  // Optional callbacks
  onFetchStart?: () => void;
  onFetchError?: (msg?: string) => void;
  onResults?: (features?: PoiFeature[]) => void;
};

const DEFAULT_CENTER: [number, number] = [35.5018, 33.8938]; // Beirut [lng, lat]
const POI_SOURCE_ID = "pois";
const POI_LAYER_ID = "pois";
const RADIUS_SOURCE_ID = "radius";
const RADIUS_FILL_ID = "radius-fill";
const RADIUS_OUTLINE_ID = "radius-outline";

export default function NearbyMap({
  accessToken,
  radius,
  types,
  fillHeight = false,
  apiBaseUrl,
  onFetchStart,
  onFetchError,
  onResults,
}: NearbyMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [user, setUser] = useState<[number, number] | null>(null);

  // Keep track of previous fetch to cancel if inputs change
  const fetchAbortRef = useRef<AbortController | null>(null);

  const baseUrl = useMemo(() => {
    return (
      apiBaseUrl ||
      (import.meta as any)?.env?.VITE_APP_API_BASE ||
      window.location.origin
    )
      .toString()
      .replace(/\/+$/, "");
  }, [apiBaseUrl]);

  // init map
  useEffect(() => {
    if (!containerRef.current) return;
    if (!accessToken) {
      console.warn("Mapbox accessToken missing.");
      return;
    }
    mapboxgl.accessToken = accessToken;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: DEFAULT_CENTER,
      zoom: 12,
      attributionControl: true,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }));

    const onLoad = () => {
      setMapLoaded(true);
      map.resize();
    };
    map.once("load", onLoad);
    mapRef.current = map;

    const onWinResize = () => map.resize();
    window.addEventListener("resize", onWinResize);

    // geolocate (best-effort)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const u: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        setUser(u);
        const addMarker = () => {
          new mapboxgl.Marker().setLngLat(u).addTo(map);
          map.flyTo({ center: u, zoom: 14, speed: 0.8 });
          map.resize();
        };
        map.isStyleLoaded() ? addMarker() : map.once("load", addMarker);
      },
      (err) => {
        console.warn("Geolocation error:", err);
        // keep default center; no crash
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );

    // if style reloads (e.g., style switch), redraw radius
    const onStyleData = () => {
      if (!map.isStyleLoaded()) return;
      const c = user ?? DEFAULT_CENTER;
      drawRadius(map, c, radius);
    };
    map.on("styledata", onStyleData);

    return () => {
      window.removeEventListener("resize", onWinResize);
      map.off("styledata", onStyleData);

      // Clean layers/sources defensively
      safeRemoveLayer(map, POI_LAYER_ID);
      safeRemoveSource(map, POI_SOURCE_ID);
      safeRemoveLayer(map, RADIUS_FILL_ID);
      safeRemoveLayer(map, RADIUS_OUTLINE_ID);
      safeRemoveSource(map, RADIUS_SOURCE_ID);

      map.remove();
      mapRef.current = null;

      // cancel any pending fetch
      fetchAbortRef.current?.abort();
      fetchAbortRef.current = null;
    };
  }, [accessToken]); // radius no longer re-inits map; we update layers instead

  // react to radius/types/user/map readiness
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const center = user ?? DEFAULT_CENTER;
    drawRadius(map, center, radius);

    // kick off DB fetch
    fetchAbortRef.current?.abort(); // cancel previous
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    void fetchPois(map, baseUrl, center, radius, types, { onFetchStart, onFetchError, onResults }, controller.signal);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, user, radius, types, baseUrl]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: fillHeight ? "100%" : 480 }}
    />
  );
}

/* ---------- utils ---------- */

function safeRemoveLayer(map: mapboxgl.Map, id: string) {
  try {
    if (map.getLayer(id)) map.removeLayer(id);
  } catch {
    /* noop */
  }
}
function safeRemoveSource(map: mapboxgl.Map, id: string) {
  try {
    if (map.getSource(id)) map.removeSource(id);
  } catch {
    /* noop */
  }
}

function drawRadius(map: mapboxgl.Map, center: [number, number], radiusMeters: number) {
  if (!map.isStyleLoaded()) {
    map.once("load", () => drawRadius(map, center, radiusMeters));
    return;
  }
  const circle = turf.circle(center, radiusMeters / 1000, { steps: 64, units: "kilometers" }) as Feature;

  const existing = map.getSource(RADIUS_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
  if (!existing) {
    map.addSource(RADIUS_SOURCE_ID, { type: "geojson", data: circle as any });
  } else {
    existing.setData(circle as any);
  }

  if (!map.getLayer(RADIUS_FILL_ID)) {
    map.addLayer({
      id: RADIUS_FILL_ID,
      type: "fill",
      source: RADIUS_SOURCE_ID,
      paint: { "fill-opacity": 0.15, "fill-color": "#1C2C64" },
    });
  }
  if (!map.getLayer(RADIUS_OUTLINE_ID)) {
    map.addLayer({
      id: RADIUS_OUTLINE_ID,
      type: "line",
      source: RADIUS_SOURCE_ID,
      paint: { "line-width": 2, "line-color": "#1C2C64" },
    });
  }
}

async function fetchPois(
  map: mapboxgl.Map,
  baseUrl: string,
  center: [number, number],
  radius: number,
  types: string,
  cb: {
    onFetchStart?: () => void;
    onFetchError?: (msg?: string) => void;
    onResults?: (features?: PoiFeature[]) => void;
  },
  signal?: AbortSignal
) {
  if (!map.isStyleLoaded()) {
    map.once("load", () => fetchPois(map, baseUrl, center, radius, types, cb, signal));
    return;
  }

  cb.onFetchStart?.();

  const url = new URL("/api/places", baseUrl);
  url.searchParams.set("lat", String(center[1])); // [lng,lat] → API wants lat first
  url.searchParams.set("lng", String(center[0]));
  url.searchParams.set("radius", String(radius));
  url.searchParams.set("types", types);

  try {
    const res = await fetch(url.toString(), { credentials: "include", signal });
    if (!res.ok) {
      cb.onFetchError?.(`HTTP ${res.status}`);
      return;
    }

    const json = (await res.json()) as FeatureCollection | { features?: PoiFeature[] };
    const raw: PoiFeature[] =
      (isFeatureCollection(json) ? (json.features as PoiFeature[]) : (json.features ?? [])) || [];

    // Defensive distance check (server already filters)
    const inside = raw
      .filter((f) => {
        const coords = f?.geometry?.coordinates;
        if (!coords) return false;
        const dKm = turf.distance(turf.point(center), turf.point(coords), { units: "kilometers" });
        return dKm * 1000 <= radius;
      })
      .map((f) => {
        const dKm = turf.distance(turf.point(center), turf.point(f.geometry.coordinates), { units: "kilometers" });
        return {
          ...f,
          properties: { ...f.properties, distance_m: Math.round(dKm * 1000) },
        };
      });

    const collection: FeatureCollection<Point, PoiFeature["properties"]> = {
      type: "FeatureCollection",
      features: inside as unknown as Feature<Point, PoiFeature["properties"]>[],
    };

    const src = map.getSource(POI_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (!src) {
      map.addSource(POI_SOURCE_ID, { type: "geojson", data: collection as any });

      // Data-driven styling by category
      map.addLayer({
        id: POI_LAYER_ID,
        type: "circle",
        source: POI_SOURCE_ID,
        paint: {
          "circle-radius": 6,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#FFFFFF",
          // gyms = blue-ish, nutritionists = green-ish, otherwise gray
          "circle-color": [
            "match",
            ["get", "category"],
            "gym",
            "#1C2C64",
            "nutritionist",
            "#2E7D32",
            /* other */ "#7A7A7A",
          ],
        },
      });

      map.on("click", POI_LAYER_ID, (e) => {
        const f = e.features?.[0] as any;
        if (!f) return;
        const [lng, lat] = f.geometry.coordinates;
        const name = f.properties?.name ?? "Place";
        const category = f.properties?.category ?? "";
        const address = f.properties?.address ?? "";
        const dist = f.properties?.distance_m ?? null;
        const srcName = f.properties?.source ?? "db";
        const distStr = typeof dist === "number" ? `${dist} m` : "";

        const html = `
          <div style="max-width:260px">
            <strong>${escapeHtml(name)}</strong><br/>
            <small>${escapeHtml(category)} • ${escapeHtml(srcName)} ${distStr ? "• " + escapeHtml(distStr) : ""}</small>
            ${address ? `<div style="margin-top:4px">${escapeHtml(address)}</div>` : ""}
          </div>
        `;

        new mapboxgl.Popup().setLngLat([lng, lat]).setHTML(html).addTo(map);
      });

      map.on("mouseenter", POI_LAYER_ID, () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", POI_LAYER_ID, () => (map.getCanvas().style.cursor = ""));
    } else {
      src.setData(collection as any);
    }

    cb.onResults?.(inside as PoiFeature[]);
  } catch (err: any) {
    if (err?.name === "AbortError") return; // ignore cancelled fetch
    cb.onFetchError?.(err?.message || "Failed to load POIs");
  }
}

function isFeatureCollection(x: any): x is FeatureCollection {
  return x && typeof x === "object" && x.type === "FeatureCollection" && Array.isArray(x.features);
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]!));
}
