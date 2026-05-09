import { useState, useRef, useEffect, useCallback } from 'react';

type CanvasElement = {
  id: string;
  type: 'text' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  strokeColor?: string;
  strokeWidth?: number;
  bold?: boolean;
  src?: string;
  naturalWidth?: number;
  naturalHeight?: number;
};

type Template = {
  name: string;
  bg: string;
  elements: Omit<CanvasElement, 'id'>[];
};

type Tab = 'editor' | 'ai';
type Ratio = '16:9' | '9:16';

const CANVAS_W = 1280;
const CANVAS_H = 720;

const FONTS = [
  'Impact', 'Arial Black', 'Montserrat', 'Bebas Neue',
  'Oswald', 'Anton', 'Roboto Condensed',
];

const BG_COLORS = [
  '#ff0000', '#ffcc00', '#00cc00', '#0066ff', '#ff6600',
  '#9933ff', '#000000', '#ffffff', '#1a1a2e', '#0f3460',
  '#e94560', '#16213e', '#533483', '#2b2d42',
];

const TEXT_COLORS = [
  '#ffffff', '#000000', '#ffcc00', '#ff0000', '#00ff00',
  '#00ccff', '#ff6600', '#ff00ff',
];

const TEMPLATES: Template[] = [
  {
    name: 'Classic MrBeast',
    bg: '#ff0000',
    elements: [
      { type: 'text', x: 640, y: 200, width: 900, height: 180, rotation: 0, text: 'YOUR TEXT HERE', fontSize: 120, fontFamily: 'Impact', fill: '#ffffff', strokeColor: '#000000', strokeWidth: 8, bold: true },
      { type: 'text', x: 640, y: 420, width: 700, height: 80, rotation: 0, text: 'SUBTITLE', fontSize: 60, fontFamily: 'Impact', fill: '#ffcc00', strokeColor: '#000000', strokeWidth: 5, bold: true },
    ],
  },
  {
    name: 'Dark Hype',
    bg: '#0a0a0a',
    elements: [
      { type: 'text', x: 640, y: 200, width: 900, height: 180, rotation: 0, text: 'SHOCKING', fontSize: 140, fontFamily: 'Impact', fill: '#ffcc00', strokeColor: '#ff0000', strokeWidth: 6, bold: true },
      { type: 'text', x: 640, y: 440, width: 700, height: 60, rotation: 0, text: 'YOU WON\'T BELIEVE THIS', fontSize: 50, fontFamily: 'Arial Black', fill: '#ffffff', strokeColor: '#000000', strokeWidth: 4, bold: true },
    ],
  },
  {
    name: 'Blue Energy',
    bg: '#0066ff',
    elements: [
      { type: 'text', x: 640, y: 180, width: 800, height: 160, rotation: -3, text: 'I TRIED', fontSize: 130, fontFamily: 'Impact', fill: '#ffffff', strokeColor: '#000033', strokeWidth: 7, bold: true },
      { type: 'text', x: 640, y: 400, width: 800, height: 100, rotation: 0, text: 'FOR 24 HOURS', fontSize: 90, fontFamily: 'Impact', fill: '#ffcc00', strokeColor: '#000000', strokeWidth: 6, bold: true },
    ],
  },
  {
    name: 'Money Green',
    bg: '#004d00',
    elements: [
      { type: 'text', x: 640, y: 180, width: 900, height: 160, rotation: 0, text: '$1,000,000', fontSize: 140, fontFamily: 'Impact', fill: '#00ff00', strokeColor: '#000000', strokeWidth: 8, bold: true },
      { type: 'text', x: 640, y: 420, width: 700, height: 70, rotation: 0, text: 'CHALLENGE', fontSize: 70, fontFamily: 'Arial Black', fill: '#ffffff', strokeColor: '#003300', strokeWidth: 5, bold: true },
    ],
  },
  {
    name: 'Blank Canvas',
    bg: '#1a1a2e',
    elements: [],
  },
];

const AI_PRESETS = [
  { label: 'Shocked face reaction', prompt: 'A person with an extremely shocked/surprised facial expression, mouth wide open, eyes wide, dramatic lighting, bright colorful background' },
  { label: 'Money explosion', prompt: 'Piles of cash and gold coins exploding outward, dramatic lighting, dark background with golden glow, money flying everywhere' },
  { label: 'Before/After split', prompt: 'Split screen comparison thumbnail, left side dark and broken, right side bright and amazing, dramatic transformation reveal' },
  { label: 'Giant red arrow pointing', prompt: 'A massive glowing red arrow pointing at a mysterious object or reveal, dark background, dramatic spotlight effect' },
  { label: 'Challenge arena', prompt: 'Epic competition arena with dramatic lighting, spotlights, crowd silhouettes, versus battle setup' },
  { label: 'Unboxing mystery', prompt: 'A mysterious glowing box being opened with bright light pouring out, dark dramatic background, sense of wonder and excitement' },
];

let idCounter = 0;
function newId() { return `el-${++idCounter}`; }

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ─── AI Generator Panel ───────────────────────────────────────────────
type Provider = 'openai' | 'higgsfield' | 'galaxy';

const PROVIDERS: { id: Provider; label: string; desc: string }[] = [
  { id: 'openai', label: 'GPT Image', desc: 'OpenAI GPT Image-1 — best for text on images' },
  { id: 'higgsfield', label: 'Higgsfield', desc: 'Flux model — fast, cinematic style' },
  { id: 'galaxy', label: 'Galaxy.ai', desc: 'Galaxy AI — creative compositions' },
];

function AIGenerator({ onImageGenerated }: { onImageGenerated: (src: string) => void }) {
  const [prompt, setPrompt] = useState('');
  const [ratio, setRatio] = useState<Ratio>('16:9');
  const [provider, setProvider] = useState<Provider>('openai');
  const [claudeEnhance, setClaudeEnhance] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refImage, setRefImage] = useState<string | null>(null);
  const [refPreview, setRefPreview] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  function uploadRef() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setRefPreview(dataUrl);
        // Extract base64 without the data:image/...;base64, prefix
        const base64 = dataUrl.split(',')[1];
        setRefImage(base64);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  async function generate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/tools/thumbnail-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          referenceImage: refImage || undefined,
          aspectRatio: ratio,
          provider,
          claudeEnhance,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const src = `data:image/png;base64,${data.image}`;
      setGeneratedImages(prev => [src, ...prev]);
    } catch {
      setError('Generation failed. Try again or simplify your prompt.');
    } finally {
      setLoading(false);
    }
  }

  function downloadImage(src: string) {
    const a = document.createElement('a');
    a.href = src;
    a.download = `thumbnail-ai-${ratio.replace(':', 'x')}.png`;
    a.click();
  }

  const panelStyle: React.CSSProperties = {
    background: '#111',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '16px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px', display: 'block',
  };

  const btnStyle: React.CSSProperties = {
    padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
    border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
      {/* Left: Controls */}
      <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={panelStyle}>
          <span style={labelStyle}>Describe Your Thumbnail</span>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g. Me looking shocked holding a giant check for $100,000, bright red background, huge white text saying 'I WON'"
            rows={4}
            style={{
              width: '100%', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px', padding: '12px', color: '#fff', fontSize: '15px',
              fontFamily: 'inherit', resize: 'vertical',
            }}
          />

          {/* Quick presets */}
          <span style={{ ...labelStyle, marginTop: '12px' }}>Quick Presets</span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {AI_PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => setPrompt(p.prompt)}
                style={{ ...btnStyle, fontSize: '11px', padding: '5px 10px' }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reference image */}
        <div style={panelStyle}>
          <span style={labelStyle}>Reference Image (Optional)</span>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: '0 0 10px' }}>
            Upload your face or a photo — AI will build the thumbnail around it
          </p>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={uploadRef} style={btnStyle}>
              {refPreview ? 'Change Image' : 'Upload Photo'}
            </button>
            {refPreview && (
              <>
                <img src={refPreview} alt="ref" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} />
                <button onClick={() => { setRefImage(null); setRefPreview(null); }} style={{ ...btnStyle, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', fontSize: '11px' }}>
                  Remove
                </button>
              </>
            )}
          </div>
        </div>

        {/* AI Provider */}
        <div style={panelStyle}>
          <span style={labelStyle}>Image Generator</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
            {PROVIDERS.map(p => (
              <button
                key={p.id}
                onClick={() => setProvider(p.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px', borderRadius: '8px', textAlign: 'left',
                  background: provider === p.id ? 'rgba(0,204,255,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${provider === p.id ? 'rgba(0,204,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  width: '16px', height: '16px', borderRadius: '50%',
                  border: `2px solid ${provider === p.id ? '#00ccff' : 'rgba(255,255,255,0.2)'}`,
                  background: provider === p.id ? '#00ccff' : 'transparent',
                  flexShrink: 0,
                }} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: provider === p.id ? '#fff' : 'rgba(255,255,255,0.6)' }}>{p.label}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{p.desc}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Claude Enhance toggle */}
          <div
            onClick={() => setClaudeEnhance(!claudeEnhance)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
              borderRadius: '8px', cursor: 'pointer', marginBottom: '14px',
              background: claudeEnhance ? 'rgba(167,139,250,0.08)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${claudeEnhance ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            <div style={{
              width: '36px', height: '20px', borderRadius: '10px', position: 'relative',
              background: claudeEnhance ? '#a78bfa' : 'rgba(255,255,255,0.15)',
              transition: 'background 0.2s', flexShrink: 0,
            }}>
              <div style={{
                width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
                position: 'absolute', top: '2px',
                left: claudeEnhance ? '18px' : '2px',
                transition: 'left 0.2s',
              }} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: claudeEnhance ? '#a78bfa' : 'rgba(255,255,255,0.5)' }}>
                Claude Prompt Boost
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                Claude rewrites your prompt for better results
              </div>
            </div>
          </div>

          {/* Aspect Ratio */}
          <span style={labelStyle}>Aspect Ratio</span>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            {(['16:9', '9:16'] as Ratio[]).map(r => (
              <button
                key={r}
                onClick={() => setRatio(r)}
                style={{
                  ...btnStyle, flex: 1,
                  background: ratio === r ? 'rgba(0,204,255,0.1)' : 'rgba(255,255,255,0.05)',
                  color: ratio === r ? '#00ccff' : 'rgba(255,255,255,0.5)',
                  borderColor: ratio === r ? 'rgba(0,204,255,0.3)' : 'rgba(255,255,255,0.12)',
                }}
              >
                {r === '16:9' ? 'YouTube (16:9)' : 'Shorts (9:16)'}
              </button>
            ))}
          </div>

          <button
            onClick={generate}
            disabled={!prompt.trim() || loading}
            style={{
              width: '100%', padding: '14px', borderRadius: '10px', fontWeight: 700,
              fontSize: '16px', border: 'none', cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer',
              background: prompt.trim() && !loading ? '#fff' : '#1a1a1a',
              color: prompt.trim() && !loading ? '#000' : 'rgba(255,255,255,0.3)',
            }}
          >
            {loading ? `Generating with ${PROVIDERS.find(p => p.id === provider)?.label}...` : `Generate with ${PROVIDERS.find(p => p.id === provider)?.label}`}
          </button>

          {error && (
            <div style={{ marginTop: '10px', background: '#ff4d4d15', border: '1px solid #ff4d4d30', borderRadius: '8px', padding: '10px 14px', color: '#ff4d4d', fontSize: '13px' }}>
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Right: Results */}
      <div style={{ flex: '1 1 400px' }}>
        {loading && (
          <div style={{ ...panelStyle, textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ width: '28px', height: '28px', border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>AI is creating your thumbnail...</div>
            <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', marginTop: '4px' }}>This takes 10-30 seconds</div>
          </div>
        )}

        {generatedImages.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {generatedImages.map((src, i) => (
              <div key={i} style={panelStyle}>
                <img
                  src={src}
                  alt={`Generated thumbnail ${i + 1}`}
                  style={{
                    width: '100%', borderRadius: '8px', display: 'block', marginBottom: '10px',
                  }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => downloadImage(src)} style={{ ...btnStyle, background: 'rgba(34,197,94,0.1)', color: '#22c55e', borderColor: 'rgba(34,197,94,0.3)' }}>
                    Download PNG
                  </button>
                  <button onClick={() => onImageGenerated(src)} style={{ ...btnStyle, background: 'rgba(0,204,255,0.1)', color: '#00ccff', borderColor: 'rgba(0,204,255,0.3)' }}>
                    Send to Editor
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && generatedImages.length === 0 && (
          <div style={{ ...panelStyle, textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.2)' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>AI</div>
            <div style={{ fontSize: '14px' }}>Describe your thumbnail and hit generate</div>
            <div style={{ fontSize: '12px', marginTop: '6px' }}>Upload a photo of yourself for personalized results</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Thumbnail Maker ─────────────────────────────────────────────
export default function ThumbnailMaker() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  const [tab, setTab] = useState<Tab>('ai');
  const [bgColor, setBgColor] = useState('#ff0000');
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  const selected = elements.find(e => e.id === selectedId) || null;

  // When AI generates an image, send it to the editor as a background
  function handleAIImageToEditor(src: string) {
    setBgImage(src);
    setTab('editor');
  }

  useEffect(() => {
    function updateScale() {
      if (containerRef.current) {
        const containerW = containerRef.current.clientWidth;
        setScale(Math.min(containerW / CANVAS_W, 1));
      }
    }
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const render = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    if (bgImage) {
      try {
        let img = imageCache.current.get(bgImage);
        if (!img) {
          img = await loadImage(bgImage);
          imageCache.current.set(bgImage, img);
        }
        const imgRatio = img.width / img.height;
        const canvasRatio = CANVAS_W / CANVAS_H;
        let drawW, drawH, drawX, drawY;
        if (imgRatio > canvasRatio) {
          drawH = CANVAS_H; drawW = drawH * imgRatio; drawX = (CANVAS_W - drawW) / 2; drawY = 0;
        } else {
          drawW = CANVAS_W; drawH = drawW / imgRatio; drawX = 0; drawY = (CANVAS_H - drawH) / 2;
        }
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
      } catch { /* skip */ }
    }

    for (const el of elements) {
      ctx.save();
      ctx.translate(el.x, el.y);
      if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);

      if (el.type === 'text' && el.text) {
        const fontStyle = el.bold ? 'bold' : 'normal';
        ctx.font = `${fontStyle} ${el.fontSize || 80}px "${el.fontFamily || 'Impact'}", Impact, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (el.strokeWidth && el.strokeWidth > 0) {
          ctx.strokeStyle = el.strokeColor || '#000000';
          ctx.lineWidth = el.strokeWidth;
          ctx.lineJoin = 'round';
          ctx.miterLimit = 2;
          ctx.strokeText(el.text, 0, 0);
        }
        ctx.fillStyle = el.fill || '#ffffff';
        ctx.fillText(el.text, 0, 0);
      }

      if (el.type === 'image' && el.src) {
        try {
          let img = imageCache.current.get(el.src);
          if (!img) {
            img = await loadImage(el.src);
            imageCache.current.set(el.src, img);
          }
          ctx.drawImage(img, -el.width / 2, -el.height / 2, el.width, el.height);
        } catch { /* skip */ }
      }

      ctx.restore();
    }

    if (selectedId) {
      const sel = elements.find(e => e.id === selectedId);
      if (sel) {
        ctx.save();
        ctx.translate(sel.x, sel.y);
        if (sel.rotation) ctx.rotate((sel.rotation * Math.PI) / 180);
        let bw: number, bh: number;
        if (sel.type === 'text') {
          const fontStyle = sel.bold ? 'bold' : 'normal';
          ctx.font = `${fontStyle} ${sel.fontSize || 80}px "${sel.fontFamily || 'Impact'}", Impact, sans-serif`;
          const m = ctx.measureText(sel.text || '');
          bw = m.width + 20;
          bh = (sel.fontSize || 80) * 1.3;
        } else {
          bw = sel.width + 10;
          bh = sel.height + 10;
        }
        ctx.strokeStyle = '#00ccff';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);
        ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
        ctx.setLineDash([]);
        ctx.fillStyle = '#00ccff';
        ctx.fillRect(bw / 2 - 8, bh / 2 - 8, 16, 16);
        ctx.restore();
      }
    }
  }, [bgColor, bgImage, elements, selectedId]);

  useEffect(() => { render(); }, [render]);

  function canvasCoords(e: React.MouseEvent) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale };
  }

  function hitTest(mx: number, my: number): CanvasElement | null {
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      let hw: number, hh: number;
      if (el.type === 'text') {
        hw = (el.width || 400) / 2; hh = ((el.fontSize || 80) * 1.3) / 2;
      } else {
        hw = el.width / 2; hh = el.height / 2;
      }
      if (mx >= el.x - hw && mx <= el.x + hw && my >= el.y - hh && my <= el.y + hh) return el;
    }
    return null;
  }

  function isOnResizeHandle(mx: number, my: number): boolean {
    if (!selected) return false;
    let hw: number, hh: number;
    if (selected.type === 'text') {
      hw = (selected.width || 400) / 2; hh = ((selected.fontSize || 80) * 1.3) / 2;
    } else {
      hw = selected.width / 2; hh = selected.height / 2;
    }
    return Math.abs(mx - (selected.x + hw)) < 16 && Math.abs(my - (selected.y + hh)) < 16;
  }

  function onMouseDown(e: React.MouseEvent) {
    const { x, y } = canvasCoords(e);
    if (selected && isOnResizeHandle(x, y)) { setResizing(true); return; }
    const hit = hitTest(x, y);
    if (hit) { setSelectedId(hit.id); setDragging(true); setDragOffset({ x: x - hit.x, y: y - hit.y }); }
    else setSelectedId(null);
  }

  function onMouseMove(e: React.MouseEvent) {
    if (dragging && selectedId) {
      const { x, y } = canvasCoords(e);
      setElements(prev => prev.map(el => el.id === selectedId ? { ...el, x: x - dragOffset.x, y: y - dragOffset.y } : el));
    }
    if (resizing && selected) {
      const { x, y } = canvasCoords(e);
      if (selected.type === 'text') {
        const newSize = Math.max(20, Math.min(300, Math.abs(y - selected.y) * 2));
        setElements(prev => prev.map(el => el.id === selectedId ? { ...el, fontSize: Math.round(newSize) } : el));
      } else {
        const newW = Math.max(50, (x - selected.x) * 2);
        const ratio = selected.naturalHeight && selected.naturalWidth ? selected.naturalHeight / selected.naturalWidth : selected.height / selected.width;
        setElements(prev => prev.map(el => el.id === selectedId ? { ...el, width: Math.round(newW), height: Math.round(newW * ratio) } : el));
      }
    }
  }

  function onMouseUp() { setDragging(false); setResizing(false); }

  function addText() {
    const el: CanvasElement = {
      id: newId(), type: 'text', x: CANVAS_W / 2, y: CANVAS_H / 2,
      width: 600, height: 120, rotation: 0, text: 'YOUR TEXT',
      fontSize: 100, fontFamily: 'Impact', fill: '#ffffff',
      strokeColor: '#000000', strokeWidth: 6, bold: true,
    };
    setElements(prev => [...prev, el]);
    setSelectedId(el.id);
  }

  function uploadImage(asBg: boolean) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const src = ev.target?.result as string;
        if (asBg) { setBgImage(src); return; }
        const img = await loadImage(src);
        const maxH = CANVAS_H * 0.7;
        const ratio = img.width / img.height;
        let w = img.width, h = img.height;
        if (h > maxH) { h = maxH; w = h * ratio; }
        if (w > CANVAS_W * 0.7) { w = CANVAS_W * 0.7; h = w / ratio; }
        const el: CanvasElement = {
          id: newId(), type: 'image', x: CANVAS_W / 2, y: CANVAS_H / 2,
          width: Math.round(w), height: Math.round(h), rotation: 0,
          src, naturalWidth: img.width, naturalHeight: img.height,
        };
        setElements(prev => [...prev, el]);
        setSelectedId(el.id);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  function updateSelected(updates: Partial<CanvasElement>) {
    if (!selectedId) return;
    setElements(prev => prev.map(el => el.id === selectedId ? { ...el, ...updates } : el));
  }

  function deleteSelected() {
    if (!selectedId) return;
    setElements(prev => prev.filter(el => el.id !== selectedId));
    setSelectedId(null);
  }

  function moveUp() {
    if (!selectedId) return;
    setElements(prev => {
      const idx = prev.findIndex(e => e.id === selectedId);
      if (idx < prev.length - 1) { const next = [...prev]; [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]; return next; }
      return prev;
    });
  }

  function moveDown() {
    if (!selectedId) return;
    setElements(prev => {
      const idx = prev.findIndex(e => e.id === selectedId);
      if (idx > 0) { const next = [...prev]; [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]]; return next; }
      return prev;
    });
  }

  function duplicateSelected() {
    if (!selected) return;
    const dup: CanvasElement = { ...selected, id: newId(), x: selected.x + 30, y: selected.y + 30 };
    setElements(prev => [...prev, dup]);
    setSelectedId(dup.id);
  }

  function applyTemplate(t: Template) {
    setBgColor(t.bg); setBgImage(null); imageCache.current.clear();
    setElements(t.elements.map(e => ({ ...e, id: newId() })) as CanvasElement[]);
    setSelectedId(null);
  }

  function exportPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const prevSelected = selectedId;
    setSelectedId(null);
    setTimeout(() => {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl; a.download = 'thumbnail-1280x720.png'; a.click();
      setSelectedId(prevSelected);
    }, 50);
  }

  const panelStyle: React.CSSProperties = {
    background: '#111', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px', padding: '16px',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px', display: 'block',
  };
  const btnStyle: React.CSSProperties = {
    padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
    border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
  };
  const btnPrimaryStyle: React.CSSProperties = {
    ...btnStyle, background: '#ffffff', color: '#000000', border: '1px solid #ffffff',
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 24px', borderRadius: '10px 10px 0 0', fontSize: '15px', fontWeight: 600,
    border: 'none', cursor: 'pointer',
    background: active ? '#111' : 'transparent',
    color: active ? '#fff' : 'rgba(255,255,255,0.4)',
    borderBottom: active ? '2px solid #00ccff' : '2px solid transparent',
  });

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 24px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
        Thumbnail Maker
      </h1>
      <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.45)', marginBottom: '20px' }}>
        AI-powered generation + drag-and-drop editor — create viral thumbnails in seconds
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={() => setTab('ai')} style={tabStyle(tab === 'ai')}>
          AI Generator
        </button>
        <button onClick={() => setTab('editor')} style={tabStyle(tab === 'editor')}>
          Manual Editor
        </button>
      </div>

      {/* AI Tab */}
      {tab === 'ai' && (
        <AIGenerator onImageGenerated={handleAIImageToEditor} />
      )}

      {/* Editor Tab */}
      {tab === 'editor' && (
        <>
          {/* Templates */}
          <div style={{ marginBottom: '20px' }}>
            <span style={labelStyle}>Templates</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {TEMPLATES.map(t => (
                <button key={t.name} onClick={() => applyTemplate(t)} style={{
                  ...btnStyle, background: t.bg,
                  color: ['#000000', '#ffcc00', '#ffffff'].includes(t.bg) ? '#000' : '#fff',
                  border: `2px solid ${t.bg === '#000000' ? 'rgba(255,255,255,0.2)' : t.bg}`,
                  fontSize: '12px', padding: '6px 14px',
                }}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Canvas */}
            <div ref={containerRef} style={{ flex: '1 1 700px', minWidth: '300px' }}>
              <div style={{ ...panelStyle, padding: '8px', display: 'inline-block', width: '100%' }}>
                <canvas
                  ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
                  onMouseDown={onMouseDown} onMouseMove={onMouseMove}
                  onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
                  style={{
                    width: '100%', height: 'auto', borderRadius: '8px',
                    cursor: dragging ? 'grabbing' : resizing ? 'nwse-resize' : 'crosshair',
                    display: 'block',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                <button onClick={addText} style={btnStyle}>+ Add Text</button>
                <button onClick={() => uploadImage(false)} style={btnStyle}>+ Add Image</button>
                <button onClick={() => uploadImage(true)} style={btnStyle}>+ Background Image</button>
                {selected && (
                  <>
                    <button onClick={duplicateSelected} style={btnStyle}>Duplicate</button>
                    <button onClick={moveUp} style={btnStyle}>Layer Up</button>
                    <button onClick={moveDown} style={btnStyle}>Layer Down</button>
                    <button onClick={deleteSelected} style={{ ...btnStyle, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>Delete</button>
                  </>
                )}
                <div style={{ flex: 1 }} />
                <button onClick={exportPng} style={btnPrimaryStyle}>Download PNG (1280x720)</button>
              </div>
            </div>

            {/* Properties panel */}
            <div style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={panelStyle}>
                <span style={labelStyle}>Background Color</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {BG_COLORS.map(c => (
                    <button key={c} onClick={() => setBgColor(c)} style={{
                      width: '28px', height: '28px', borderRadius: '6px', background: c,
                      border: bgColor === c ? '3px solid #00ccff' : '2px solid rgba(255,255,255,0.15)',
                      cursor: 'pointer', padding: 0,
                    }} />
                  ))}
                  <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                    style={{ width: '28px', height: '28px', border: 'none', padding: 0, cursor: 'pointer', borderRadius: '6px' }} />
                </div>
                {bgImage && (
                  <button onClick={() => setBgImage(null)} style={{ ...btnStyle, marginTop: '10px', fontSize: '11px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>
                    Remove BG Image
                  </button>
                )}
              </div>

              {selected?.type === 'text' && (
                <div style={panelStyle}>
                  <span style={labelStyle}>Text Properties</span>
                  <textarea value={selected.text || ''} onChange={e => updateSelected({ text: e.target.value })} rows={2}
                    style={{ width: '100%', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', marginBottom: '10px' }} />

                  <span style={{ ...labelStyle, marginTop: '4px' }}>Font</span>
                  <select value={selected.fontFamily} onChange={e => updateSelected({ fontFamily: e.target.value })}
                    style={{ width: '100%', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '13px', marginBottom: '10px' }}>
                    {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>

                  <span style={labelStyle}>Size: {selected.fontSize}px</span>
                  <input type="range" min={20} max={300} value={selected.fontSize || 80} onChange={e => updateSelected({ fontSize: Number(e.target.value) })} style={{ width: '100%', marginBottom: '10px' }} />

                  <span style={labelStyle}>Text Color</span>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    {TEXT_COLORS.map(c => (
                      <button key={c} onClick={() => updateSelected({ fill: c })} style={{
                        width: '24px', height: '24px', borderRadius: '5px', background: c,
                        border: selected.fill === c ? '3px solid #00ccff' : '2px solid rgba(255,255,255,0.15)',
                        cursor: 'pointer', padding: 0,
                      }} />
                    ))}
                    <input type="color" value={selected.fill || '#ffffff'} onChange={e => updateSelected({ fill: e.target.value })}
                      style={{ width: '24px', height: '24px', border: 'none', padding: 0, cursor: 'pointer', borderRadius: '5px' }} />
                  </div>

                  <span style={labelStyle}>Outline Color</span>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    {TEXT_COLORS.map(c => (
                      <button key={c} onClick={() => updateSelected({ strokeColor: c })} style={{
                        width: '24px', height: '24px', borderRadius: '5px', background: c,
                        border: selected.strokeColor === c ? '3px solid #00ccff' : '2px solid rgba(255,255,255,0.15)',
                        cursor: 'pointer', padding: 0,
                      }} />
                    ))}
                  </div>

                  <span style={labelStyle}>Outline Thickness: {selected.strokeWidth}px</span>
                  <input type="range" min={0} max={20} value={selected.strokeWidth || 0} onChange={e => updateSelected({ strokeWidth: Number(e.target.value) })} style={{ width: '100%', marginBottom: '10px' }} />

                  <span style={labelStyle}>Rotation: {selected.rotation}deg</span>
                  <input type="range" min={-45} max={45} value={selected.rotation} onChange={e => updateSelected({ rotation: Number(e.target.value) })} style={{ width: '100%' }} />
                </div>
              )}

              {selected?.type === 'image' && (
                <div style={panelStyle}>
                  <span style={labelStyle}>Image Properties</span>
                  <span style={labelStyle}>Size: {selected.width} x {selected.height}</span>
                  <input type="range" min={50} max={CANVAS_W} value={selected.width}
                    onChange={e => {
                      const w = Number(e.target.value);
                      const ratio = (selected.naturalHeight || selected.height) / (selected.naturalWidth || selected.width);
                      updateSelected({ width: w, height: Math.round(w * ratio) });
                    }} style={{ width: '100%', marginBottom: '10px' }} />
                  <span style={labelStyle}>Rotation: {selected.rotation}deg</span>
                  <input type="range" min={-180} max={180} value={selected.rotation} onChange={e => updateSelected({ rotation: Number(e.target.value) })} style={{ width: '100%' }} />
                </div>
              )}

              {!selected && (
                <div style={{ ...panelStyle, color: 'rgba(255,255,255,0.3)', fontSize: '13px', textAlign: 'center' }}>
                  Click an element on the canvas to edit it
                </div>
              )}

              <div style={{ ...panelStyle, padding: '12px 16px' }}>
                <span style={labelStyle}>Tips</span>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
                  Drag elements to reposition<br />
                  Drag blue corner handle to resize<br />
                  Use Layer Up/Down to reorder<br />
                  Upload your face photo as an image<br />
                  Use bold text + thick outlines for MrBeast style
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
