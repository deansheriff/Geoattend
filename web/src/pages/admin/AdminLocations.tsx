import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { apiFetch } from "../../api/client";
import { MapContainer, TileLayer, Circle, Marker, Popup } from "react-leaflet";
import L from "leaflet";

const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

export default function AdminLocations() {
  const [locations, setLocations] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    apiFetch("/admin/locations").then((data) => {
      setLocations(data);
      if (data.length) setSelected(data[0]);
    });
  }, []);

  const center = useMemo(() => {
    if (!selected && locations.length) return [locations[0].latitude, locations[0].longitude];
    if (selected) return [selected.latitude, selected.longitude];
    return [37.7749, -122.4194];
  }, [selected, locations]);

  return (
    <AdminLayout title="Location Management">
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Geofences</h3>
              <p className="text-xs text-slate-500">{locations.length} active zones</p>
            </div>
            <button className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white">
              <span className="material-symbols-outlined text-sm">add</span>
              Add New
            </button>
          </div>
          <div className="p-4 space-y-3 max-h-[640px] overflow-y-auto">
            {locations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => setSelected(loc)}
                className={`w-full text-left rounded-xl border p-4 transition ${
                  selected?.id === loc.id
                    ? "border-primary bg-primary/5"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold">{loc.name}</div>
                    <div className="text-xs text-slate-500">{loc.address}</div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{loc.radiusMeters}m</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden min-h-[640px]">
          <MapContainer center={center as any} zoom={13} className="h-[640px] w-full">
            <TileLayer
              attribution="&copy; OpenStreetMap"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {locations.map((loc) => (
              <Circle
                key={loc.id}
                center={[loc.latitude, loc.longitude] as any}
                radius={loc.radiusMeters}
                pathOptions={{ color: loc.id === selected?.id ? "#2b8cee" : "#10b981" }}
              />
            ))}
            {locations.map((loc) => (
              <Marker key={`${loc.id}-marker`} position={[loc.latitude, loc.longitude] as any} icon={defaultIcon}>
                <Popup>{loc.name}</Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </AdminLayout>
  );
}