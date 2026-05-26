import { base44 } from '@/api/base44Client';

export function validateSourceUrl(url) {
  if (!/^https?:\/\//i.test(url || '')) {
    throw new Error('Enter a valid Source URL starting with http:// or https://');
  }
}

export async function ingestSourceUrl(url) {
  validateSourceUrl(url);
  const response = await base44.functions.invoke('ingestSourcePage', { url });
  return response.data;
}

export async function retryImageScan(scanResultId) {
  const response = await base44.functions.invoke('retryImageScan', { scanResultId });
  return response.data;
}