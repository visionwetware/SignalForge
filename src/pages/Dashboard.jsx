import { useEffect, useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import TopicCard from "@/components/TopicCard";
import ScoreBadge from "@/components/ScoreBadge";
import { ArrowRight, Scan } from "lucide-react";
import { format } from "date-fns";
import { scanLimit } from "@/lib/tiers";

export default function Dashboard() {
  const { user } = useOutletContext();
  const [results, setResults] = useState([]);
  const [topics, setTopics] = useState([]);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.AnalysisResult.list("-created_date", 6),
      base44.entities.Topic.list("-updated_date", 4),
      base44.entities.Report.list("-created_date", 3),
    ]).then(([r, t, rep]) => {
      setResults(r);
      setTopics(t);
      setReports(rep);
    });
  }, []);

  const limit = scanLimit(user);
  const used = user?.scans_this_month || 0;

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-12 py-12 pb-24">
      <PageHeader
        eyebrow={`Welcome, ${user?.full_name?.split(" ")[0] || "Analyst"}`}
        title="The signal floor"
        description="A live cross-section of your scans, tracked topics, and assembled intelligence."
        action={
          <Link to="/scan" className="inline-flex items-center gap-2 px-5 py-3 bg-[#1A1814] text-[#FAF7F2] rounded-md hover:bg-[#1A1814]/85 transition group">
            <Scan className="w-4 h-4" />
            <span>New scan</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
        <StatCard label="Scans this month" value={`${used}/${limit}`} hint={`${Math.max(0, limit - used)} remaining`} />
        <StatCard label="Tracked topics" value={topics.length} hint="Active signals" />
        <StatCard label="Anomalies" value={topics.filter(t => t.anomaly_flag).length} accent="#B8860B" hint="Worth a closer look" />
        <StatCard label="Reports" value={reports.length} hint="Recent intelligence" />
      </div>

      {/* Recent scans */}
      <section className="mb-14">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-serif text-2xl">Recent analyses</h2>
          <Link to="/scan" className="text-xs uppercase tracking-[0.18em] text-[#1A1814]/60 hover:text-[#1A1814]">View all →</Link>
        </div>
        {results.length === 0 ? (
          <EmptyState text="No analyses yet" cta={<Link to="/scan" className="underline">Run your first scan</Link>} />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((r) => (
              <Link key={r.id} to={`/scan/${r.id}`} className="border border-[#1A1814]/10 rounded-lg p-5 bg-white/40 hover:bg-white hover:border-[#1A1814]/30 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1814]/50">{format(new Date(r.created_date), "MMM d · HH:mm")}</div>
                    <div className="font-serif text-lg mt-1 line-clamp-2">{r.explanation?.slice(0, 80) || "Analysis"}</div>
                  </div>
                  <ScoreBadge score={r.score} verdict={r.verdict} size="sm" />
                </div>
                {r.topics?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {r.topics.slice(0, 3).map((t, i) => (
                      <span key={i} className="text-[10px] uppercase tracking-[0.12em] px-2 py-0.5 bg-[#1A1814]/5 rounded">{t}</span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Topics */}
      <section>
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-serif text-2xl">Topic movement</h2>
          <Link to="/topics" className="text-xs uppercase tracking-[0.18em] text-[#1A1814]/60 hover:text-[#1A1814]">All topics →</Link>
        </div>
        {topics.length === 0 ? (
          <EmptyState text="No tracked topics yet" />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {topics.map((t) => <TopicCard key={t.id} topic={t} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState({ text, cta }) {
  return (
    <div className="border border-dashed border-[#1A1814]/15 rounded-lg p-10 text-center text-[#1A1814]/50 bg-white/20">
      <div className="text-sm">{text}</div>
      {cta && <div className="mt-2 text-sm">{cta}</div>}
    </div>
  );
}