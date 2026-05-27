import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const EXTRACTOR_VERSION = 'web-ingest-v1';
const MAX_HTML_BYTES = 2_500_000;
const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp|gif)(\?|#|$)/i;

function extractMeta(html, property) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["'][^>]*>`, 'i')
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1].trim());
  }
  return '';
}

function decodeHtml(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function stripHtml(html) {
  return decodeHtml(html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim())
    .slice(0, 20000);
}

function extractImages(html, baseUrl) {
  const urls = new Set();
  const srcRegex = /<img[^>]+(?:src|data-src|data-original)=["']([^"']+)["'][^>]*>/gi;
  const srcsetRegex = /<img[^>]+srcset=["']([^"']+)["'][^>]*>/gi;
  const ogImage = extractMeta(html, 'og:image');
  if (ogImage) urls.add(normalizeUrl(ogImage, baseUrl));

  for (const match of html.matchAll(srcRegex)) {
    const normalized = normalizeUrl(match[1], baseUrl);
    if (normalized && isMeaningfulImage(normalized)) urls.add(normalized);
  }
  for (const match of html.matchAll(srcsetRegex)) {
    const candidates = match[1].split(',').map((part) => part.trim().split(/\s+/)[0]);
    for (const candidate of candidates) {
      const normalized = normalizeUrl(candidate, baseUrl);
      if (normalized && isMeaningfulImage(normalized)) urls.add(normalized);
    }
  }
  return Array.from(urls).slice(0, 12);
}

function normalizeUrl(value, baseUrl) {
  const decoded = decodeHtml(value || '');
  if (!decoded || decoded.startsWith('data:') || decoded.startsWith('blob:')) return '';
  try { return new URL(decoded, baseUrl).toString(); } catch { return ''; }
}

function isMeaningfulImage(url) {
  const lower = url.toLowerCase();
  if (lower.includes('logo') || lower.includes('icon') || lower.includes('avatar') || lower.includes('sprite')) return false;
  return IMAGE_EXTENSIONS.test(lower) || lower.includes('image');
}

function simpleHash(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  return Math.abs(hash).toString(16);
}

async function keywordsFromText(base44, { text, sourcePageId, sourceUrl }) {
  const words = text.toLowerCase().match(/[a-z0-9][a-z0-9-]{3,}/g) || [];
  const stop = new Set(['that','this','with','from','have','were','their','about','there','which','would','could','should','into','also','than','then','been','more','only','over','after','before','your','they','them','when','what']);
  const counts = new Map();
  for (const word of words) if (!stop.has(word)) counts.set(word, (counts.get(word) || 0) + 1);
  const records = Array.from(counts.entries()).sort((a,b) => b[1] - a[1]).slice(0, 20).map(([term, weight]) => ({
    term,
    weight,
    source_type: 'page',
    source_page_id: sourcePageId,
    source_url: sourceUrl,
    evidence_snippet: text.slice(0, 240)
  }));
  if (records.length) await base44.entities.Keyword.bulkCreate(records);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { url } = await req.json();
    if (!url || !/^https?:\/\//i.test(url)) return Response.json({ error: 'A valid http(s) URL is required' }, { status: 400 });

    const startedAt = Date.now();
    const response = await fetch(url, { headers: { 'User-Agent': 'SignalForgeCurio/1.0' } });
    if (!response.ok) return Response.json({ error: `Source unavailable (${response.status})` }, { status: 422 });

    const html = (await response.text()).slice(0, MAX_HTML_BYTES);
    const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i);
    const canonicalUrl = canonicalMatch?.[1] ? normalizeUrl(canonicalMatch[1], url) : response.url || url;
    const title = decodeHtml((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || extractMeta(html, 'og:title') || 'Untitled source').trim());
    const published = extractMeta(html, 'article:published_time') || extractMeta(html, 'date') || extractMeta(html, 'pubdate');
    const rawText = stripHtml(html);
    const imageUrls = extractImages(html, canonicalUrl);

    const sourcePage = await base44.entities.SourcePage.create({
      user_id: user.id,
      url,
      canonical_url: canonicalUrl,
      title,
      published_at: published || undefined,
      raw_text: rawText,
      extractor_version: EXTRACTOR_VERSION,
      status: 'processing'
    });

    const sourceImages = [];
    let skippedImageCount = 0;
    for (const imageUrl of imageUrls) {
      try {
        const analysis = await base44.integrations.Core.InvokeLLM({
          prompt: `Analyze this webpage image for SignalForge. Page title: ${title}. Source URL: ${canonicalUrl}. Article excerpt: ${rawText.slice(0, 2500)}\n\nFirst decide if the image is directly related to the article/link/document content. Keep only article evidence, article figures, primary photos, document scans, diagrams, or images that clearly support the main content. Reject ads, logos, avatars, social widgets, unrelated thumbnails, recommended-post images, navigation graphics, and generic decorations. Return relevance plus labels, topics, authenticity score, and concise notes.`,
          file_urls: [imageUrl],
          response_json_schema: {
            type: 'object',
            properties: {
              is_article_relevant: { type: 'boolean' },
              relevance_score: { type: 'number' },
              relevance_reason: { type: 'string' },
              score: { type: 'number' },
              labels: { type: 'array', items: { type: 'string' } },
              topics: { type: 'array', items: { type: 'string' } },
              notes: { type: 'string' }
            },
            required: ['is_article_relevant', 'relevance_score', 'relevance_reason', 'score', 'labels', 'topics', 'notes']
          }
        });

        if (!analysis.is_article_relevant || analysis.relevance_score < 60) {
          skippedImageCount += 1;
          continue;
        }

        const image = await base44.entities.SourceImage.create({
          source_page_id: sourcePage.id,
          image_url: imageUrl,
          hash: simpleHash(imageUrl),
          title,
          relevance_score: analysis.relevance_score,
          relevance_reason: analysis.relevance_reason
        });
        sourceImages.push(image);

        const scan = await base44.entities.ScanResult.create({
          source_image_id: image.id,
          status: 'done',
          source_url: canonicalUrl,
          image_url: imageUrl,
          model_version: 'signalforge-image-v1',
          score: analysis.score,
          labels: analysis.labels || [],
          topics: analysis.topics || [],
          notes: analysis.notes,
          scanned_at: new Date().toISOString()
        });

        const keywordRecords = [...(analysis.labels || []), ...(analysis.topics || [])].slice(0, 16).map((term) => ({
          term: String(term).toLowerCase(),
          weight: 2,
          source_type: 'image',
          source_page_id: sourcePage.id,
          source_image_id: image.id,
          source_url: canonicalUrl,
          image_url: imageUrl,
          evidence_snippet: analysis.notes
        }));
        if (keywordRecords.length) await base44.entities.Keyword.bulkCreate(keywordRecords);
      } catch (error) {
        skippedImageCount += 1;
      }
    }

    await keywordsFromText(base44, { text: rawText, sourcePageId: sourcePage.id, sourceUrl: canonicalUrl });
    await base44.entities.SourcePage.update(sourcePage.id, { status: 'done' });

    return Response.json({
      sourcePageId: sourcePage.id,
      title,
      canonicalUrl,
      imageCount: sourceImages.length,
      skippedImageCount,
      durationMs: Date.now() - startedAt
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});