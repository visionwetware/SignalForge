export const AI_FORENSICS_CONFIG = {
  disclaimer: "AI-generation detection is probabilistic and may be wrong.",
  weights: {
    metadata_provenance: 15,
    noise_consistency: 15,
    compression_artifact_profile: 10,
    texture_repetition: 12,
    geometry_anatomy_anomalies: 12,
    lighting_shadow_reflection_consistency: 14,
    edge_halo_compositing_artifacts: 10,
    semantic_coherence_stress_test: 12,
  },
  verdicts: {
    likelyAi: { likelihood: 75, confidence: 60 },
    possibleAi: { minLikelihood: 60, maxLikelihood: 74, confidence: 45 },
    authentic: { maxLikelihood: 39, confidence: 55 },
  },
};

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const clamp01 = (value) => Math.min(1, Math.max(0, Number(value) || 0));

export function normalizeCheck(check) {
  const key = check?.key || check?.name || "unknown_check";
  const weight = Number(check?.weight ?? AI_FORENSICS_CONFIG.weights[key] ?? 0);
  const normalizedSuspicion = clamp01(check?.normalizedSuspicion ?? check?.normalized ?? 0);

  return {
    name: check?.name || key.replaceAll("_", " "),
    key,
    raw: check?.raw ?? null,
    normalizedSuspicion,
    weight,
    contribution: Number((normalizedSuspicion * weight).toFixed(2)),
    passed: check?.passed !== false,
    note: check?.note || "No note provided.",
  };
}

export function computeAiLikelihood(checks) {
  const validChecks = checks.filter((check) => check.passed && check.weight > 0);
  const weightsPresent = validChecks.reduce((sum, check) => sum + check.weight, 0);
  const weightedScore = validChecks.reduce((sum, check) => sum + check.contribution, 0);

  return {
    validChecks,
    weightsPresent,
    weightedScore: Number(weightedScore.toFixed(2)),
    ai_likelihood: weightsPresent > 0 ? Math.round((weightedScore / weightsPresent) * 100) : 50,
  };
}

export function computeConfidence(validCheckCount, qualityFlags = [], base = 50) {
  let confidence = base;
  if (validCheckCount >= 6) confidence += 10;
  if (!qualityFlags.includes("low_res")) confidence += 10;
  if (!qualityFlags.includes("metadata_missing")) confidence += 10;
  if (qualityFlags.includes("recompressed")) confidence -= 15;
  if (qualityFlags.includes("low_res")) confidence -= 15;
  if (qualityFlags.includes("screenshot_like") || qualityFlags.includes("text_heavy")) confidence -= 10;
  return clamp(Math.round(confidence));
}

export function classifyAiVerdict(aiLikelihood, confidence) {
  const { likelyAi, possibleAi, authentic } = AI_FORENSICS_CONFIG.verdicts;
  if (aiLikelihood >= likelyAi.likelihood && confidence >= likelyAi.confidence) return "likely_ai_generated";
  if (aiLikelihood >= possibleAi.minLikelihood && aiLikelihood <= possibleAi.maxLikelihood && confidence >= possibleAi.confidence) return "possibly_ai_generated";
  if (confidence < 45 || (aiLikelihood >= 40 && aiLikelihood <= 59)) return "inconclusive";
  if (aiLikelihood <= authentic.maxLikelihood && confidence >= authentic.confidence) return "likely_authentic_photo";
  return "inconclusive";
}

export function topSignals(validChecks, count = 3) {
  return [...validChecks]
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, count)
    .map((check) => check.note)
    .filter(Boolean);
}

export function buildUserExplanation(verdict, aiLikelihood, confidence, signals) {
  const signalText = signals.length ? ` Strongest signals: ${signals.join("; ")}.` : " No dominant signal was isolated.";
  const verdictText = {
    likely_ai_generated: "This image shows multiple patterns commonly associated with AI-generated imagery.",
    possibly_ai_generated: "This image has some signals associated with AI-generated imagery, but the evidence is mixed.",
    likely_authentic_photo: "This image aligns more closely with expected characteristics of a real camera photo.",
    inconclusive: "The available evidence is not strong enough for a reliable AI-generation determination.",
  }[verdict];

  return `${verdictText} AI likelihood is ${aiLikelihood}/100 with ${confidence}/100 confidence.${signalText}`;
}

export function assessAiImageFromChecks(rawChecks = [], qualityFlags = []) {
  const checks = rawChecks.map(normalizeCheck);
  const { validChecks, weightsPresent, weightedScore, ai_likelihood } = computeAiLikelihood(checks);
  const confidence = computeConfidence(validChecks.length, qualityFlags);
  const verdict = classifyAiVerdict(ai_likelihood, confidence);
  const signals = topSignals(validChecks);

  return {
    ai_likelihood,
    confidence,
    verdict,
    signals,
    explanation: buildUserExplanation(verdict, ai_likelihood, confidence, signals),
    forensic_details: {
      checks,
      weightsPresent,
      weightedScore,
      qualityFlags,
      config: AI_FORENSICS_CONFIG,
    },
    disclaimer: AI_FORENSICS_CONFIG.disclaimer,
  };
}