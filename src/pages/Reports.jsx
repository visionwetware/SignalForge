import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import LockedFeature from "@/components/LockedFeature";
import { hasFeature } from "@/lib/tiers";
import { Download, FileText } from "lucide-react";
import { format } from "date-fns";

export default function Reports() {
  const { user } = useOutletContext();
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    base44.entities.Report.list("-created_date", 50).then((r) => {
      setReports(r);
      const hashId = window.location.hash.slice(1);
      setSelected(r.find((x) => x.id === hashId) || r[0] || null);
    });
  }, []);

  const download = (report) => {
    const blob = new Blob([report.markdown || ""], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.title.replace(/\s+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!hasFeature(user, "reports_md")) {
    return (
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-12">
        <PageHeader eyebrow="Reports" title="Assembled intelligence" />
        <LockedFeature feature="report generation and export" requiredTier="pro" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-12 py-12 pb-24">
      <PageHeader eyebrow="Reports" title="Assembled intelligence" description="Export-ready summaries forged from your analyses." />

      {reports.length === 0 ? (
        <div className="border border-dashed border-[#E6F7FF]/15 rounded-lg p-10 text-center text-[#E6F7FF]/50">
          No reports yet. Generate one from an analysis detail page.
        </div>
      ) : (
        <div className="grid md:grid-cols-[260px_1fr] gap-6">
          <div className="space-y-1.5">
            {reports.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className={`w-full text-left p-3 rounded-md border transition ${selected?.id === r.id ? "border-[#E6F7FF] bg-[#0D1026]" : "border-[#E6F7FF]/10 bg-[#0D1026]/70 hover:bg-[#121735]"}`}
              >
                <div className="text-[10px] uppercase tracking-[0.18em] text-[#E6F7FF]/50">{format(new Date(r.created_date), "MMM d")}</div>
                <div className="font-serif text-base mt-1 truncate">{r.title}</div>
              </button>
            ))}
          </div>

          {selected && (
            <div className="border border-[#E6F7FF]/10 rounded-lg bg-[#0D1026] p-8">
              <div className="flex items-start justify-between gap-4 pb-5 border-b border-[#E6F7FF]/10">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-[#E6F7FF]/50">Report</div>
                  <h2 className="font-serif text-3xl mt-1">{selected.title}</h2>
                </div>
                <button onClick={() => download(selected)} className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-[#E6F7FF]/15 rounded-md hover:bg-[#E6F7FF] hover:text-[#080A18] transition">
                  <Download className="w-3.5 h-3.5" /> Markdown
                </button>
              </div>

              <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed mt-6 text-[#E6F7FF]/85">
{selected.markdown}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}