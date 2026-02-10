import { useEffect, useState } from "react";
import EmployeeLayout from "../../components/EmployeeLayout";
import { apiFetch } from "../../api/client";

export default function EmployeeHistory() {
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    apiFetch("/employee/attendance").then(setRecords).catch(() => setRecords([]));
  }, []);

  return (
    <EmployeeLayout title="Attendance History">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Past Records</h3>
            <p className="text-sm text-slate-500">Your attendance logs</p>
          </div>
          <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-bold">
            <span className="material-symbols-outlined text-sm">download</span>
            Export
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Clock-In</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Clock-Out</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Location</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-bold text-sm">{new Date(rec.date).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{new Date(rec.clockInAt).toLocaleTimeString()}</td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {rec.clockOutAt ? new Date(rec.clockOutAt).toLocaleTimeString() : "--"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{rec.location?.name ?? "Unknown"}</td>
                  <td className="px-6 py-4 text-sm font-bold">
                    {rec.totalMinutes ? `${Math.round(rec.totalMinutes / 60)}h ${rec.totalMinutes % 60}m` : "--"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </EmployeeLayout>
  );
}