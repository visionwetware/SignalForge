export function dedupeImageUrls(urls) {
  return Array.from(new Set((urls || []).filter(Boolean)));
}

export function normalizeImageUrl(url, baseUrl) {
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return '';
  }
}