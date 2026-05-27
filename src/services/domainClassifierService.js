import { base44 } from '@/api/base44Client';
import { DEFAULT_DECK_ID } from '@/lib/domainClassifierConfig';

export async function saveAnnotation({ card, roi, label, note = '', deckId = DEFAULT_DECK_ID, domain = 'uap' }) {
  const user = await base44.auth.me();
  const imageId = card.image.id;
  const payload = {
    deck_id: deckId,
    image_id: imageId,
    image_url: card.image.image_url,
    domain,
    roi_type: roi.type,
    roi_geometry: roi.geometry,
    label,
    note,
    status: 'active',
    source: 'manual',
    created_by: user?.id,
    updated_by: user?.id,
  };
  const annotation = await base44.entities.Annotation.create(payload);
  await base44.entities.AnnotationRevision.create({
    annotation_id: annotation.id,
    deck_id: deckId,
    image_id: imageId,
    revision_type: 'create',
    new_data: payload,
    edited_by: user?.id,
  });
  await base44.functions.invoke('domainClassifierLayer', { action: 'embedAnnotation', annotation_id: annotation.id });
  return annotation;
}

export async function deleteAnnotation(annotation) {
  await base44.entities.Annotation.update(annotation.id, { status: 'deleted' });
  await base44.entities.AnnotationRevision.create({
    annotation_id: annotation.id,
    deck_id: annotation.deck_id,
    image_id: annotation.image_id,
    revision_type: 'delete',
    previous_data: annotation,
  });
}

export async function loadAnnotations(imageId, deckId = DEFAULT_DECK_ID) {
  return base44.entities.Annotation.filter({ deck_id: deckId, image_id: imageId, status: 'active' }, '-created_date', 100);
}

export async function predictRoi({ card, roi, deckId = DEFAULT_DECK_ID, domain = 'uap' }) {
  const response = await base44.functions.invoke('domainClassifierLayer', {
    action: 'predict',
    deck_id: deckId,
    domain,
    image_id: card.image.id,
    image_url: card.image.image_url,
    roi_geometry: roi.geometry,
    roi_type: roi.type,
  });
  return response.data;
}

export async function submitFeedback({ prediction, card, roi, correctedLabel, action = 'relabel', note = '', deckId = DEFAULT_DECK_ID, domain = 'uap' }) {
  const user = await base44.auth.me();
  const feedback = await base44.entities.FeedbackEvent.create({
    deck_id: deckId,
    image_id: card.image.id,
    prediction_id: prediction?.id,
    domain,
    action,
    original_label: prediction?.predicted_label,
    corrected_label: correctedLabel,
    roi_geometry: roi.geometry,
    note,
    created_by: user?.id,
  });
  if (correctedLabel) {
    await saveAnnotation({ card, roi, label: correctedLabel, note, deckId, domain });
  }
  return feedback;
}