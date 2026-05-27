const VERDICT_LABELS = {
  likely_ai_generated: "Likely AI-generated",
  possibly_ai_generated: "Possibly AI-generated",
  inconclusive: "Inconclusive",
  likely_authentic_photo: "Likely authentic photo",
};

export default function AIImageAssessmentPanel({ result }) {
  if (!result?.ai_verdict) return null;

  const details = result.ai_forensic_details || {};
  const checks = details.checks || [];

  return (
    <div className="border border-[#E6F7FF]/10 rounded-lg p-5 bg-[#0D1026]/70">
      <div className="text-[10px] uppercase tracking-[0.18em] text-[#E6F7FF]/50 mb-3">AI-generation assessment</div>
      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        <Metric label="AI likelihood" value={`${Math.round(result.ai_likelihood || 0)}%`} />
        <Metric label="Confidence" value={`${Math.round(result.ai_confidence || 0)}%`} />
        <Metric label="Verdict" value={VERDICT_LABELS[result.ai_verdict] || result.ai_verdict} />
      </div>

      {result.ai_explanation && <p className="text-sm leading-relaxed text-[#E6F7FF]/80">{result.ai_explanation}</p>}

      {result.ai_signals?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {result.ai_signals.map((signal, index) => (
            <span key={index} className="px-3 py-1 rounded-full bg-[#E6F7FF]/5 text-xs text-[#E6F7FF]/80">{signal}</span>
          ))}
        </div>
      )}

      {checks.length > 0 && (
        <div className="mt-5 space-y-2">
          {checks.map((check, index) => (
            <div key={index} className="flex items-start justify-between gap-4 text-xs border-t border-[#E6F7FF]/10 pt-2">
              <div>
                <div className="text-[#E6F7FF]/85">{check.name}</div>
                <div className="text-[#E6F7FF]/45 mt-0.5">{check.note}</div>
              </div>
              <div className="text-right text-[#E6F7FF]/60 shrink-0">+{Number(check.contribution || 0).toFixed(1)}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 text-xs text-[#E6F7FF]/45">AI-generation detection is probabilistic and may be wrong.</div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md border border-[#E6F7FF]/10 bg-[#E6F7FF]/5 p-3">
      <div className="text-[10px] uppercase tracking-[0.16em] text-[#E6F7FF]/45">{label}</div>
      <div className="font-serif text-lg mt-1 text-[#E6F7FF]">{value}</div>
    </div>
  );
}