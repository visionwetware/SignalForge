import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import { BookOpen, ArrowRight, Trophy } from "lucide-react";
import { hasFeature } from "@/lib/tiers";
import LockedFeature from "@/components/LockedFeature";
import { format } from "date-fns";

export default function Learn() {
  const { user } = useOutletContext();
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    base44.entities.Session.list("-created_date", 5).then(setSessions);
  }, []);

  const accuracy = sessions.length > 0
    ? Math.round(sessions.reduce((a, s) => a + (s.correct_count / Math.max(1, s.total_count)), 0) / sessions.length * 100)
    : 0;

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-12 py-12 pb-24">
      <PageHeader
        eyebrow="Learn"
        title="Practice your eye"
        description="Sharpen pattern recognition with curated questions on signals, sources, and reasoning."
        action={
          <Link to="/learn/practice" className="inline-flex items-center gap-2 px-5 py-3 bg-[#1A1814] text-[#FAF7F2] rounded-md hover:bg-[#1A1814]/85 transition">
            <BookOpen className="w-4 h-4" /> Start practice <ArrowRight className="w-4 h-4" />
          </Link>
        }
      />

      <div className="grid md:grid-cols-2 gap-6">
        <div className="border border-[#1A1814]/10 rounded-lg p-6 bg-white/50">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1814]/50">Recent sessions</div>
          <div className="font-serif text-4xl mt-2">{sessions.length}</div>
          {sessions.length > 0 ? (
            <ul className="mt-5 space-y-2 text-sm">
              {sessions.map((s) => (
                <li key={s.id} className="flex justify-between text-[#1A1814]/70 border-b border-[#1A1814]/8 pb-2 last:border-0">
                  <span>{s.topic || "General"}</span>
                  <span>{s.correct_count}/{s.total_count} · {format(new Date(s.created_date), "MMM d")}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-[#1A1814]/50 mt-4">No sessions yet — start one above.</div>
          )}
        </div>

        <div className="border border-[#1A1814]/10 rounded-lg p-6 bg-white/50">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1814]/50">Accuracy</div>
          <div className="font-serif text-4xl mt-2">{accuracy}%</div>
          {hasFeature(user, "learn_analytics") ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-[#1A1814]/70">
              <Trophy className="w-4 h-4 text-[#D97706]" />
              Advanced learning analytics enabled.
            </div>
          ) : (
            <div className="mt-4 text-sm text-[#1A1814]/55">
              Upgrade to Pro for detailed learning analytics, topic breakdowns, and difficulty curves.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}