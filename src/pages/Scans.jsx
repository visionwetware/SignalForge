import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import ScoreBadge from "@/components/ScoreBadge";
import { Scan, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { scanLimit } from "@/lib/tiers";

export default function Scans() {
  const { user } = useOutletContext();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.AnalysisResult.list("-created_date", 100).then((r) => {
      setResults(r);
      setLoading(false);
    });
  }, []);

  const limit = scanLimit(user);
  const used = user?.scans_this_month || 0;

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-12 py-12 pb-24">
      <PageHeader
        eyebrow="Scan history"
        title="Every Curio you've captured"
        description={`${used} of ${limit} scans used this month · ${results.length} total in your library.`}
        action={
          <Link to="/scan" className="inline-flex items-center gap-2 px-5 py-3 bg-[#E6F7FF] text-[#080A18] rounded-md hover:bg-[#E6F7FF]/85 transition group">
            <Scan className="w-4 h-4" />
            <span>New scan</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        }
      />

      {loading ? (
        <div className="text-[#E6F7FF]/40">Loading…</div>
      ) : results.length === 0 ? (
        <div className="border border-dashed border-[#E6F7FF]/15 rounded-lg p-12 text-center text-[#E6F7FF]/50 bg-[#0D1026]/50">
          <div className="text-sm">No analyses yet</div>
          <Link to="/scan" className="text-sm underline mt-2 inline-block">Run your first scan</Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {results.map((r) => (
            <Link key={r.id} to={`/scan/${r.id}`} className="border border-[#E6F7FF]/10 rounded-lg p-5 bg-[#0D1026]/70 hover:bg-[#121735] hover:border-[#E6F7FF]/30 transition">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[#E6F7FF]/50">{format(new Date(r.created_date), "MMM d · HH:mm")}</div>
                  <div className="font-serif text-lg mt-1 line-clamp-2">{r.explanation?.slice(0, 100) || "Analysis"}</div>
                </div>
                <ScoreBadge score={r.score} verdict={r.verdict} size="sm" />
              </div>
              {r.ai_verdict && (
                <div className="mt-3 text-[10px] uppercase tracking-[0.14em] text-[#E6F7FF]/45">
                  AI likelihood · {Math.round(r.ai_likelihood || 0)}%
                </div>
              )}
              {r.topics?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {r.topics.slice(0, 4).map((t, i) => (
                    <span key={i} className="text-[10px] uppercase tracking-[0.12em] px-2 py-0.5 bg-[#E6F7FF]/5 rounded">{t}</span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}