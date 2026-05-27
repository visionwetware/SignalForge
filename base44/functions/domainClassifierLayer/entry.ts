import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const DOMAIN_CONFIGS = {
  uap: {
    labels: ['sphere', 'saucer', 'tictac', 'triangle', 'cigar', 'cross', 'irregular'],
    thresholds: {
      match_confidence: 68,
      inconclusive_confidence: 45,
      open_set_max_distance: 0.42,
      human_review_below: 68,
    },
    feature_flags: {
      flag_roi_annotation: true,
      flag_embedding_retrieval: true,
      flag_open_set: true,
      flag_classifier_head: false,
      flag_active_learning: true,
    },
  },
};

const MODEL_VERSION = 'domain-classifier-uap-retrieval-v1';

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return Math.abs(hash >>> 0);
}

function seededVector(seedText, size = 48) {
  let seed = hashString(seedText) || 1;
  const vector = [];
  for (let i = 0; i < size; i += 1) {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    vector.push((seed / 4294967296) * 2 - 1);
  }
  return normalize(vector);
}

function normalize(vector) {
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => Number((value / norm).toFixed(6)));
}

function geometryFeatures(roiGeometry = {}) {
  const brushPoints = Array.isArray(roiGeometry.strokes)
    ? roiGeometry.strokes.flatMap((stroke) => Array.isArray(stroke.points) ? stroke.points : [])
    : [];
  const points = Array.isArray(roiGeometry.points)
    ? roiGeometry.points
    : Array.isArray(roiGeometry.polygon)
      ? roiGeometry.polygon
      : brushPoints;

  if (points.length > 0) {
    const xs = points.map((point) => Number(point.x) || 0);
    const ys = points.map((point) => Number(point.y) || 0);
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);
    const area = Math.abs(width * height) / 10000;
    const strokeCount = Array.isArray(roiGeometry.strokes) ? roiGeometry.strokes.length : 1;
    return normalize([width / 100, height / 100, width / Math.max(height, 1), area, points.length / 80, strokeCount / 10, Number(roiGeometry.brush_size || 8) / 28, 0.2]);
  }

  const width = Number(roiGeometry.width) || 10;
  const height = Number(roiGeometry.height) || 10;
  const area = Math.abs(width * height) / 10000;
  return normalize([width / 100, height / 100, width / Math.max(height, 1), area, Number(roiGeometry.x || 0) / 100, Number(roiGeometry.y || 0) / 100, 0.5, 0.1]);
}

function extractEmbedding({ image_url, roi_geometry, label = '', domain = 'uap' }) {
  const deep = seededVector(`${domain}|${image_url}|${JSON.stringify(roi_geometry)}|${label}`, 40);
  const geometry = geometryFeatures(roi_geometry);
  return normalize([...deep, ...geometry]);
}

function cosineSimilarity(a, b) {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  for (let i = 0; i < length; i += 1) dot += Number(a[i] || 0) * Number(b[i] || 0);
  return Math.max(-1, Math.min(1, dot));
}

function confidenceFromSimilarity(similarity) {
  return Math.round(Math.max(0, Math.min(100, ((similarity + 1) / 2) * 100)));
}

function voteLabels(neighbors) {
  const totals = {};
  for (const neighbor of neighbors) {
    totals[neighbor.label] = (totals[neighbor.label] || 0) + Math.max(0, neighbor.similarity);
  }
  return Object.entries(totals)
    .map(([label, score]) => ({ label, confidence: Math.round(Math.min(100, score * 100 / Math.max(1, neighbors.length))) }))
    .sort((a, b) => b.confidence - a.confidence);
}

async function embedAnnotation(base44, annotationId) {
  const annotations = await base44.entities.Annotation.filter({ id: annotationId });
  const annotation = annotations[0];
  if (!annotation) return Response.json({ error: 'Annotation not found' }, { status: 404 });

  const vector = extractEmbedding({
    image_url: annotation.image_url,
    roi_geometry: annotation.roi_geometry,
    label: annotation.label,
    domain: annotation.domain || 'uap',
  });

  const embedding = await base44.entities.EmbeddingVectorRef.create({
    deck_id: annotation.deck_id,
    image_id: annotation.image_id,
    annotation_id: annotation.id,
    domain: annotation.domain || 'uap',
    label: annotation.label,
    vector,
    extractor: 'deterministic_roi_fusion_mvp',
    feature_meta: { roi_type: annotation.roi_type, roi_geometry: annotation.roi_geometry },
    model_version: MODEL_VERSION,
    status: 'active',
  });

  await base44.entities.Annotation.update(annotation.id, { embedding_ref_id: embedding.id, model_version_at_creation: MODEL_VERSION });
  return Response.json({ embedding_id: embedding.id, model_version: MODEL_VERSION });
}

async function predict(base44, payload) {
  const domain = payload.domain || 'uap';
  const config = DOMAIN_CONFIGS[domain] || DOMAIN_CONFIGS.uap;
  const vector = extractEmbedding({ image_url: payload.image_url, roi_geometry: payload.roi_geometry, domain });
  const embeddings = await base44.entities.EmbeddingVectorRef.filter({ deck_id: payload.deck_id, domain, status: 'active' }, '-created_date', 500);

  const neighbors = embeddings
    .map((embedding) => ({
      annotation_id: embedding.annotation_id,
      label: embedding.label,
      similarity: Number(cosineSimilarity(vector, embedding.vector || []).toFixed(4)),
      image_id: embedding.image_id,
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 7);

  const top = neighbors[0];
  const confidence = top ? confidenceFromSimilarity(top.similarity) : 0;
  const openSetScore = top ? Number((1 - Math.max(0, top.similarity)).toFixed(4)) : 1;
  const topLabels = voteLabels(neighbors).slice(0, 3);
  const predictedLabel = confidence >= config.thresholds.match_confidence && openSetScore <= config.thresholds.open_set_max_distance ? top.label : 'unknown_or_inconclusive';
  const verdict = !top ? 'unknown' : predictedLabel === 'unknown_or_inconclusive' ? (confidence < config.thresholds.inconclusive_confidence ? 'unknown' : 'inconclusive') : 'matched';
  const warnings = [];
  if (!top) warnings.push('no_labeled_examples_in_deck');
  if (confidence < config.thresholds.human_review_below) warnings.push('requires_human_review');
  if (openSetScore > config.thresholds.open_set_max_distance) warnings.push('open_set_distance_exceeded');

  const result = {
    deck_id: payload.deck_id,
    domain,
    image_id: payload.image_id,
    image_url: payload.image_url,
    predicted_label: predictedLabel,
    confidence,
    open_set_score: openSetScore,
    verdict,
    top_k_labels: topLabels,
    roi_predictions: [{
      roi_geometry: payload.roi_geometry,
      label: predictedLabel,
      confidence,
      nearest_neighbors: neighbors.slice(0, 3),
    }],
    nearest_neighbors: neighbors,
    cluster_id: top ? `cluster-${domain}-${top.label}` : null,
    reasons: top ? [
      `Nearest labeled ROI is ${top.label} with ${Math.round(top.similarity * 100)}% vector similarity.`,
      `Geometry + deterministic ROI feature fusion used for retrieval-first MVP.`,
    ] : ['No labeled ROI examples exist yet for this deck/domain.'],
    warnings,
    model_version: MODEL_VERSION,
    requires_human_review: confidence < config.thresholds.human_review_below || verdict !== 'matched',
    roi_used: payload.roi_geometry,
  };

  const prediction = await base44.entities.Prediction.create(result);
  return Response.json({ ...result, id: prediction.id });
}

async function createTrainingJob(base44, payload) {
  const job = await base44.entities.TrainingJob.create({
    deck_id: payload.deck_id,
    domain: payload.domain || 'uap',
    job_type: payload.job_type || 'index_rebuild',
    status: 'queued',
    trigger: payload.trigger || 'manual',
  });
  return Response.json({ job, message: 'Training job queued. MVP supports retrieval/index rebuild first; classifier head is feature-flagged off.' });
}

async function getModels(base44, payload) {
  const models = await base44.entities.ModelVersion.filter({ deck_id: payload.deck_id }, '-created_date', 50);
  return Response.json({ models, active_model_version: MODEL_VERSION });
}

async function getSimilar(base44, payload) {
  const refs = await base44.entities.EmbeddingVectorRef.filter({ annotation_id: payload.annotation_id }, '-created_date', 1);
  const ref = refs[0];
  if (!ref) return Response.json({ nearest_neighbors: [] });
  const embeddings = await base44.entities.EmbeddingVectorRef.filter({ deck_id: ref.deck_id, domain: ref.domain, status: 'active' }, '-created_date', 500);
  const nearest_neighbors = embeddings
    .filter((item) => item.annotation_id !== ref.annotation_id)
    .map((item) => ({ annotation_id: item.annotation_id, label: item.label, image_id: item.image_id, similarity: Number(cosineSimilarity(ref.vector, item.vector || []).toFixed(4)) }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10);
  return Response.json({ nearest_neighbors });
}

async function getClusters(base44, payload) {
  const clusters = await base44.entities.ClusterAssignment.filter({ deck_id: payload.deck_id, domain: payload.domain || 'uap' }, '-created_date', 200);
  return Response.json({ clusters });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const action = payload.action;

    if (action === 'embedAnnotation' || action === 'POST /annotations') return embedAnnotation(base44, payload.annotation_id);
    if (action === 'predict' || action === 'POST /predict') return predict(base44, payload);
    if (action === 'feedback' || action === 'POST /feedback') return Response.json({ accepted: true });
    if (action === 'train' || action === 'POST /train') return createTrainingJob(base44, payload);
    if (action === 'models' || action === 'GET /models') return getModels(base44, payload);
    if (action === 'similar' || action === 'GET /similar') return getSimilar(base44, payload);
    if (action === 'clusters' || action === 'GET /clusters') return getClusters(base44, payload);

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});