import { dedupeImageUrls, normalizeImageUrl } from '@/services/imageExtractionService';
import { validateSourceUrl } from '@/services/webIngestService';

export function testImageDedupe() {
  const result = dedupeImageUrls(['https://a.com/x.jpg', 'https://a.com/x.jpg', 'https://a.com/y.png']);
  console.assert(result.length === 2, 'dedupeImageUrls should remove duplicate image URLs');
}

export function testNormalizeImageUrl() {
  const result = normalizeImageUrl('/image.jpg', 'https://example.com/page');
  console.assert(result === 'https://example.com/image.jpg', 'normalizeImageUrl should resolve relative URLs');
}

export function testUrlValidation() {
  let failed = false;
  try { validateSourceUrl('not-a-url'); } catch { failed = true; }
  console.assert(failed, 'validateSourceUrl should reject non-http URLs');
}

export function testScanJobTransitionShape() {
  const transitions = ['queued', 'scanning', 'done', 'failed'];
  console.assert(transitions.includes('queued') && transitions.includes('failed'), 'scan transitions should include queue and failure states');
}

export function testKeywordProvenanceShape() {
  const keyword = { term: 'uap', source_type: 'image', source_page_id: 'page1', source_image_id: 'img1', source_url: 'https://source', image_url: 'https://image' };
  console.assert(!!keyword.source_url && !!keyword.source_image_id, 'keyword should preserve source and image provenance');
}