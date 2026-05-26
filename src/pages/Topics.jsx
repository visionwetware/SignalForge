import { useEffect, useState, useMemo } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import TopicCard from "@/components/TopicCard";
import LockedFeature from "@/components/LockedFeature";
import { hasFeature } from "@/lib/tiers";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format } from "date-fns";

export default function Topics() {
  const { user } = useOutletContext();
  const [searchParams] = useSearchParams();
  const filter = searchParams.get("filter");
  const [topics, setTopics] = useState([]);
  const [signals, setSignals] = useState([]);
  const [focus, setFocus] = useState(null);

  useEffect(() => {
    base44.entities.Topic.list("-momentum", 50).then((ts) => {
      setTopics(ts);
      if (ts[0]) setFocus(ts[0]);
    });
  }, []);

  const visibleTopics = useMemo(
    () => (filter === "anomaly" ? topics.filter((t) => t.anomaly_flag) : topics),
    [topics, filter]
  );

  useEffect(() => {
    if (!focus) return;
    base44.entities.TopicSignal.filter({ topic_id: focus.id }, "timestamp", 100).then(setSignals);
  }, [focus]);

  const chartData = signals.map(s => ({
    time: format(new Date(s.timestamp || s.created_date), "MMM d"),
    value: s.value,
  }));

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-12 py-12 pb-24">
      <PageHeader
        eyebrow={filter === "anomaly" ? "Anomalies" : "Topic intelligence"}
        title={filter === "anomaly" ? "Flagged anomalies" : "Tracked signals"}
        description={filter === "anomaly" ? "Topics with unusual movement worth a closer look." : "Direction, momentum, and anomalies across the topics your analyses surface."}
      />

      {topics.length === 0 ? (
        <div className="border border-dashed border-[#1A1814]/15 rounded-lg p-10 text-center text-[#1A1814]/50">
          No topics yet — run a scan to start tracking signals.
        </div>
      ) : (
        <>
          {focus && (
            <div className="border border-[#1A1814]/10 rounded-lg p-6 md:p-8 bg-white/50 mb-8">
              <div className="flex items-baseline justify-between mb-6">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1814]/50">{focus.category}</div>
                  <h2 className="font-serif text-3xl mt-1">{focus.name}</h2>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1814]/50">Current</div>
                  <div className="font-serif text-3xl">{Math.round(focus.current_value)}</div>
                </div>
              </div>

              {hasFeature(user, "topics_advanced") ? (
                <div className="h-48">
                  <ResponsiveContainer>
                    <LineChart data={chartData}>
                      <XAxis dataKey="time" stroke="#1A1814" strokeOpacity={0.3} fontSize={10} />
                      <YAxis stroke="#1A1814" strokeOpacity={0.3} fontSize={10} />
                      <Tooltip contentStyle={{ background: "#1A1814", border: "none", borderRadius: 6, color: "#FAF7F2", fontSize: 12 }} />
                      <Line type="monotone" dataKey="value" stroke="#D97706" strokeWidth={2} dot={{ r: 3, fill: "#D97706" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-sm text-[#1A1814]/60 bg-[#1A1814]/5 px-4 py-3 rounded-md">
                  Detailed timeline charts are a Pro feature.
                </div>
              )}
            </div>
          )}

          {visibleTopics.length === 0 ? (
            <div className="border border-dashed border-[#1A1814]/15 rounded-lg p-10 text-center text-[#1A1814]/50">
              No anomalies flagged right now.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleTopics.map((t) => (
                <div key={t.id} onClick={() => setFocus(t)} className="cursor-pointer">
                  <TopicCard topic={t} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}