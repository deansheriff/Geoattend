import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Circle, Marker } from "react-leaflet";
import L from "leaflet";
import EmployeeLayout from "../../components/EmployeeLayout";
import { apiFetch, apiFetchForm } from "../../api/client";
import { haversineMeters } from "../../utils/geo";

const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

export default function EmployeeClock() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [breakActive, setBreakActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);

  const enablePhoto = String(import.meta.env.VITE_ENABLE_PHOTO_CAPTURE || "false") === "true";

  useEffect(() => {
    apiFetch("/employee/locations").then(setLocations);
    apiFetch("/employee/status").then(setStatus);

    const watch = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        setError(err.message);
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watch);
  }, []);

  const nearest = useMemo(() => {
    if (!coords || locations.length === 0) return null;
    let closest: any = null;
    let distance = Infinity;
    for (const loc of locations) {
      const d = haversineMeters(coords.lat, coords.lng, loc.latitude, loc.longitude);
      if (d < distance) {
        distance = d;
        closest = loc;
      }
    }
    return closest ? { location: closest, distance } : null;
  }, [coords, locations]);

  const within = useMemo(() => {
    if (!nearest) return false;
    return nearest.distance <= nearest.location.radiusMeters + 20;
  }, [nearest]);

  const onClock = async (type: "in" | "out") => {
    if (!coords) return;
    setError(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.append("latitude", String(coords.lat));
      form.append("longitude", String(coords.lng));
      if (enablePhoto && photo) {
        form.append("photo", photo);
      }
      const res = await apiFetchForm(`/employee/clock-${type}`, form);
      setStatus({ active: type === "in", record: res.record });
      setBreakActive(false);
    } catch (err: any) {
      setError(err.message || "Clock action failed");
    } finally {
      setLoading(false);
    }
  };

  const onBreak = async (type: "start" | "end") => {
    setError(null);
    setLoading(true);
    try {
      await apiFetch(`/employee/break-${type}`, { method: "POST" });
      setBreakActive(type === "start");
    } catch (err: any) {
      setError(err.message || "Break action failed");
    } finally {
      setLoading(false);
    }
  };

  const center = coords ? [coords.lat, coords.lng] : [37.7749, -122.4194];

  return (
    <EmployeeLayout title="Clock In / Out">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="h-72">
            <MapContainer center={center as any} zoom={15} className="h-full w-full">
              <TileLayer
                attribution="&copy; OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {coords && <Marker position={[coords.lat, coords.lng] as any} icon={defaultIcon} />}
              {locations.map((loc) => (
                <Circle
                  key={loc.id}
                  center={[loc.latitude, loc.longitude] as any}
                  radius={loc.radiusMeters}
                  pathOptions={{ color: "#2b8cee" }}
                />
              ))}
            </MapContainer>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <div className="text-sm text-slate-500">Nearest allowed location</div>
              <div className="font-semibold">
                {nearest ? `${nearest.location.name} (${Math.round(nearest.distance)}m)` : "--"}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
                  within ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {within ? "verified" : "error"}
                </span>
                {within ? "Within Range" : "Outside Geofence"}
              </span>
              {status?.active && (
                <span className="text-xs text-slate-500">Clocked in at {new Date(status.record.clockInAt).toLocaleTimeString()}</span>
              )}
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                disabled={!within || loading || status?.active}
                onClick={() => onClock("in")}
                className="flex-1 h-14 rounded-full bg-primary text-white font-bold text-lg disabled:opacity-50"
              >
                Clock In
              </button>
              <button
                disabled={!within || loading || !status?.active}
                onClick={() => onClock("out")}
                className="flex-1 h-14 rounded-full bg-slate-900 text-white font-bold text-lg disabled:opacity-50"
              >
                Clock Out
              </button>
            </div>
            {enablePhoto && (
              <div className="pt-2">
                <label className="text-xs font-semibold text-slate-500">Photo (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                  className="mt-1 block text-sm"
                />
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-lg font-bold">Current Status</h3>
          <div className="text-sm text-slate-500">{status?.active ? "Clocked In" : "Clocked Out"}</div>
          <div className="text-3xl font-black text-primary">
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div className="text-xs text-slate-500">Live location updates enabled</div>
          <div className="pt-2 space-y-2">
            <button
              disabled={!status?.active || breakActive || loading}
              onClick={() => onBreak("start")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold disabled:opacity-50"
            >
              Start Break
            </button>
            <button
              disabled={!status?.active || !breakActive || loading}
              onClick={() => onBreak("end")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold disabled:opacity-50"
            >
              End Break
            </button>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
