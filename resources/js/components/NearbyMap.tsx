// resources/js/components/NearbyMap.tsx
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";
import * as turf from "@turf/turf";

export type PlaceTypesCsv = "gym" | "nutritionist" | "gym,nutritionist";

export type PoiFeature = {
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

export type NearbyMapProps = {
  /** Mapbox public token */
  accessToken: string;
  /** Controlled radius from parent (meters) */
  radius: number;
  /** Controlled types from parent */
  types: PlaceTypesCsv;
  /** Make the map div fill its parent container */
  fillHeight?: boolean;
  /** Optional base URL for Laravel API (useful in dev) */
  apiBaseUrl?: string;

  // Optional callbacks
  onFetchStart?: () => void;
  onFetchError?: (msg?: string) => void;
  onResults?: (features?: PoiFeature[]) => void;
};

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
      center: [35.5018, 33.8938], // Beirut
      zoom: 12,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }));
    map.once("load", () => {
      setMapLoaded(true);
      map.resize();
    });
    mapRef.current = map;

    const onWinResize = () => map.resize();
    window.addEventListener("resize", onWinResize);

    // geolocate
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
      (err) => console.warn("Geolocation error:", err),
      { enableHighAccuracy: true, timeout: 8000 }
    );

    // if style reloads, redraw radius
    const onStyleData = () => {
      if (!map.isStyleLoaded() || !user) return;
      drawRadius(map, user, radius);
    };
    map.on("styledata", onStyleData);

    return () => {
      window.removeEventListener("resize", onWinResize);
      map.off("styledata", onStyleData);
      try {
        if (map.getLayer("pois")) map.removeLayer("pois");
        if (map.getSource("pois")) map.removeSource("pois");
        if (map.getLayer("radius-fill")) map.removeLayer("radius-fill");
        if (map.getLayer("radius-outline")) map.removeLayer("radius-outline");
        if (map.getSource("radius")) map.removeSource("radius");
      } catch {}
      map.remove();
    };
  }, [accessToken, radius]);

  // react to radius/types when ready
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !user) return;
    drawRadius(map, user, radius);
    void fetchPois(map, baseUrl, user, radius, types, { onFetchStart, onFetchError, onResults });
  }, [mapLoaded, user, radius, types, baseUrl, onFetchStart, onFetchError, onResults]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: fillHeight ? "100%" : 480 }}
    />
  );
}

/* ---------- utils ---------- */
function drawRadius(map: mapboxgl.Map, center: [number, number], radiusMeters: number) {
  if (!map.isStyleLoaded()) {
    map.once("load", () => drawRadius(map, center, radiusMeters));
    return;
  }
  const circle = turf.circle(center, radiusMeters / 1000, { steps: 64, units: "kilometers" }) as any;

  const src = map.getSource("radius") as mapboxgl.GeoJSONSource | undefined;
  if (!src) {
    map.addSource("radius", { type: "geojson", data: circle });
  } else {
    src.setData(circle);
  }
  if (!map.getLayer("radius-fill")) {
    map.addLayer({
      id: "radius-fill",
      type: "fill",
      source: "radius",
      paint: { "fill-opacity": 0.15, "fill-color": "#1C2C64" },
    });
  }
  if (!map.getLayer("radius-outline")) {
    map.addLayer({
      id: "radius-outline",
      type: "line",
      source: "radius",
      paint: { "line-width": 2, "line-color": "#1C2C64" },
    });
  }
}

async function fetchPois(
  map: mapboxgl.Map,
  baseUrl: string,
  user: [number, number],
  radius: number,
  types: string,
  cb: {
    onFetchStart?: () => void;
    onFetchError?: (msg?: string) => void;
    onResults?: (features?: PoiFeature[]) => void;
  }
) {
  if (!map.isStyleLoaded()) {
    map.once("load", () => fetchPois(map, baseUrl, user, radius, types, cb));
    return;
  }

  cb.onFetchStart?.();

  const url = new URL("/api/places", baseUrl);
  url.searchParams.set("lat", String(user[1]));
  url.searchParams.set("lng", String(user[0]));
  url.searchParams.set("radius", String(radius));
  url.searchParams.set("types", types);

  try {
    const res = await fetch(url.toString(), { credentials: "include" });
    if (!res.ok) {
      cb.onFetchError?.(`HTTP ${res.status}`);
      return;
    }
    const fc = (await res.json()) as { features?: PoiFeature[] };
    const raw = fc.features ?? [];

    const inside = raw
      .filter((f) => {
        const coords = f?.geometry?.coordinates;
        if (!coords) return false;
        const dKm = turf.distance(turf.point(user), turf.point(coords), { units: "kilometers" });
        return dKm * 1000 <= radius;
      })
      .map((f) => {
        const dKm = turf.distance(turf.point(user), turf.point(f.geometry.coordinates), { units: "kilometers" });
        return {
          ...f,
          properties: { ...f.properties, distance_m: Math.round(dKm * 1000) },
        };
      });

    const collection = { type: "FeatureCollection", features: inside } as GeoJSON.FeatureCollection;

    const src = map.getSource("pois") as mapboxgl.GeoJSONSource | undefined;
    if (!src) {
      map.addSource("pois", { type: "geojson", data: collection });
      map.addLayer({
        id: "pois",
        type: "circle",
        source: "pois",
        paint: { "circle-radius": 6, "circle-stroke-width": 1, "circle-stroke-color": "#FFFFFF" },
      });

      map.on("click", "pois", (e) => {
        const f = e.features?.[0] as any;
        if (!f) return;
        const [lng, lat] = f.geometry.coordinates;
        const name = f.properties?.name ?? "Place";
        const srcName = f.properties?.source ?? "source";
        new mapboxgl.Popup()
          .setLngLat([lng, lat])
          .setHTML(`<strong>${escapeHtml(name)}</strong><br/><small>${escapeHtml(srcName)}</small>`)
          .addTo(map);
      });

      map.on("mouseenter", "pois", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "pois", () => (map.getCanvas().style.cursor = ""));
    } else {
      src.setData(collection as any);
    }

    cb.onResults?.(inside as PoiFeature[]);
  } catch (err: any) {
    cb.onFetchError?.(err?.message || "Failed to load POIs");
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]!));
}
