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
  const [form, setForm] = useState({
    id: "",
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    radiusMeters: "100"
  });
  const [error, setError] = useState<string | null>(null);

  const loadAll = async () => {
    const data = await apiFetch("/admin/locations");
    setLocations(data);
    if (data.length && !selected) setSelected(data[0]);
  };

  useEffect(() => {
    loadAll().catch(() => setError("Failed to load locations"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const center = useMemo(() => {
    if (!selected && locations.length) return [locations[0].latitude, locations[0].longitude];
    if (selected) return [selected.latitude, selected.longitude];
    return [37.7749, -122.4194];
  }, [selected, locations]);

  const resetForm = () =>
    setForm({ id: "", name: "", address: "", latitude: "", longitude: "", radiusMeters: "100" });

  const onSubmit = async () => {
    setError(null);
    if (!form.name || !form.address || !form.latitude || !form.longitude) {
      setError("Name, address, and coordinates are required");
      return;
    }
    const payload = {
      name: form.name,
      address: form.address,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      radiusMeters: Number(form.radiusMeters)
    };
    if (form.id) {
      await apiFetch(`/admin/locations/${form.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
    } else {
      await apiFetch("/admin/locations", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }
    resetForm();
    loadAll().catch(() => setError("Failed to refresh locations"));
  };

  const onDeactivate = async (id: string) => {
    await apiFetch(`/admin/locations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ active: false })
    });
    loadAll().catch(() => setError("Failed to refresh locations"));
  };

  return (
    <AdminLayout title="Location Management">
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Geofences</h3>
              <p className="text-xs text-slate-500">{locations.length} active zones</p>
            </div>
            <button
              onClick={resetForm}
              className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white"
            >
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

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden min-h-[420px]">
            <MapContainer center={center as any} zoom={13} className="h-[420px] w-full">
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

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold mb-3">{form.id ? "Edit Location" : "Add Location"}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Address</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500">Latitude</label>
                  <input
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Longitude</label>
                  <input
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Radius (meters)</label>
                <input
                  value={form.radiusMeters}
                  onChange={(e) => setForm({ ...form, radiusMeters: e.target.value })}
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button onClick={onSubmit} className="w-full rounded-lg bg-primary text-white py-2 text-sm font-bold">
                {form.id ? "Save Changes" : "Create Location"}
              </button>
              {form.id && (
                <button
                  onClick={() => onDeactivate(form.id)}
                  className="w-full rounded-lg border border-red-200 text-red-600 py-2 text-sm font-bold"
                >
                  Deactivate Location
                </button>
              )}
            </div>
          </div>

          {selected && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold">Selected Location</h3>
              <p className="text-sm text-slate-500">{selected.name}</p>
              <div className="mt-3 text-xs text-slate-500">Address: {selected.address}</div>
              <div className="text-xs text-slate-500">Radius: {selected.radiusMeters}m</div>
              <button
                onClick={() =>
                  setForm({
                    id: selected.id,
                    name: selected.name,
                    address: selected.address,
                    latitude: String(selected.latitude),
                    longitude: String(selected.longitude),
                    radiusMeters: String(selected.radiusMeters)
                  })
                }
                className="mt-4 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold"
              >
                Edit Selected
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
