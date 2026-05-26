import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { scanResultId } = await req.json();
    if (!scanResultId) return Response.json({ error: 'scanResultId is required' }, { status: 400 });
    if (!/^[a-f0-9]{24}$/i.test(scanResultId)) return Response.json({ error: 'Invalid scanResultId' }, { status: 400 });

    const scans = await base44.entities.ScanResult.filter({ id: scanResultId });
    const scan = scans[0];
    if (!scan) return Response.json({ error: 'Scan not found' }, { status: 404 });

    await base44.entities.ScanResult.update(scan.id, { status: 'scanning', error: '' });
    const imageUrl = scan.image_url;
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Retry SignalForge image scan. Source URL: ${scan.source_url || 'unknown'}. Return labels, topics, score and concise notes.`,
      file_urls: [imageUrl],
      response_json_schema: {
        type: 'object',
        properties: {
          score: { type: 'number' },
          labels: { type: 'array', items: { type: 'string' } },
          topics: { type: 'array', items: { type: 'string' } },
          notes: { type: 'string' }
        },
        required: ['score', 'labels', 'topics', 'notes']
      }
    });

    await base44.entities.ScanResult.update(scan.id, {
      status: 'done',
      score: analysis.score,
      labels: analysis.labels || [],
      topics: analysis.topics || [],
      notes: analysis.notes,
      scanned_at: new Date().toISOString()
    });

    return Response.json({ ok: true, score: analysis.score });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});