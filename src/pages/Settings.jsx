import { useOutletContext } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { TIERS, scanLimit } from "@/lib/tiers";
import { Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useState } from "react";

export default function Settings() {
  const { user, refreshUser } = useOutletContext();
  const [saving, setSaving] = useState(false);

  const setTier = async (tier) => {
    setSaving(true);
    await base44.auth.updateMe({ tier });
    refreshUser();
    setSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-12 py-12 pb-24">
      <PageHeader eyebrow="Settings" title="Profile & plan" description="Manage your account, language, and subscription tier." />

      <section className="mb-12">
        <h2 className="font-serif text-xl mb-4">Profile</h2>
        <div className="border border-[#1A1814]/10 rounded-lg p-6 bg-white/50 space-y-3">
          <Row label="Name" value={user?.full_name} />
          <Row label="Email" value={user?.email} />
          <Row label="Role" value={user?.role} />
          <Row label="Current tier" value={TIERS[user?.tier || "free"].label} />
          <Row label="Scans this month" value={`${user?.scans_this_month || 0} / ${scanLimit(user)}`} />
        </div>
      </section>

      <section>
        <h2 className="font-serif text-xl mb-4">Plans</h2>
        <p className="text-sm text-[#1A1814]/60 mb-5">Self-serve tier switcher for this demo build. In production, gate this behind billing.</p>
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(TIERS).map(([key, t]) => {
            const active = (user?.tier || "free") === key;
            return (
              <div key={key} className={`border rounded-lg p-6 transition ${active ? "border-[#1A1814] bg-white" : "border-[#1A1814]/10 bg-white/40"}`}>
                <div className="flex items-baseline justify-between">
                  <div className="font-serif text-2xl">{t.label}</div>
                  {active && <div className="text-[10px] uppercase tracking-[0.18em] text-[#D97706]">Current</div>}
                </div>
                <div className="text-xs text-[#1A1814]/60 mt-1">{t.scanLimit} scans/mo</div>
                <ul className="mt-5 space-y-1.5 text-sm">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[#1A1814]/75">
                      <Check className="w-3.5 h-3.5 text-[#3F6B3F]" /> {f.replace(/_/g, " ")}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setTier(key)}
                  disabled={active || saving}
                  className={`w-full mt-6 py-2.5 text-sm rounded-md transition ${active ? "bg-[#1A1814]/5 text-[#1A1814]/40" : "bg-[#1A1814] text-[#FAF7F2] hover:bg-[#1A1814]/85"}`}
                >
                  {active ? "Active" : `Switch to ${t.label}`}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-baseline py-2 border-b border-[#1A1814]/8 last:border-0">
      <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1814]/50">{label}</div>
      <div className="text-sm">{value || "—"}</div>
    </div>
  );
}