import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import { apiFetch, apiFetchForm, ROOT_URL } from "../../api/client";

type Settings = {
  id: string;
  name: string;
  address?: string | null;
  logoPath?: string | null;
};

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const load = async () => {
    const data = await apiFetch("/admin/settings");
    setSettings(data);
    setName(data.name || "");
    setAddress(data.address || "");
  };

  useEffect(() => {
    load().catch(() => setStatus("Failed to load settings"));
  }, []);

  const onSave = async () => {
    setStatus(null);
    await apiFetch("/admin/settings", {
      method: "PATCH",
      body: JSON.stringify({ name, address })
    });
    setStatus("Settings saved");
    load();
  };

  const onUpload = async () => {
    if (!logoFile) return;
    setStatus(null);
    const form = new FormData();
    form.append("logo", logoFile);
    await apiFetchForm("/admin/settings/logo", form);
    setLogoFile(null);
    setStatus("Logo updated");
    load();
  };

  const logoUrl = settings?.logoPath ? `${ROOT_URL}/uploads/${settings.logoPath}` : null;

  return (
    <AdminLayout title="Settings">
      <div className="mb-10 flex justify-between items-end">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-black font-display text-primary tracking-tighter mb-2">Platform Settings</h1>
          <p className="text-primary/60 text-lg">Configure global application preferences and branding.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 font-display h-[calc(100vh-200px)] min-h-[600px]">
        <div className="bg-surface-container-low rounded-[2rem] border border-black/5 p-8 shadow-sm flex flex-col">
          <div className="mb-8">
            <h3 className="text-2xl font-bold font-display text-primary tracking-tight">Company Profile</h3>
            <p className="text-xs font-semibold text-primary/50 mt-1">Manage core organization details</p>
          </div>
          <div className="space-y-6 flex-1">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-primary/50 uppercase tracking-widest ml-4">Company Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface-container-highest border-none rounded-2xl px-6 py-4 text-primary font-semibold focus:ring-2 focus:ring-[#E69D45] transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-primary/50 uppercase tracking-widest ml-4">Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={5}
                className="w-full bg-surface-container-highest border-none rounded-2xl px-6 py-4 text-primary font-semibold focus:ring-2 focus:ring-[#E69D45] transition-all resize-none"
              />
            </div>
          </div>
          <div className="pt-8 border-t border-primary/5 mt-8 flex items-center justify-between">
            {status && (
                <div className="text-xs font-bold text-primary bg-primary/5 px-4 py-3 rounded-xl flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-primary">info</span>
                    {status}
                </div>
            )}
            <button
              onClick={onSave}
              className="ml-auto rounded-full bg-primary text-on-primary h-[54px] px-8 text-xs uppercase tracking-widest font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              Save Changes
            </button>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-[2rem] border border-black/5 p-8 shadow-sm flex flex-col h-min">
          <div className="mb-8 text-center">
            <h3 className="text-2xl font-bold font-display text-primary tracking-tight">Brand Identity</h3>
            <p className="text-xs font-semibold text-primary/50 mt-1">Application logo settings</p>
          </div>
          <div className="flex flex-col items-center justify-center space-y-8">
            <div className="h-48 w-48 rounded-[2rem] border-2 border-dashed border-primary/20 overflow-hidden bg-surface-container-highest flex items-center justify-center p-4 relative group transition-all hover:border-[#E69D45]/50">
              {logoUrl ? (
                <img src={logoUrl} alt="Company logo" className="h-full w-full object-contain mix-blend-multiply" />
              ) : (
                <div className="text-center">
                  <span className="material-symbols-outlined text-5xl text-primary/20 mb-3 block">image</span>
                  <div className="text-[10px] font-black text-primary/30 uppercase tracking-widest">No Logo Set</div>
                </div>
              )}
            </div>
            
            <div className="w-full space-y-4">
              <label className="block w-full text-center">
                <span className="cursor-pointer block w-full rounded-2xl bg-surface-container-highest hover:bg-black/5 py-4 px-6 text-sm font-bold text-primary transition-all text-ellipsis overflow-hidden whitespace-nowrap">
                  {logoFile ? logoFile.name : "Select new image"}
                </span>
                <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} className="hidden" />
              </label>
              
              <button
                onClick={onUpload}
                disabled={!logoFile}
                className="w-full rounded-full bg-secondary text-on-secondary h-[54px] text-xs uppercase tracking-widest font-bold shadow-lg shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">upload</span>
                Upload
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
