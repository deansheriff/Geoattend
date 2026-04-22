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
    try {
        if (form.id) {
          await apiFetch(`/admin/locations/${form.id}`, { method: "PATCH", body: JSON.stringify(payload) });
        } else {
          await apiFetch("/admin/locations", { method: "POST", body: JSON.stringify(payload) });
        }
        resetForm();
        loadAll().catch(() => setError("Failed to refresh locations"));
    } catch {
        setError("Failed to save location");
    }
  };

  const onDeactivate = async (id: string) => {
    await apiFetch(`/admin/locations/${id}`, { method: "PATCH", body: JSON.stringify({ active: false }) });
    loadAll().catch(() => setError("Failed to refresh locations"));
  };

  const onDelete = async (id: string) => {
    setError(null);
    await apiFetch(`/admin/locations/${id}`, { method: "DELETE" });
    if (selected?.id === id) setSelected(null);
    loadAll().catch(() => setError("Failed to refresh locations"));
  };

  return (
    <AdminLayout title="Locations">
      <div className="mb-10 flex justify-between items-end">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-black font-display text-primary tracking-tighter mb-2">Location Management</h1>
          <p className="text-primary/60 text-lg">Define geofences and physical premises where employees can clock in.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-8 font-display">
        {/* Left Side: List & Form */}
        <div className="flex flex-col gap-8 h-auto xl:h-[calc(100vh-200px)]">
          {/* Location Form */}
          <div className="bg-surface-container-low rounded-[2rem] border border-black/5 shadow-sm p-8 flex-shrink-0">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-primary tracking-tight">{form.id ? "Edit Geofence" : "Create New"}</h3>
                {form.id && (
                    <button onClick={resetForm} className="text-xs font-bold text-accent uppercase tracking-widest hover:underline">Cancel</button>
                )}
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary/50 ml-4">Location Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Headquarters"
                  className="w-full bg-surface-container-highest border-none rounded-2xl px-6 py-4 text-primary font-semibold focus:ring-2 focus:ring-[#E69D45] transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary/50 ml-4">Address</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="123 Main St..."
                  className="w-full bg-surface-container-highest border-none rounded-2xl px-6 py-4 text-primary font-semibold focus:ring-2 focus:ring-[#E69D45] transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary/50 ml-4">Lat</label>
                  <input
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                    className="w-full bg-surface-container-highest border-none rounded-2xl px-6 py-4 text-primary font-semibold focus:ring-2 focus:ring-[#E69D45] transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary/50 ml-4">Lng</label>
                  <input
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                    className="w-full bg-surface-container-highest border-none rounded-2xl px-6 py-4 text-primary font-semibold focus:ring-2 focus:ring-[#E69D45] transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary/50 ml-4">Radius (m)</label>
                <input
                  value={form.radiusMeters}
                  onChange={(e) => setForm({ ...form, radiusMeters: e.target.value })}
                  className="w-full bg-surface-container-highest border-none rounded-2xl px-6 py-4 text-primary font-semibold focus:ring-2 focus:ring-[#E69D45] transition-all"
                />
              </div>
              
              {error && <div className="text-sm font-bold text-error bg-error-container p-4 rounded-xl flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">error</span> {error}</div>}
              
              <div className="pt-4 flex gap-3 flex-col xl:flex-row">
                <button onClick={onSubmit} className="w-full rounded-full bg-[#E69D45] text-white py-4 text-xs tracking-widest uppercase font-bold shadow-xl shadow-[#E69D45]/20 hover:scale-[1.02] active:scale-95 transition-all">
                  {form.id ? "Save" : "Create"}
                </button>
                {form.id && (
                  <button onClick={() => onDeactivate(form.id)} className="w-full xl:w-auto px-6 rounded-full bg-surface-container-highest text-error font-bold text-xs uppercase tracking-widest hover:bg-error-container transition-all py-4 xl:py-0">
                    Disable
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* List of Locations */}
          <div className="bg-surface-container-low rounded-[2rem] border border-black/5 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[300px]">
            <div className="p-6 border-b border-primary/5">
                <h3 className="text-xl font-bold text-primary tracking-tight">Saved Regions</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {locations.length === 0 && (
                <p className="text-xs uppercase tracking-widest font-bold text-primary/30 text-center py-8">No regions created.</p>
              )}
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  className={`rounded-2xl p-4 transition-all cursor-pointer group flex justify-between items-center ${
                    selected?.id === loc.id
                      ? "bg-secondary-container text-on-secondary-container ring-1 ring-secondary/20"
                      : "bg-surface hover:bg-surface-container border border-primary/5"
                  }`}
                  onClick={() => setSelected(loc)}
                >
                  <div>
                    <div className="font-bold tracking-tight">{loc.name}</div>
                    <div className="text-[10px] font-semibold opacity-70 mt-0.5 max-w-[200px] truncate">{loc.address}</div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setForm({ id: loc.id, name: loc.name, address: loc.address, latitude: String(loc.latitude), longitude: String(loc.longitude), radiusMeters: String(loc.radiusMeters) });
                        }}
                        className="p-1.5 rounded-full hover:bg-black/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Edit Region"
                      >
                         <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(loc.id); }}
                        className="p-1.5 rounded-full hover:bg-error-container hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Region"
                      >
                         <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Map */}
        <div className="bg-surface-container-low rounded-[2rem] border border-black/5 overflow-hidden shadow-sm h-[500px] xl:h-auto relative z-0">
          <MapContainer center={center as any} zoom={13} className="h-full w-full z-0">
            <TileLayer
              attribution="&copy; OpenStreetMap"
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            {locations.map((loc) => (
              <Circle
                key={loc.id}
                center={[loc.latitude, loc.longitude] as any}
                radius={loc.radiusMeters}
                pathOptions={{ 
                    color: loc.id === selected?.id ? "#E69D45" : "#3a6846", 
                    weight: loc.id === selected?.id ? 3 : 1, 
                    fillColor: loc.id === selected?.id ? "#E69D45" : "#3a6846", 
                    fillOpacity: loc.id === selected?.id ? 0.3 : 0.1 
                }}
              />
            ))}
            {locations.map((loc) => (
              <Marker key={`${loc.id}-marker`} position={[loc.latitude, loc.longitude] as any} icon={defaultIcon}>
                <Popup>
                  <div className="font-bold font-display text-primary">{loc.name}</div>
                  <div className="text-xs text-primary/60">{loc.radiusMeters}m radius</div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </AdminLayout>
  );
}
