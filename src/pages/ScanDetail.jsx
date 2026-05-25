import { useEffect, useState } from "react";
import { useParams, Link, useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import ScoreBadge from "@/components/ScoreBadge";
import { ArrowLeft, FileText } from "lucide-react";
import { format } from "date-fns";
import { hasFeature } from "@/lib/tiers";

export default function ScanDetail() {
  const { id } = useParams();
  const { user } = useOutletContext();
  const [result, setResult] = useState(null);
  const [asset, setAsset] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    base44.entities.AnalysisResult.filter({ id }).then(async (rs) => {
      if (rs[0]) {
        setResult(rs[0]);
        const a = await base44.entities.InputAsset.filter({ id: rs[0].asset_id });
        setAsset(a[0]);
      }
    });
  }, [id]);

  if (!result) return <div className="p-12 text-[#1A1814]/40">Loading…</div>;

  const generateReport = async () => {
    if (!hasFeature(user, "reports_md")) return;
    setGeneratingReport(true);
    const md = `# ${asset?.title || "Signal Report"}\n\n**Verdict:** ${result.verdict} (score ${result.score}/100, confidence ${result.confidence}/100)\n\n## Summary\n${result.explanation}\n\n## Topics\n${(result.topics || []).map(t => `- ${t}`).join("\n")}\n\n## Entities\n${(result.entities || []).map(e => `- ${e}`).join("\n")}\n`;
    const report = await base44.entities.Report.create({
      title: asset?.title || `Report · ${format(new Date(), "MMM d HH:mm")}`,
      summary: result.explanation,
      evidence: result.entities || [],
      next_actions: ["Cross-check with primary sources", "Monitor topic momentum", "Re-scan if revised"],
      linked_asset_ids: [asset.id],
      markdown: md,
    });
    window.location.href = `/reports#${report.id}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-12 py-12 pb-24">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-[#1A1814]/60 hover:text-[#1A1814] mb-8">
        <ArrowLeft className="w-3 h-3" /> Back
      </Link>

      <div className="text-[10px] uppercase tracking-[0.22em] text-[#1A1814]/50 mb-2">
        Analysis · {format(new Date(result.created_date), "MMM d, yyyy · HH:mm")}
      </div>
      <h1 className="font-serif text-4xl md:text-5xl tracking-tight leading-[1.05]">{asset?.title || "Untitled signal"}</h1>

      <div className="grid md:grid-cols-3 gap-8 mt-10">
        <div className="md:col-span-1 space-y-6">
          <div className="border border-[#1A1814]/10 rounded-lg p-6 bg-white/50">
            <ScoreBadge score={result.score} verdict={result.verdict} size="lg" />
            <div className="mt-6 pt-5 border-t border-[#1A1814]/10">
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1814]/50">Confidence</div>
              <div className="font-serif text-2xl mt-1">{result.confidence}%</div>
            </div>
          </div>
          {asset?.asset_type === "image" && asset.content_ref && (
            <img src={asset.content_ref} alt="" className="w-full rounded-lg border border-[#1A1814]/10" />
          )}
        </div>

        <div className="md:col-span-2 space-y-8">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1814]/50 mb-2">Analyst rationale</div>
            <p className="text-[15px] leading-relaxed text-[#1A1814]/85">{result.explanation}</p>
          </div>

          {result.topics?.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1814]/50 mb-3">Topics surfaced</div>
              <div className="flex flex-wrap gap-2">
                {result.topics.map((t, i) => (
                  <span key={i} className="px-3 py-1 bg-[#1A1814] text-[#FAF7F2] text-xs rounded-full">{t}</span>
                ))}
              </div>
            </div>
          )}

          {result.entities?.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1814]/50 mb-3">Entities</div>
              <div className="flex flex-wrap gap-2">
                {result.entities.map((e, i) => (
                  <span key={i} className="px-3 py-1 border border-[#1A1814]/15 text-xs rounded-full">{e}</span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={generateReport}
            disabled={!hasFeature(user, "reports_md") || generatingReport}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#1A1814] text-[#FAF7F2] rounded-md hover:bg-[#1A1814]/85 transition disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            {hasFeature(user, "reports_md") ? (generatingReport ? "Generating…" : "Generate report") : "Reports require Pro"}
          </button>
        </div>
      </div>
    </div>
  );
}