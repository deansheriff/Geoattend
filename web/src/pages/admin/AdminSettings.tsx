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
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-lg font-bold">Company Profile</h3>
          <div>
            <label className="text-xs font-semibold text-slate-500">Company Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button onClick={onSave} className="rounded-lg bg-primary text-white py-2 text-sm font-bold">
            Save Changes
          </button>
          {status && <p className="text-sm text-slate-500">{status}</p>}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-lg font-bold">Company Logo</h3>
          <div className="h-32 w-32 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
            {logoUrl ? <img src={logoUrl} alt="Company logo" className="h-full w-full object-cover" /> : "No Logo"}
          </div>
          <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
          <button
            onClick={onUpload}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold"
          >
            Upload Logo
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
