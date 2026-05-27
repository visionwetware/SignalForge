# Domain Classifier Layer

## 1. Architecture summary

Scan/Curio/Pokedex image -> authenticity + AI-likelihood scan -> Domain Classifier Layer -> ROI annotations -> ROI embeddings -> deck/domain nearest-neighbor retrieval -> open-set gate -> prediction + feedback -> future classifier/training.

Text diagram:

```text
ImageAsset / SourceImage
  -> ROI Annotation UI
  -> Annotation + AnnotationRevision
  -> domainClassifierLayer(action=embedAnnotation)
  -> EmbeddingVectorRef
  -> domainClassifierLayer(action=predict)
  -> kNN retrieval + open-set threshold
  -> Prediction
  -> FeedbackEvent / corrected Annotation
  -> TrainingJob / ModelVersion / ClusterAssignment
```

## 2. Data models

Implemented Base44 entities:
- Deck
- ImageAsset
- Annotation
- AnnotationRevision
- LabelTaxonomy
- EmbeddingVectorRef
- Prediction
- FeedbackEvent
- ModelVersion
- TrainingJob
- ClusterAssignment

Prediction output contract:

```ts
interface DomainPrediction {
  deck_id: string;
  domain: string;
  predicted_label: string;
  confidence: number;
  open_set_score: number;
  verdict: 'matched' | 'inconclusive' | 'unknown';
  top_k_labels: { label: string; confidence: number }[];
  roi_predictions: Array<{
    roi_geometry: RoiGeometry;
    label: string;
    confidence: number;
    nearest_neighbors: Neighbor[];
  }>;
  nearest_neighbors: Neighbor[];
  cluster_id?: string | null;
  reasons: string[];
  warnings: string[];
  model_version: string;
  requires_human_review: boolean;
}

interface Neighbor {
  annotation_id: string;
  label: string;
  similarity: number;
  image_id: string;
}
```

## 3. Config schema

Config lives in `lib/domainClassifierConfig.js` and mirrors the backend function config.

```ts
interface DomainConfig {
  domain: string;
  labels: string[];
  thresholds: {
    match_confidence: number;
    inconclusive_confidence: number;
    open_set_max_distance: number;
    human_review_below: number;
    min_confirmed_samples_for_classifier_head: number;
    p95_predict_latency_ms: number;
  };
  extractor: {
    backbone: string;
    deep_embedding_weight: number;
    geometry_weight: number;
    color_texture_weight: number;
  };
}
```

Current domain:

```text
uap: sphere, saucer, tictac, triangle, cigar, cross, irregular
```

Feature flags:
- flag_roi_annotation: enabled
- flag_embedding_retrieval: enabled
- flag_open_set: enabled
- flag_classifier_head: disabled for MVP
- flag_active_learning: enabled

## 4. End-to-end pseudocode

```text
create annotation:
  user selects rectangle/polygon ROI
  user assigns label
  save Annotation
  save AnnotationRevision
  invoke domainClassifierLayer(embedAnnotation)
  extract fused ROI vector
  save EmbeddingVectorRef

predict:
  receive image_id, deck_id, roi_geometry
  extract fused ROI vector
  fetch same deck/domain labeled embeddings
  compute cosine similarity
  kNN vote labels
  compute confidence
  apply open-set threshold
  if low confidence: verdict = inconclusive/unknown, requires_human_review = true
  save Prediction
  return prediction JSON

feedback:
  reviewer confirms/relabels/rejects
  save FeedbackEvent
  if corrected label: save new Annotation + embedding
```

## 5. Minimal runnable MVP vs full plan

Implemented now:
- ROI rectangle + polygon contract/UI
- UAP taxonomy
- Annotation storage + revisions
- Retrieval-first ROI embeddings
- kNN matching
- Open-set gate
- Feedback capture through confirm/correct
- Feature flags
- API-style backend action contracts

Future phases:
- True CLIP/ViT/CNN embeddings
- Brush/mask UI
- Classifier head after minimum samples
- Batch ANN index
- Scheduled cluster recomputation
- Shadow/canary rollout
- Calibration curves and full eval dashboards

## 6. Migration plan from current scan output

1. Treat current `SourceImage` and uploaded scan images as `ImageAsset` sources.
2. Default deck is `default-uap-deck`.
3. Users annotate current Pokedex entries directly.
4. Each confirmed ROI becomes training/retrieval data.
5. Later, backfill `ImageAsset` rows for every gallery item if stricter deck-level governance is needed.

## 7. Example JSON

High-confidence match:

```json
{
  "deck_id": "default-uap-deck",
  "domain": "uap",
  "predicted_label": "sphere",
  "confidence": 86,
  "open_set_score": 0.21,
  "verdict": "matched",
  "top_k_labels": [{"label":"sphere","confidence":82}],
  "matched_annotation_ids": ["ann_123"],
  "roi_used": {"x":18,"y":18,"width":42,"height":36,"unit":"percent"},
  "requires_human_review": false
}
```

Low-confidence inconclusive:

```json
{
  "predicted_label": "unknown_or_inconclusive",
  "confidence": 51,
  "open_set_score": 0.39,
  "verdict": "inconclusive",
  "warnings": ["requires_human_review"],
  "requires_human_review": true
}
```

Unknown/open-set:

```json
{
  "predicted_label": "unknown_or_inconclusive",
  "confidence": 22,
  "open_set_score": 0.91,
  "verdict": "unknown",
  "warnings": ["requires_human_review", "open_set_distance_exceeded"],
  "requires_human_review": true
}
```

## 8. Test plan

Unit:
- ROI geometry normalization
- vector normalization
- cosine similarity
- confidence conversion
- open-set threshold routing
- label vote aggregation

Integration:
- save annotation -> embedding ref created
- predict with no examples -> unknown
- predict with examples -> nearest neighbors returned
- low confidence -> review required
- feedback correction -> new annotation sample saved

Evaluation:
- top1/top3 accuracy
- per-label precision/recall/F1
- confusion matrix
- ECE calibration error
- open-set AUROC/FPR@TPR
- human override rate
- drift indicators