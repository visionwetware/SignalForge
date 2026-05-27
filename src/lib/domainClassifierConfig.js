export const DOMAIN_CLASSIFIER_FLAGS = {
  flag_roi_annotation: true,
  flag_embedding_retrieval: true,
  flag_open_set: true,
  flag_classifier_head: false,
  flag_active_learning: true,
};

export const DOMAIN_CONFIGS = {
  uap: {
    domain: 'uap',
    labels: ['sphere', 'saucer', 'tictac', 'triangle', 'cigar', 'cross', 'irregular'],
    thresholds: {
      match_confidence: 68,
      inconclusive_confidence: 45,
      open_set_max_distance: 0.42,
      human_review_below: 68,
      min_confirmed_samples_for_classifier_head: 40,
      p95_predict_latency_ms: 2500,
    },
    extractor: {
      backbone: 'vision-llm-embedding-surrogate',
      deep_embedding_weight: 0.55,
      geometry_weight: 0.25,
      color_texture_weight: 0.20,
    },
    clustering: {
      algorithm: 'kmeans_mvp',
      recompute_trigger: 'manual_or_drift',
    },
  },
};

export const DEFAULT_DECK_ID = 'default-uap-deck';