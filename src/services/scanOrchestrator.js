import { base44 } from '@/api/base44Client';

export async function loadGalleryData() {
  const [images, scans, pages, keywords, albums, albumItems, assets, results] = await Promise.all([
    base44.entities.SourceImage.list('-created_date', 200),
    base44.entities.ScanResult.list('-created_date', 200),
    base44.entities.SourcePage.list('-created_date', 100),
    base44.entities.Keyword.list('-created_date', 500),
    base44.entities.Album.list('-created_date', 50),
    base44.entities.AlbumItem.list('-created_date', 300),
    base44.entities.InputAsset.list('-created_date', 200),
    base44.entities.AnalysisResult.list('-created_date', 200),
  ]);
  return { images, scans, pages, keywords, albums, albumItems, assets, results };
}

export function buildGalleryCards({ images, scans, pages, keywords, assets = [], results = [] }) {
  const curioCards = images.map((image) => {
    const scan = scans.find((item) => item.source_image_id === image.id);
    const page = pages.find((item) => item.id === image.source_page_id);
    const imageKeywords = keywords.filter((item) => item.source_image_id === image.id || item.source_page_id === image.source_page_id);
    return { id: `curio-${image.id}`, source_type: 'curio', image, scan, page, keywords: imageKeywords };
  });

  const uploadCards = results
    .map((result) => {
      const asset = assets.find((item) => item.id === result.asset_id && item.asset_type === 'image');
      if (!asset) return null;
      const terms = [...(result.topics || []), ...(result.entities || [])]
        .filter(Boolean)
        .map((term) => ({ term: String(term).toLowerCase() }));
      return {
        id: `scan-${result.id}`,
        source_type: 'scan',
        asset,
        image: {
          id: `scan-${result.id}`,
          image_url: asset.content_ref,
          title: asset.title,
          created_date: result.created_date,
          favorite: false,
          is_scan_upload: true
        },
        scan: {
          status: 'done',
          score: result.score,
          topics: result.topics || [],
          labels: result.entities || [],
          notes: result.explanation,
          scanned_at: result.created_date
        },
        page: null,
        keywords: terms
      };
    })
    .filter(Boolean);

  return [...curioCards, ...uploadCards];
}