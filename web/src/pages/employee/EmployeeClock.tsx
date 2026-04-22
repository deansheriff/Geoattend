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
      <div className="md:mb-10 mb-6 mt-2 hidden md:block">
        <h1 className="text-4xl md:text-5xl font-black font-display text-primary tracking-tighter mb-2">Time Clock</h1>
        <p className="text-primary/60 text-lg">Manage your daily shifts and breaks.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 font-display h-full">
        {/* Main Clock Card */}
        <div className="bg-surface-container-low rounded-[2.5rem] border border-black/5 overflow-hidden flex flex-col shadow-sm">
          {/* Map Section */}
          <div className="h-48 sm:h-72 w-full relative z-0">
            <MapContainer center={center as any} zoom={15} className="h-full w-full z-0" zoomControl={false}>
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
              />
              {coords && <Marker position={[coords.lat, coords.lng] as any} icon={defaultIcon} />}
              {locations.map((loc) => (
                <Circle
                  key={loc.id}
                  center={[loc.latitude, loc.longitude] as any}
                  radius={loc.radiusMeters}
                  pathOptions={{ color: "#3a6846", fillColor: "#3a6846", fillOpacity: 0.2 }} // Forest Green
                />
              ))}
            </MapContainer>
            
            {/* Live Status Overlay */}
            <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
                <div className="bg-surface/80 backdrop-blur-md rounded-2xl px-4 py-3 shadow-lg pointer-events-auto border border-white/20">
                     <h3 className="text-[10px] font-black text-primary/50 uppercase tracking-widest mb-0.5">Current Time</h3>
                     <div className="text-2xl font-black text-primary tracking-tighter">
                         {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                     </div>
                </div>
                
                <div className={`pointer-events-auto px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg border backdrop-blur-md ${status?.active ? "bg-secondary-container/90 text-on-secondary-container border-secondary/20" : "bg-surface/90 text-primary/60 border-black/10"}`}>
                  <span className="flex items-center gap-1.5">
                      {status?.active && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-secondary text-on-secondary"></span></span>}
                      {status?.active ? "Active Shift" : "Off Duty"}
                  </span>
                </div>
            </div>
          </div>
          
          <div className="p-6 md:p-8 relative z-10 bg-surface-container-low flex flex-col flex-1">
            <div className="flex flex-col gap-4 mb-8">
              <div>
                <div className="text-[10px] font-black text-primary/40 uppercase tracking-widest mb-1.5 ml-1">Location Status</div>
                <div className="flex items-center justify-between bg-surface-container-highest rounded-2xl p-4 border-none">
                    <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-xl flex items-center justify-center border ${within ? 'bg-[#3a6846]/10 border-[#3a6846]/20 text-[#3a6846]' : 'bg-error-container border-error/10 text-error'}`}>
                            <span className="material-symbols-outlined text-[20px]">{within ? 'location_on' : 'location_off'}</span>
                        </div>
                        <div>
                            <div className="text-[11px] font-bold text-primary/50">Nearest Zone</div>
                            <div className="font-bold text-base text-primary tracking-tight">
                              {nearest ? nearest.location.name : "Searching..."}
                            </div>
                        </div>
                    </div>
                    {nearest && (
                        <div className="text-right">
                           <div className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">Distance</div>
                           <div className={`font-black tracking-tight ${within ? 'text-[#3a6846]' : 'text-error'}`}>{Math.round(nearest.distance)}m</div>
                        </div>
                    )}
                </div>
              </div>
            </div>

            {error && <div className="mb-6 text-xs font-bold text-error bg-error-container p-4 rounded-xl flex items-start gap-2 border border-error/10"><span className="material-symbols-outlined text-[16px] mt-0.5">error</span> {error}</div>}
            
            <div className="mt-auto grid grid-cols-2 gap-4 pb-2">
              <button
                disabled={!within || loading || status?.active}
                onClick={() => onClock("in")}
                className="col-span-2 h-[4.5rem] rounded-[2rem] bg-secondary text-on-secondary font-black text-base uppercase tracking-widest shadow-xl shadow-secondary/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 disabled:shadow-none flex items-center justify-center gap-3"
              >
                <span className="material-symbols-outlined text-[24px]">login</span>
                Clock In
              </button>
              <button
                disabled={!status?.active || breakActive || loading}
                onClick={() => onBreak("start")}
                className="h-16 rounded-[1.5rem] bg-tertiary-container text-on-tertiary-container font-bold text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 flex items-center justify-center gap-2 border border-tertiary/10 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">free_breakfast</span>
                Break
              </button>
              <button
                disabled={!within || loading || !status?.active}
                onClick={() => onClock("out")}
                className="h-16 rounded-[1.5rem] bg-error-container text-on-error-container font-bold text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 flex items-center justify-center gap-2 border border-error/10 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Clock Out
              </button>
            </div>

            {enablePhoto && (
              <div className="mt-6 p-1 bg-surface-container-highest rounded-[1.5rem]">
                <label className="block w-full text-center relative overflow-hidden">
                  <span className="cursor-pointer flex items-center justify-center gap-2 h-14 w-full rounded-[1.25rem] hover:bg-black/5 text-xs font-bold text-primary transition-all uppercase tracking-widest">
                     <span className="material-symbols-outlined text-[18px] opacity-50">photo_camera</span>
                    {photo ? "Photo Attached" : "Add Photo"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Break Management / Status Info */}
        <div className="bg-surface-container-low rounded-[2.5rem] border border-black/5 p-8 flex flex-col shadow-sm h-min">
          <div className="text-center mb-8">
               <div className="h-16 w-16 mx-auto bg-surface-container-highest rounded-[2rem] flex items-center justify-center mb-4 rotate-3 transform-gpu">
                  <span className="material-symbols-outlined text-[32px] text-primary/40">timer</span>
               </div>
               <h3 className="text-2xl font-bold text-primary tracking-tight font-display">Shift Details</h3>
          </div>
          
          <div className="space-y-4 mb-8">
              <div className="bg-surface-container-highest rounded-2xl p-4 flex justify-between items-center">
                  <div className="text-[10px] font-black tracking-widest uppercase text-primary/50">Time In</div>
                  <div className="font-bold text-primary">
                      {status?.active ? new Date(status.record.clockInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                  </div>
              </div>
              <div className="bg-surface-container-highest rounded-2xl p-4 flex justify-between items-center">
                  <div className="text-[10px] font-black tracking-widest uppercase text-primary/50">Current Break</div>
                  <div className="font-bold text-primary">
                      {breakActive ? <span className="text-[#E69D45] animate-pulse">On Break</span> : "--"}
                  </div>
              </div>
          </div>
          
          <div className="pt-6 border-t border-primary/5 mt-auto">
              <button
                disabled={!status?.active || !breakActive || loading}
                onClick={() => onBreak("end")}
                className="w-full h-14 rounded-full bg-[#E69D45] text-primary font-black text-xs uppercase tracking-[0.15em] shadow-lg shadow-[#E69D45]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                Resume Work
              </button>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
