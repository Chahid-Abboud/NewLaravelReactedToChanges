import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L, { type LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icons (Vite)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import BackHomeButton from "@/components/BackHomeButton";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom emoji pins
const gymIcon = new L.DivIcon({
  className: "gym-pin",
  html: "🏋️",
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

const nutriIcon = new L.DivIcon({
  className: "nutri-pin",
  html: "🥗",
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

type Place = {
  id: number;
  type: "gym" | "nutritionist";
  name?: string;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
};

const RADIUS_METERS = 1500;

function FitCircleBounds({ center, radius }: { center: LatLngExpression; radius: number }) {
  const map = useMap();
  useEffect(() => {
    const c = L.latLng(center);
    const bounds = c.toBounds(radius * 2);
    map.fitBounds(bounds, { padding: [20, 20] });
  }, [center, radius, map]);
  return null;
}

export default function NearbyMap() {
  const [center, setCenter] = useState<LatLngExpression | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by this browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const c: LatLngExpression = [lat, lon];
        setCenter(c);

        try {
          const resp = await fetch(`/api/nearby?lat=${lat}&lon=${lon}&radius=${RADIUS_METERS}`);
          if (!resp.ok) {
            let msg = `Failed to load nearby places (HTTP ${resp.status})`;
            try {
              const err = await resp.json();
              if (err?.error) msg += `: ${err.error}`;
            } catch {}
            throw new Error(msg);
          }
          const data = await resp.json();
          setPlaces((data?.results ?? []) as Place[]);
        } catch (e: any) {
          setError(e?.message ?? "Failed to fetch nearby places");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError(err.message || "Unable to retrieve your location");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  if (loading) return <div className="flex items-center justify-center h-[80vh]">Loading map…</div>;
  if (error) return <div className="flex items-center justify-center h-[80vh] text-red-600">{error}</div>;
  if (!center) return <div className="flex items-center justify-center h-[80vh]">Location not available.</div>;

  return (
    <div style={{ position: "relative", height: "calc(100vh - 80px)" }}>
      <MapContainer center={center} zoom={15} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors'
        />

        <FitCircleBounds center={center} radius={RADIUS_METERS} />
        <Circle center={center} radius={RADIUS_METERS} />

        <Marker position={center}>
          <Popup>You are here</Popup>
        </Marker>

        {places.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lon]} icon={p.type === "gym" ? gymIcon : nutriIcon}>
            <Popup>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                {p.name || (p.type === "gym" ? "Gym" : "Nutritionist")}
              </div>
              <div style={{ fontSize: 12, color: "#555" }}>{p.tags?.brand || p.tags?.operator || ""}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend (bottom-right) */}
      <div
        style={{
          position: "absolute",
          right: 12,
          bottom: 12,
          background: "white",
          borderRadius: 8,
          padding: "8px 10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          fontSize: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 18 }}>🏋️</span> <span>Gym</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>🥗</span> <span>Nutritionist</span>
        </div>
      </div>
    </div>
  );
}
