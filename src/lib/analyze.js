// Curio analysis using InvokeLLM
import { base44 } from "@/api/base44Client";
import { AI_FORENSICS_CONFIG, assessAiImageFromChecks } from "@/lib/aiImageForensics";

const SCHEMA = {
  type: "object",
  properties: {
    score: { type: "number", description: "0-100 credibility/authenticity" },
    confidence: { type: "number", description: "0-100 model confidence" },
    verdict: { type: "string", enum: ["authentic", "suspicious", "manipulated", "inconclusive"] },
    explanation: { type: "string" },
    entities: { type: "array", items: { type: "string" } },
    topics: { type: "array", items: { type: "string" } },
  },
  required: ["score", "confidence", "verdict", "explanation"],
};

const AI_IMAGE_SCHEMA = {
  type: "object",
  properties: {
    authenticity_score: { type: "number", description: "0-100 credibility/authenticity score after considering AI-generation risk" },
    authenticity_verdict: { type: "string", enum: ["authentic", "suspicious", "manipulated", "inconclusive"] },
    authenticity_explanation: { type: "string" },
    checks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          key: { type: "string", enum: Object.keys(AI_FORENSICS_CONFIG.weights) },
          name: { type: "string" },
          raw: { type: "string" },
          normalizedSuspicion: { type: "number", description: "0..1 suspiciousness" },
          passed: { type: "boolean" },
          note: { type: "string" },
        },
        required: ["key", "name", "normalizedSuspicion", "passed", "note"],
      },
    },
    qualityFlags: { type: "array", items: { type: "string" } },
    entities: { type: "array", items: { type: "string" } },
    topics: { type: "array", items: { type: "string" } },
  },
  required: ["authenticity_score", "authenticity_verdict", "authenticity_explanation", "checks", "qualityFlags"],
};

export async function analyzeAsset({ asset_type, content_ref, title }) {
  const isImage = asset_type === "image";

  if (isImage) {
    const prompt = `You are Curio, an image forensics analyst. Examine the attached image for credibility/authenticity and add an explainable AI-generation detection layer.

${title ? `Title: ${title}\n` : ""}
Important constraints:
- Do not present AI-generation detection as certain truth; it is probabilistic.
- Run each heuristic check independently and trace every score to a check.
- Use normalizedSuspicion from 0 to 1 where 1 means more suspicious for AI generation.
- Mark passed=false only when the check cannot be assessed from the image.
- Include quality flags when relevant: low_res, recompressed, screenshot_like, text_heavy, metadata_missing.

Heuristic checks and intent:
1. metadata_provenance: missing camera EXIF, editor traces, inconsistent timestamp/device chain.
2. noise_consistency: patch-level sensor noise inconsistency or synthetic smoothness.
3. compression_artifact_profile: JPEG/block artifacts inconsistent with camera pipeline.
4. texture_repetition: repeated local patterns in background/materials.
5. geometry_anatomy_anomalies: hands, teeth, accessories, object-boundary issues.
6. lighting_shadow_reflection_consistency: inconsistent light direction, reflections, shadows.
7. edge_halo_compositing_artifacts: cutout-like transitions, glow/halo boundaries.
8. semantic_coherence_stress_test: object-text relation oddities and small incoherent details.

Also return an adjusted authenticity score/verdict/explanation that keeps the existing Scan purpose but considers the AI-generation findings.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [content_ref],
      response_json_schema: AI_IMAGE_SCHEMA,
    });

    const assessment = assessAiImageFromChecks(result.checks || [], result.qualityFlags || []);
    return {
      score: result.authenticity_score,
      confidence: assessment.confidence,
      verdict: result.authenticity_verdict,
      explanation: result.authenticity_explanation,
      entities: result.entities || [],
      topics: result.topics || [],
      ai_likelihood: assessment.ai_likelihood,
      ai_confidence: assessment.confidence,
      ai_verdict: assessment.verdict,
      ai_signals: assessment.signals,
      ai_explanation: assessment.explanation,
      ai_forensic_details: assessment.forensic_details,
    };
  }

  const prompt = `You are Curio, an analyst evaluating ${asset_type} content for credibility, authenticity, and insight value.

${title ? `Title: ${title}\n` : ""}Content: ${content_ref}

Produce:
- score: 0-100 (100 = highly authentic/credible)
- confidence: 0-100
- verdict: authentic | suspicious | manipulated | inconclusive
- explanation: 2-3 sentence analyst-grade rationale
- entities: notable named entities
- topics: 1-4 short topic labels (Title Case)`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
    response_json_schema: SCHEMA,
  });

  return result;
}