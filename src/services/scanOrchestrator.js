import { base44 } from '@/api/base44Client';

export async function loadGalleryData() {
  const [images, scans, pages, keywords, albums, albumItems] = await Promise.all([
    base44.entities.SourceImage.list('-created_date', 200),
    base44.entities.ScanResult.list('-created_date', 200),
    base44.entities.SourcePage.list('-created_date', 100),
    base44.entities.Keyword.list('-created_date', 500),
    base44.entities.Album.list('-created_date', 50),
    base44.entities.AlbumItem.list('-created_date', 300),
  ]);
  return { images, scans, pages, keywords, albums, albumItems };
}

export function buildGalleryCards({ images, scans, pages, keywords }) {
  return images.map((image) => {
    const scan = scans.find((item) => item.source_image_id === image.id);
    const page = pages.find((item) => item.id === image.source_page_id);
    const imageKeywords = keywords.filter((item) => item.source_image_id === image.id || item.source_page_id === image.source_page_id);
    return { image, scan, page, keywords: imageKeywords };
  });
}