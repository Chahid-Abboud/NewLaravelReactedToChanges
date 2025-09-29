// resources/js/components/NearbyMap.tsx
import React, {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useImperativeHandle,
} from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import * as turf from "@turf/turf";
import type { Feature, Polygon, FeatureCollection, Point } from "geojson";

export type PlaceTypesCsv = "gym" | "nutritionist" | "gym,nutritionist";

export type PoiFeature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] }; // [lng, lat]
  properties: {
    id?: string | number;
    name?: string;
    category?: "gym" | "nutritionist" | string;
    source?: "foursquare" | "overpass" | "local" | string;
    address?: string | null;
    website?: string | null;
    distance_m?: number | null;
    _uid?: string; // internal unique id for selection
  };
};

export type NearbyMapProps = {
  accessToken: string;
  center?: [number, number]; // [lng, lat] — pass from parent (user location)
  radius: number;            // meters
  types: PlaceTypesCsv;
  apiBaseUrl?: string;
  onFetchStart?: () => void;
  onFetchError?: (msg?: string) => void;
  onResults?: (features?: PoiFeature[]) => void;
  className?: string;
  heightPx?: number;
};

// Methods the parent can call (e.g., when a result is clicked)
export type NearbyMapHandle = {
  showFeature: (f: PoiFeature) => void;
  flyTo: (lngLat: [number, number]) => void;
};

const SOURCE_CIRCLE = "search-circle";
const LAYER_CIRCLE = "search-circle-fill";
const SOURCE_POIS = "pois";
const LAYER_POIS = "pois-layer";
const LAYER_POIS_SELECTED = "pois-selected";
const ENDPOINT = "/api/places-local"; // DB endpoint

const GYM_COLOR = "#2563eb";          // blue-600
const NUTRI_COLOR = "#10b981";        // emerald-500
const OTHER_COLOR = "#6b7280";        // gray-500

// ---- Radius limits (clamp to 10km max) ----
const MIN_RADIUS_M = 100;      // 100 m minimum to avoid degenerate circle
const MAX_RADIUS_M = 10000;    // 10 km maximum
const clampRadius = (r: number) =>
  Math.max(MIN_RADIUS_M, Math.min(MAX_RADIUS_M, r));

const colorExpression: any = [
  "match",
  ["downcase", ["get", "category"]],
  "gym",
  GYM_COLOR,
  "nutritionist",
  NUTRI_COLOR,
  OTHER_COLOR,
];

function ensureUid(features: PoiFeature[]): PoiFeature[] {
  return (features || []).map((f, i) => {
    const id = f.properties?.id;
    const name = f.properties?.name ?? "poi";
    const [lng, lat] = f.geometry?.coordinates || [0, 0];
    return {
      ...f,
      properties: {
        ...f.properties,
        _uid:
          id != null
            ? String(id)
            : `${name}-${lng.toFixed(5)}-${lat.toFixed(5)}-${i}`,
      },
    };
  });
}

const NearbyMap = forwardRef<NearbyMapHandle, NearbyMapProps>(function NearbyMap(
  {
    accessToken,
    center,
    radius,
    types,
    apiBaseUrl,
    onFetchStart,
    onFetchError,
    onResults,
    className = "",
    heightPx = 480,
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const featuresRef = useRef<PoiFeature[]>([]);
  const selectedUidRef = useRef<string | null>(null);

  // Circle polygon for fit + draw (uses clamped radius)
  const circlePoly = useMemo<Feature<Polygon> | null>(() => {
    if (!center) return null;
    const r = clampRadius(radius);
    const c = turf.point([center[0], center[1]]);
    const circle = turf.circle(c, r / 1000, { steps: 128, units: "kilometers" });
    return circle as Feature<Polygon>;
  }, [center, radius]);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    showFeature: (f: PoiFeature) => {
      if (!mapRef.current) return;
      const coords = (f.geometry as Point).coordinates as [number, number];
      const uid = f.properties?._uid ?? String(f.properties?.id ?? "");
      selectedUidRef.current = uid || null;

      // Highlight layer filter
      if (mapRef.current.getLayer(LAYER_POIS_SELECTED)) {
        mapRef.current.setFilter(LAYER_POIS_SELECTED, ["==", ["get", "_uid"], uid]);
      }

      // Fly + popup
      mapRef.current.flyTo({ center: coords, zoom: 14 });
      showPopup(coords, f);
    },
    flyTo: (lngLat: [number, number]) => {
      mapRef.current?.flyTo({ center: lngLat, zoom: 13 });
    },
  }));

  function showPopup(coords: [number, number], f: PoiFeature) {
    const p = f.properties || {};
    popupRef.current?.remove();
    popupRef.current = new mapboxgl.Popup({ offset: 8 })
      .setLngLat(coords)
      .setHTML(
        `<div style="min-width:220px">
          <div style="font-weight:600">${p.name || "(no name)"}</div>
          <div style="font-size:12px;opacity:.8">${p.category || ""}${
          p.source ? ` · ${p.source}` : ""
        }</div>
          <div style="font-size:12px;margin-top:4px">${p.address || ""}</div>
          ${
            p.website
              ? `<div style="margin-top:6px"><a href="${p.website}" target="_blank" rel="noreferrer">Website</a></div>`
              : ""
          }
        </div>`
      )
      .addTo(mapRef.current!);
  }

  // Init map once we have a center (user location)
  useEffect(() => {
    if (!accessToken || !center || !containerRef.current) return;

    mapboxgl.accessToken = accessToken;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center,
      zoom: 12,
      attributionControl: true,
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");

    map.on("load", () => {
      // Circle
      if (circlePoly) {
        map.addSource(SOURCE_CIRCLE, { type: "geojson", data: circlePoly as Feature<Polygon> });
        map.addLayer({
          id: LAYER_CIRCLE,
          type: "fill",
          source: SOURCE_CIRCLE,
          paint: { "fill-color": "#1C2C64", "fill-opacity": 0.12 },
        });
        const bbox = turf.bbox(circlePoly);
        map.fitBounds(bbox as mapboxgl.LngLatBoundsLike, { padding: 40, duration: 500 });
      }

      // POIs source + layers
      map.addSource(SOURCE_POIS, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] } as FeatureCollection,
      });

      // Main layer (colored by category)
      map.addLayer({
        id: LAYER_POIS,
        type: "circle",
        source: SOURCE_POIS,
        paint: {
          "circle-radius": 6,
          "circle-color": colorExpression,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Selected marker layer (bigger ring)
      map.addLayer({
        id: LAYER_POIS_SELECTED,
        type: "circle",
        source: SOURCE_POIS,
        filter: ["==", ["get", "_uid"], ""], // none at start
        paint: {
          "circle-radius": 10,
          "circle-color": colorExpression,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#111827",
        },
      });

      void fetchPois();
    });

    return () => {
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, center]);

  // Update circle + refetch when center/radius/types change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !circlePoly) return;
    (map.getSource(SOURCE_CIRCLE) as mapboxgl.GeoJSONSource | undefined)?.setData(
      circlePoly as Feature<Polygon>
    );
    try {
      const bbox = turf.bbox(circlePoly);
      map.fitBounds(bbox as mapboxgl.LngLatBoundsLike, { padding: 40, duration: 350 });
    } catch {}
    // re-fetch on center/radius change
    void fetchPois();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [circlePoly, types]);

  async function fetchPois() {
    const map = mapRef.current;
    if (!map || !center) return;

    try {
      onFetchStart?.();

      const r = clampRadius(radius); // ✅ cap to 10 km
      const baseUrl = apiBaseUrl ?? window.location.origin;
      const url = new URL(ENDPOINT, baseUrl);
      url.searchParams.set("lat", String(center[1]));
      url.searchParams.set("lng", String(center[0]));
      url.searchParams.set("radius", String(r));
      url.searchParams.set("types", types);

      const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Normalize + ensure _uid
      const features = ensureUid((data?.features ?? data?.data ?? []) as PoiFeature[]);
      featuresRef.current = features;

      (map.getSource(SOURCE_POIS) as mapboxgl.GeoJSONSource | undefined)?.setData({
        type: "FeatureCollection",
        features,
      } as FeatureCollection);

      onResults?.(features);
    } catch (e: any) {
      onFetchError?.(e?.message || "Failed to load POIs");
    }
  }

  // Legend overlay
  return (
    <div className={className} style={{ position: "relative" }}>
      <div
        ref={containerRef}
        style={{ width: "100%", height: `${heightPx}px`, borderRadius: 12, overflow: "hidden" }}
        aria-label="Nearby map"
      />
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          background: "rgba(255,255,255,0.9)",
          border: "1px solid rgba(0,0,0,0.1)",
          borderRadius: 8,
          padding: "6px 8px",
          fontSize: 12,
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: GYM_COLOR,
              display: "inline-block",
            }}
          />
          gym
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: NUTRI_COLOR,
              display: "inline-block",
            }}
          />
          nutritionist
        </span>
      </div>
    </div>
  );
});

export default NearbyMap;
