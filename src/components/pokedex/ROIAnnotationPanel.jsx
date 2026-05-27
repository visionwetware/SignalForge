import { useEffect, useRef, useState } from 'react';
import { DOMAIN_CONFIGS } from '@/lib/domainClassifierConfig';
import { loadAnnotations, predictRoi, saveAnnotation, submitFeedback } from '@/services/domainClassifierService';

const COPY = {
  title: 'ROI Annotation',
  quickTab: 'Quick Highlight (Recommended)',
  precisionTab: 'Precision Shapes (Advanced)',
  hintQuick: 'Paint over the area you want AI to learn.',
  hintPrecision: 'Draw exact boundaries for precise labeling.',
  statusGeometrySaved: 'Detailed geometry is saved automatically.',
  selectionRequired: 'Please highlight a region before saving.',
  saveSuccess: 'Region saved. AI will use this to improve future matches.',
  quickToPrecision: 'Converted highlight to editable shape.',
  precisionToQuick: 'Converted shape to highlight mask.',
};

const DEFAULT_RECT = { x: 18, y: 18, width: 42, height: 36 };

function smoothPoint(previous, point) {
  if (!previous) return point;
  return {
    x: Number((previous.x * 0.65 + point.x * 0.35).toFixed(2)),
    y: Number((previous.y * 0.65 + point.y * 0.35).toFixed(2)),
  };
}

function pointsToPath(points) {
  if (!points?.length) return '';
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

function strokesToPolygon(strokes) {
  const points = strokes.flatMap((stroke) => stroke.mode === 'highlight' ? stroke.points : []);
  if (points.length === 0) return [];
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.max(0, Math.min(...xs));
  const maxX = Math.min(100, Math.max(...xs));
  const minY = Math.max(0, Math.min(...ys));
  const maxY = Math.min(100, Math.max(...ys));
  return [{ x: minX, y: minY }, { x: maxX, y: minY }, { x: maxX, y: maxY }, { x: minX, y: maxY }];
}

function rectToPolygon(rect) {
  return [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height },
  ];
}

function polygonToRect(points) {
  if (!points?.length) return DEFAULT_RECT;
  const xs = points.map((point) => Number(point.x) || 0);
  const ys = points.map((point) => Number(point.y) || 0);
  const minX = Math.max(0, Math.min(...xs));
  const maxX = Math.min(100, Math.max(...xs));
  const minY = Math.max(0, Math.min(...ys));
  const maxY = Math.min(100, Math.max(...ys));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function polygonTextToPoints(value) {
  return value.split(' ').map((pair) => {
    const [x, y] = pair.split(',').map(Number);
    return { x, y };
  }).filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
}

function pointsToPolygonText(points) {
  return points.map((point) => `${Math.round(point.x)},${Math.round(point.y)}`).join(' ');
}

function polygonToStroke(points, brushSize = 14) {
  if (!points?.length) return [];
  return [{ mode: 'highlight', brush_size: brushSize, points: [...points, points[0]] }];
}

export default function ROIAnnotationPanel({ card }) {
  const imageWrapRef = useRef(null);
  const drawingRef = useRef(false);
  const storageKey = `roi-mode-${card.image.id}`;
  const [mode, setMode] = useState(() => localStorage.getItem(storageKey) || 'quick');
  const [tool, setTool] = useState('highlight');
  const [brushSize, setBrushSize] = useState(12);
  const [strokes, setStrokes] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [precisionTool, setPrecisionTool] = useState('rectangle');
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [rect, setRect] = useState(DEFAULT_RECT);
  const [polygonText, setPolygonText] = useState('20,20 70,25 62,68 24,64');
  const [label, setLabel] = useState('sphere');
  const [note, setNote] = useState('');
  const [annotations, setAnnotations] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const labels = DOMAIN_CONFIGS.uap.labels;
  const brushPolygon = strokesToPolygon(strokes);
  const precisionPoints = precisionTool === 'polygon' ? polygonTextToPoints(polygonText) : rectToPolygon(rect);
  const hasQuickSelection = strokes.some((stroke) => stroke.mode === 'highlight' && stroke.points.length > 1);
  const hasPrecisionSelection = precisionPoints.length > 0;
  const hasSelection = mode === 'quick' ? hasQuickSelection : hasPrecisionSelection;

  const refresh = async () => setAnnotations(await loadAnnotations(card.image.id));
  useEffect(() => { if (card?.image?.id) refresh(); }, [card?.image?.id]);

  const switchMode = (nextMode) => {
    if (nextMode === mode) return;
    if (nextMode === 'precision' && hasQuickSelection) {
      const converted = brushPolygon.length ? brushPolygon : rectToPolygon(DEFAULT_RECT);
      setRect(polygonToRect(converted));
      setPolygonText(pointsToPolygonText(converted));
      setMessage(COPY.quickToPrecision);
    }
    if (nextMode === 'quick' && hasPrecisionSelection) {
      setStrokes(polygonToStroke(precisionPoints, brushSize));
      setRedoStack([]);
      setMessage(COPY.precisionToQuick);
    }
    setMode(nextMode);
    localStorage.setItem(storageKey, nextMode);
  };

  const pointerToPercent = (event) => {
    const bounds = imageWrapRef.current.getBoundingClientRect();
    return {
      x: Number(Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100)).toFixed(2)),
      y: Number(Math.max(0, Math.min(100, ((event.clientY - bounds.top) / bounds.height) * 100)).toFixed(2)),
    };
  };

  const startStroke = (event) => {
    if (mode !== 'quick') return;
    event.preventDefault();
    const point = pointerToPercent(event);
    drawingRef.current = true;
    setRedoStack([]);
    setStrokes((current) => [...current, { mode: tool, brush_size: brushSize, points: [point] }]);
  };

  const continueStroke = (event) => {
    if (!drawingRef.current || mode !== 'quick') return;
    event.preventDefault();
    const point = pointerToPercent(event);
    setStrokes((current) => current.map((stroke, index) => {
      if (index !== current.length - 1) return stroke;
      const previous = stroke.points[stroke.points.length - 1];
      return { ...stroke, points: [...stroke.points, smoothPoint(previous, point)] };
    }));
  };

  const endStroke = () => { drawingRef.current = false; };

  const currentRoi = () => {
    const polygon = mode === 'quick' ? brushPolygon : precisionPoints;
    const brushMask = mode === 'quick' ? { brush_size: brushSize, strokes } : { brush_size: brushSize, strokes: polygonToStroke(polygon, brushSize) };

    if (mode === 'precision' && precisionTool === 'rectangle') {
      return {
        type: 'rectangle',
        geometry: { ...rect, unit: 'percent', canonical: 'hybrid_roi_v1', polygon, brush_mask: brushMask },
      };
    }
    if (mode === 'precision') {
      return {
        type: 'polygon',
        geometry: { points: polygon, unit: 'percent', canonical: 'hybrid_roi_v1', brush_mask: brushMask },
      };
    }
    return {
      type: 'brush_mask',
      geometry: { unit: 'percent', canonical: 'hybrid_roi_v1', brush_size: brushSize, strokes, polygon },
    };
  };

  const handleSave = async () => {
    if (!hasSelection) { setMessage(COPY.selectionRequired); return; }
    setSaving(true);
    await saveAnnotation({ card, roi: currentRoi(), label, note });
    setNote('');
    setMessage(COPY.saveSuccess);
    await refresh();
    setSaving(false);
  };

  const handlePredict = async () => {
    if (!hasSelection) { setMessage(COPY.selectionRequired); return; }
    setSaving(true);
    const result = await predictRoi({ card, roi: currentRoi() });
    setPrediction(result);
    setMessage(result.verdict === 'matched' ? '' : 'Couldn’t confidently match this region yet. Your label will help train it.');
    setSaving(false);
  };

  const handleConfirmCorrection = async () => {
    if (!prediction) return;
    setSaving(true);
    await submitFeedback({ prediction, card, roi: currentRoi(), correctedLabel: label, action: prediction.verdict === 'matched' ? 'confirm' : 'relabel', note });
    setMessage(COPY.saveSuccess);
    await refresh();
    setSaving(false);
  };

  const undo = () => {
    if (mode !== 'quick') return;
    setStrokes((current) => {
      if (!current.length) return current;
      setRedoStack((redo) => [current[current.length - 1], ...redo]);
      return current.slice(0, -1);
    });
  };

  const redo = () => {
    if (mode !== 'quick') return;
    setRedoStack((current) => {
      if (!current.length) return current;
      setStrokes((strokesNow) => [...strokesNow, current[0]]);
      return current.slice(1);
    });
  };

  const clear = () => {
    if (!hasSelection || window.confirm('Clear highlighted region?\n\nThis will remove your current selection.')) {
      if (mode === 'quick') {
        setStrokes([]);
        setRedoStack([]);
      } else {
        setRect(DEFAULT_RECT);
        setPolygonText('');
      }
      setPrediction(null);
    }
  };

  const autoSelect = () => {
    switchMode('quick');
    setTool('highlight');
    setStrokes([{ mode: 'highlight', brush_size: 18, points: [{ x: 35, y: 35 }, { x: 45, y: 31 }, { x: 57, y: 34 }, { x: 65, y: 45 }, { x: 61, y: 58 }, { x: 49, y: 64 }, { x: 37, y: 58 }, { x: 32, y: 46 }, { x: 35, y: 35 }] }]);
    setRedoStack([]);
  };

  return (
    <div className="mt-7 rounded-lg border border-[#E6F7FF]/10 p-4 bg-white/40" aria-label="ROI annotation window">
      <div className="mb-3">
        <div className="font-medium">{COPY.title}</div>
        <div className="text-xs text-[#E6F7FF]/45">Your current selection is preserved when switching tabs.</div>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-lg bg-white/45 border border-[#E6F7FF]/10 p-1 mb-3">
        <button aria-label="Quick highlight tab" onClick={() => switchMode('quick')} className={`px-3 py-2 rounded-md text-sm ${mode === 'quick' ? 'bg-[#D97706] text-white' : 'text-[#E6F7FF]/65'}`}>{COPY.quickTab}</button>
        <button aria-label="Precision shapes tab" onClick={() => switchMode('precision')} className={`px-3 py-2 rounded-md text-sm ${mode === 'precision' ? 'bg-[#D97706] text-white' : 'text-[#E6F7FF]/65'}`}>{COPY.precisionTab}</button>
      </div>

      {mode === 'quick' ? (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button aria-label="Highlight tool" onClick={() => setTool('highlight')} className={`px-3 py-2 rounded-md text-sm ${tool === 'highlight' ? 'bg-[#D97706] text-white' : 'border border-[#E6F7FF]/15'}`}>Highlight</button>
          <button aria-label="Erase tool" onClick={() => setTool('erase')} className={`px-3 py-2 rounded-md text-sm ${tool === 'erase' ? 'bg-[#E6F7FF] text-[#FAF7F2]' : 'border border-[#E6F7FF]/15'}`}>Erase</button>
          <label className="flex items-center gap-2 px-3 py-2 rounded-md border border-[#E6F7FF]/15 text-sm">Brush Size
            <input aria-label="Brush size slider" type="range" min="4" max="28" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-20" />
          </label>
          <button aria-label="Undo last action" onClick={undo} className="px-3 py-2 rounded-md border border-[#E6F7FF]/15 text-sm">Undo</button>
          <button aria-label="Redo last action" onClick={redo} className="px-3 py-2 rounded-md border border-[#E6F7FF]/15 text-sm">Redo</button>
          <button aria-label="Clear current selection" onClick={clear} className="px-3 py-2 rounded-md border border-[#E6F7FF]/15 text-sm">Clear</button>
          <button onClick={autoSelect} className="px-3 py-2 rounded-md border border-[#D97706]/40 text-sm">Auto-Select Object</button>
        </div>
      ) : (
        <div className="mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <button aria-label="Rectangle tool" onClick={() => setPrecisionTool('rectangle')} className={`px-3 py-2 rounded-md text-sm ${precisionTool === 'rectangle' ? 'bg-[#D97706] text-white' : 'border border-[#E6F7FF]/15'}`}>Rectangle</button>
            <button aria-label="Polygon tool" onClick={() => setPrecisionTool('polygon')} className={`px-3 py-2 rounded-md text-sm ${precisionTool === 'polygon' ? 'bg-[#D97706] text-white' : 'border border-[#E6F7FF]/15'}`}>Polygon</button>
            <button onClick={() => setShowCoordinates(!showCoordinates)} className="px-3 py-2 rounded-md border border-[#E6F7FF]/15 text-sm">Edit Points</button>
            <label className="flex items-center gap-2 px-3 py-2 rounded-md border border-[#E6F7FF]/15 text-sm">
              <input aria-label="Show coordinates toggle" type="checkbox" checked={showCoordinates} onChange={(e) => setShowCoordinates(e.target.checked)} />
              Show coordinates
            </label>
            <button onClick={clear} className="px-3 py-2 rounded-md border border-[#E6F7FF]/15 text-sm">Clear</button>
          </div>
          {showCoordinates && (
            <div className="mt-3">
              {precisionTool === 'rectangle' ? (
                <div className="grid grid-cols-4 gap-2">
                  {['x', 'y', 'width', 'height'].map((key) => (
                    <label key={key} className="text-[10px] uppercase tracking-[0.12em] text-[#E6F7FF]/45">{key}
                      <input type="number" min="0" max="100" value={rect[key]} onChange={(e) => setRect({ ...rect, [key]: Number(e.target.value) })} className="mt-1 w-full px-2 py-1 rounded border border-[#E6F7FF]/15 bg-white text-sm" />
                    </label>
                  ))}
                </div>
              ) : (
                <label className="block text-[10px] uppercase tracking-[0.12em] text-[#E6F7FF]/45">Polygon points
                  <input value={polygonText} onChange={(e) => setPolygonText(e.target.value)} placeholder="20,20 70,25 62,68" className="mt-1 w-full px-2 py-1 rounded border border-[#E6F7FF]/15 bg-white text-sm" />
                </label>
              )}
            </div>
          )}
        </div>
      )}

      <div
        ref={imageWrapRef}
        aria-label="Image annotation canvas"
        className="relative overflow-hidden rounded-md border border-[#E6F7FF]/10 bg-white touch-none select-none"
        onPointerDown={startStroke}
        onPointerMove={continueStroke}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
        onPointerLeave={endStroke}
      >
        <img src={card.image.image_url} alt="ROI target" draggable="false" className="w-full block pointer-events-none" />
        {mode === 'quick' && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            {strokes.map((stroke, index) => (
              <path
                key={index}
                d={pointsToPath(stroke.points)}
                fill="none"
                stroke={stroke.mode === 'erase' ? 'rgba(255,255,255,0.85)' : 'rgba(217,119,6,0.52)'}
                strokeWidth={stroke.brush_size / 7}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </svg>
        )}
        {mode === 'precision' && precisionTool === 'rectangle' && <div className="absolute border-2 border-[#D97706] bg-[#D97706]/15" style={{ left: `${rect.x}%`, top: `${rect.y}%`, width: `${rect.width}%`, height: `${rect.height}%` }} />}
        {mode === 'precision' && precisionTool === 'polygon' && (
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon points={polygonText} fill="rgba(217,119,6,0.16)" stroke="#D97706" strokeWidth="1" />
          </svg>
        )}
        {!hasSelection && <div className="absolute inset-x-3 bottom-3 rounded-md bg-white/85 px-3 py-2 text-xs text-[#080A18]/70">{mode === 'quick' ? COPY.hintQuick : COPY.hintPrecision}</div>}
      </div>

      <div className="grid sm:grid-cols-[1fr_1.2fr] gap-2 mt-3">
        <label className="text-[10px] uppercase tracking-[0.12em] text-[#E6F7FF]/45">Region Label
          <select aria-label="Region label input" value={label} onChange={(e) => setLabel(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-md border border-[#E6F7FF]/15 bg-white text-sm">
            {labels.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-[10px] uppercase tracking-[0.12em] text-[#E6F7FF]/45">Optional note
          <input aria-label="Optional note input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add context for this region (optional)" className="mt-1 w-full px-3 py-2 rounded-md border border-[#E6F7FF]/15 bg-white text-sm" />
        </label>
      </div>
      <div className="mt-1 text-xs text-[#E6F7FF]/45">Use consistent labels for better matching. {COPY.statusGeometrySaved}</div>

      <div className="flex flex-wrap gap-2 mt-3">
        <button aria-label="Cancel annotation" onClick={() => setMessage('')} className="px-3 py-2 rounded-md border border-[#E6F7FF]/15 text-sm">Cancel</button>
        <button aria-label="Save annotated region" disabled={saving} onClick={handleSave} className="px-3 py-2 rounded-md bg-[#E6F7FF] text-[#FAF7F2] text-sm disabled:opacity-50">Save Region</button>
        <button disabled={saving} onClick={handlePredict} className="px-3 py-2 rounded-md border border-[#E6F7FF]/15 text-sm disabled:opacity-50">Predict ROI</button>
        {prediction && <button disabled={saving} onClick={handleConfirmCorrection} className="px-3 py-2 rounded-md border border-[#D97706]/40 text-sm disabled:opacity-50">Confirm/correct</button>}
      </div>

      {message && <div className="mt-3 rounded-md bg-white/60 border border-[#E6F7FF]/10 p-2 text-xs text-[#E6F7FF]/65">{message}</div>}

      {prediction && (
        <div className="mt-4 rounded-md border border-[#E6F7FF]/10 bg-white/60 p-3 text-sm">
          <div className="font-medium capitalize">{prediction.verdict}: {prediction.predicted_label}</div>
          <div className="text-xs text-[#E6F7FF]/55 mt-1">Confidence {Math.round(prediction.confidence || 0)}% · Open-set {Number(prediction.open_set_score || 0).toFixed(2)}</div>
          {(prediction.reasons || []).map((reason, index) => <div key={index} className="text-xs mt-1 text-[#E6F7FF]/65">• {reason}</div>)}
        </div>
      )}

      {annotations.length > 0 && (
        <div className="mt-4 space-y-1">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[#E6F7FF]/45">Saved examples</div>
          {annotations.slice(0, 6).map((item) => <div key={item.id} className="text-xs flex justify-between border-t border-[#E6F7FF]/10 py-1"><span className="capitalize">{item.label}</span><span>{item.roi_type}</span></div>)}
        </div>
      )}
    </div>
  );
}