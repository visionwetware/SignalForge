import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import ScanAnimation from "@/components/ScanAnimation";
import { analyzeAsset } from "@/lib/analyze";
import { canScan, scanLimit } from "@/lib/tiers";
import { Image, Link as LinkIcon, FileText, Upload } from "lucide-react";

const TABS = [
  { id: "image", label: "Image", icon: Image },
  { id: "url", label: "URL", icon: LinkIcon },
  { id: "text", label: "Text", icon: FileText },
];

export default function Scan() {
  const navigate = useNavigate();
  const { user, refreshUser } = useOutletContext();
  const [tab, setTab] = useState("image");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [fileUrl, setFileUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFileUrl(file_url);
    setUploading(false);
  };

  const submit = async () => {
    setError(null);
    if (!canScan(user)) {
      setError(`Monthly scan limit reached (${scanLimit(user)}). Upgrade in Settings.`);
      return;
    }
    const ref = tab === "image" ? fileUrl : content;
    if (!ref) { setError("Provide content to analyze."); return; }

    setAnalyzing(true);
    try {
      const asset = await base44.entities.InputAsset.create({
        asset_type: tab,
        source: tab === "image" ? "upload" : "manual",
        content_ref: ref,
        title: title || undefined,
      });

      const analysis = await analyzeAsset({ asset_type: tab, content_ref: ref, title });

      const result = await base44.entities.AnalysisResult.create({
        asset_id: asset.id,
        score: analysis.score,
        confidence: analysis.confidence,
        verdict: analysis.verdict,
        explanation: analysis.explanation,
        entities: analysis.entities || [],
        topics: analysis.topics || [],
        ai_likelihood: analysis.ai_likelihood,
        ai_confidence: analysis.ai_confidence,
        ai_verdict: analysis.ai_verdict,
        ai_signals: analysis.ai_signals || [],
        ai_explanation: analysis.ai_explanation,
        ai_forensic_details: analysis.ai_forensic_details,
        model_meta: { source_tab: tab },
      });

      // Update scan count
      await base44.auth.updateMe({ scans_this_month: (user?.scans_this_month || 0) + 1 });
      refreshUser();

      // Upsert topics
      for (const topicName of (analysis.topics || []).slice(0, 4)) {
        const existing = await base44.entities.Topic.filter({ name: topicName });
        const sigValue = analysis.score;
        if (existing.length === 0) {
          const topic = await base44.entities.Topic.create({
            name: topicName,
            category: "other",
            current_value: sigValue,
            momentum: 0,
            trend_direction: "flat",
          });
          await base44.entities.TopicSignal.create({
            topic_id: topic.id, timestamp: new Date().toISOString(), value: sigValue,
          });
        } else {
          const t = existing[0];
          const momentum = sigValue - t.current_value;
          const dir = momentum > 3 ? "up" : momentum < -3 ? "down" : "flat";
          await base44.entities.Topic.update(t.id, {
            current_value: sigValue, momentum, trend_direction: dir,
            anomaly_flag: Math.abs(momentum) > 20,
          });
          await base44.entities.TopicSignal.create({
            topic_id: t.id, timestamp: new Date().toISOString(), value: sigValue, momentum,
            anomaly_flag: Math.abs(momentum) > 20,
          });
        }
      }

      navigate(`/scan/${result.id}`);
    } catch (err) {
      setError(err.message || "Analysis failed.");
      setAnalyzing(false);
    }
  };

  if (analyzing) {
    return (
      <div className="max-w-3xl mx-auto px-6 md:px-12 py-20">
        <ScanAnimation label="Forging your signal" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-12 py-12 pb-24">
      <PageHeader
        eyebrow="Scan engine"
        title="Submit a Curio"
        description="Upload an image, paste a URL, or drop in text. Curio will create an authenticity verdict and pull out topic insights."
      />

      <div className="flex gap-1 mb-6 p-1 bg-[#E6F7FF]/5 rounded-md w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setContent(""); setFileUrl(null); }}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded transition ${tab === t.id ? "bg-[#0D1026] shadow-sm" : "text-[#E6F7FF]/60"}`}
            >
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-5">
        <div>
          <label className="text-[10px] uppercase tracking-[0.18em] text-[#E6F7FF]/60">Title (optional)</label>
          <input
            value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="A short label for this asset"
            className="mt-1.5 w-full px-4 py-3 bg-[#0D1026] border border-[#E6F7FF]/15 rounded-md focus:outline-none focus:border-[#E6F7FF] transition"
          />
        </div>

        {tab === "image" && (
          <div>
            <label className="text-[10px] uppercase tracking-[0.18em] text-[#E6F7FF]/60">Image</label>
            <label className="mt-1.5 flex flex-col items-center justify-center gap-3 px-6 py-12 bg-[#0D1026] border border-dashed border-[#E6F7FF]/20 rounded-md cursor-pointer hover:border-[#E6F7FF]/50 transition">
              <Upload className="w-5 h-5 text-[#E6F7FF]/40" />
              <div className="text-sm text-[#E6F7FF]/60">
                {uploading ? "Uploading…" : fileUrl ? "✓ Image ready" : "Click to upload"}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>
            {fileUrl && <img src={fileUrl} alt="" className="mt-3 max-h-64 rounded-md border border-[#E6F7FF]/10" />}
          </div>
        )}

        {tab === "url" && (
          <div>
            <label className="text-[10px] uppercase tracking-[0.18em] text-[#E6F7FF]/60">URL</label>
            <input
              value={content} onChange={(e) => setContent(e.target.value)}
              placeholder="https://..."
              className="mt-1.5 w-full px-4 py-3 bg-[#0D1026] border border-[#E6F7FF]/15 rounded-md focus:outline-none focus:border-[#E6F7FF] transition"
            />
          </div>
        )}

        {tab === "text" && (
          <div>
            <label className="text-[10px] uppercase tracking-[0.18em] text-[#E6F7FF]/60">Text</label>
            <textarea
              value={content} onChange={(e) => setContent(e.target.value)}
              rows={8} placeholder="Paste claim, article excerpt, or post content…"
              className="mt-1.5 w-full px-4 py-3 bg-[#0D1026] border border-[#E6F7FF]/15 rounded-md focus:outline-none focus:border-[#E6F7FF] transition resize-none"
            />
          </div>
        )}

        {error && <div className="text-sm text-[#FF3B6B] px-3 py-2 bg-[#FF3B6B]/8 rounded-md">{error}</div>}

        <button
          onClick={submit}
          disabled={analyzing}
          className="w-full md:w-auto px-8 py-3 bg-[#E6F7FF] text-[#080A18] rounded-md hover:bg-[#E6F7FF]/85 transition disabled:opacity-50"
        >
          Create analysis
        </button>
      </div>
    </div>
  );
}