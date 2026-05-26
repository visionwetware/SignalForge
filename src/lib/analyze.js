// SkyScan-inspired analysis using InvokeLLM
import { base44 } from "@/api/base44Client";

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

export async function analyzeAsset({ asset_type, content_ref, title }) {
  const isImage = asset_type === "image";
  const prompt = `You are SignalForge, an analyst evaluating ${asset_type} content for credibility, authenticity, and signal value.

${title ? `Title: ${title}\n` : ""}${asset_type === "image" ? "Examine the attached image." : `Content: ${content_ref}`}

Produce:
- score: 0-100 (100 = highly authentic/credible)
- confidence: 0-100
- verdict: authentic | suspicious | manipulated | inconclusive
- explanation: 2-3 sentence analyst-grade rationale
- entities: notable named entities
- topics: 1-4 short topic labels (Title Case)`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: asset_type !== "image",
    file_urls: isImage ? [content_ref] : undefined,
    response_json_schema: SCHEMA,
  });

  return result;
}