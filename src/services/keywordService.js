import { base44 } from '@/api/base44Client';

export async function listSourceKeywords(sourcePageId) {
  if (!sourcePageId) return [];
  return base44.entities.Keyword.filter({ source_page_id: sourcePageId }, '-weight', 50);
}

export function uniqueTerms(keywords) {
  return Array.from(new Set((keywords || []).map((keyword) => keyword.term).filter(Boolean)));
}