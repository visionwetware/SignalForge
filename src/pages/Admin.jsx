import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import { TIERS } from "@/lib/tiers";
import { Shield } from "lucide-react";

export default function Admin() {
  const { user } = useOutletContext();
  const [users, setUsers] = useState([]);
  const [scans, setScans] = useState(0);

  useEffect(() => {
    if (user?.role !== "admin") return;
    base44.entities.User.list().then(setUsers);
    base44.entities.AnalysisResult.list().then((r) => setScans(r.length));
  }, [user]);

  if (user?.role !== "admin") {
    return (
      <div className="max-w-3xl mx-auto px-6 md:px-12 py-20 text-center">
        <Shield className="w-8 h-8 text-[#1A1814]/40 mx-auto mb-4" />
        <div className="font-serif text-2xl">Admin only</div>
        <p className="text-sm text-[#1A1814]/55 mt-2">You need admin access to view this area.</p>
      </div>
    );
  }

  const updateTier = async (id, tier) => {
    await base44.entities.User.update(id, { tier });
    base44.entities.User.list().then(setUsers);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-12 py-12 pb-24">
      <PageHeader eyebrow="Admin" title="Plan & usage controls" description="Manage user tiers and view system usage." />

      <div className="grid grid-cols-3 gap-4 mb-10">
        <Metric label="Users" value={users.length} />
        <Metric label="Total scans" value={scans} />
        <Metric label="Premium" value={users.filter(u => u.tier === "premium").length} />
      </div>

      <div className="border border-[#1A1814]/10 rounded-lg bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#1A1814]/5 text-[10px] uppercase tracking-[0.18em] text-[#1A1814]/60">
            <tr>
              <th className="text-left py-3 px-4">User</th>
              <th className="text-left py-3 px-4">Email</th>
              <th className="text-left py-3 px-4">Role</th>
              <th className="text-left py-3 px-4">Tier</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-[#1A1814]/8">
                <td className="py-3 px-4">{u.full_name}</td>
                <td className="py-3 px-4 text-[#1A1814]/70">{u.email}</td>
                <td className="py-3 px-4">{u.role}</td>
                <td className="py-3 px-4">
                  <select
                    value={u.tier || "free"}
                    onChange={(e) => updateTier(u.id, e.target.value)}
                    className="px-2 py-1 bg-[#1A1814]/5 rounded border-none text-sm"
                  >
                    {Object.entries(TIERS).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="border border-[#1A1814]/10 rounded-lg p-5 bg-white/50">
      <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1814]/50">{label}</div>
      <div className="font-serif text-3xl mt-2">{value}</div>
    </div>
  );
}