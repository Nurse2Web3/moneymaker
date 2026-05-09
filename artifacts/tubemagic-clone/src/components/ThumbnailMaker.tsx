import { useState, useRef, useEffect, useCallback } from 'react';

type CanvasElement = {
  id: string;
  type: 'text' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  // text props
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  strokeColor?: string;
  strokeWidth?: number;
  bold?: boolean;
  // image props
  src?: string;
  naturalWidth?: number;
  naturalHeight?: number;
};

type Template = {
  name: string;
  bg: string;
  elements: Omit<CanvasElement, 'id'>[];
};

const CANVAS_W = 1280;
const CANVAS_H = 720;

const FONTS = [
  'Impact',
  'Arial Black',
  'Montserrat',
  'Bebas Neue',
  'Oswald',
  'Anton',
  'Roboto Condensed',
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

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default function ThumbnailMaker() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  const [bgColor, setBgColor] = useState('#ff0000');
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  const selected = elements.find(e => e.id === selectedId) || null;

  // Calculate scale to fit container
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

  // Render canvas
  const render = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Background image
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
          drawH = CANVAS_H;
          drawW = drawH * imgRatio;
          drawX = (CANVAS_W - drawW) / 2;
          drawY = 0;
        } else {
          drawW = CANVAS_W;
          drawH = drawW / imgRatio;
          drawX = 0;
          drawY = (CANVAS_H - drawH) / 2;
        }
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
      } catch { /* skip */ }
    }

    // Draw elements
    for (const el of elements) {
      ctx.save();
      ctx.translate(el.x, el.y);
      if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);

      if (el.type === 'text' && el.text) {
        const fontStyle = el.bold ? 'bold' : 'normal';
        ctx.font = `${fontStyle} ${el.fontSize || 80}px "${el.fontFamily || 'Impact'}", Impact, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Stroke (outline)
        if (el.strokeWidth && el.strokeWidth > 0) {
          ctx.strokeStyle = el.strokeColor || '#000000';
          ctx.lineWidth = el.strokeWidth;
          ctx.lineJoin = 'round';
          ctx.miterLimit = 2;
          ctx.strokeText(el.text, 0, 0);
        }

        // Fill
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

    // Selection box
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

        // Resize handle
        ctx.fillStyle = '#00ccff';
        ctx.fillRect(bw / 2 - 8, bh / 2 - 8, 16, 16);

        ctx.restore();
      }
    }
  }, [bgColor, bgImage, elements, selectedId]);

  useEffect(() => { render(); }, [render]);

  // Mouse helpers
  function canvasCoords(e: React.MouseEvent) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  }

  function hitTest(mx: number, my: number): CanvasElement | null {
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      let hw: number, hh: number;
      if (el.type === 'text') {
        hw = (el.width || 400) / 2;
        hh = ((el.fontSize || 80) * 1.3) / 2;
      } else {
        hw = el.width / 2;
        hh = el.height / 2;
      }
      if (mx >= el.x - hw && mx <= el.x + hw && my >= el.y - hh && my <= el.y + hh) {
        return el;
      }
    }
    return null;
  }

  function isOnResizeHandle(mx: number, my: number): boolean {
    if (!selected) return false;
    let hw: number, hh: number;
    if (selected.type === 'text') {
      hw = (selected.width || 400) / 2;
      hh = ((selected.fontSize || 80) * 1.3) / 2;
    } else {
      hw = selected.width / 2;
      hh = selected.height / 2;
    }
    const hx = selected.x + hw;
    const hy = selected.y + hh;
    return Math.abs(mx - hx) < 16 && Math.abs(my - hy) < 16;
  }

  function onMouseDown(e: React.MouseEvent) {
    const { x, y } = canvasCoords(e);

    if (selected && isOnResizeHandle(x, y)) {
      setResizing(true);
      return;
    }

    const hit = hitTest(x, y);
    if (hit) {
      setSelectedId(hit.id);
      setDragging(true);
      setDragOffset({ x: x - hit.x, y: y - hit.y });
    } else {
      setSelectedId(null);
    }
  }

  function onMouseMove(e: React.MouseEvent) {
    if (dragging && selectedId) {
      const { x, y } = canvasCoords(e);
      setElements(prev => prev.map(el =>
        el.id === selectedId ? { ...el, x: x - dragOffset.x, y: y - dragOffset.y } : el
      ));
    }
    if (resizing && selected) {
      const { x, y } = canvasCoords(e);
      if (selected.type === 'text') {
        const newSize = Math.max(20, Math.min(300, Math.abs(y - selected.y) * 2));
        setElements(prev => prev.map(el =>
          el.id === selectedId ? { ...el, fontSize: Math.round(newSize) } : el
        ));
      } else {
        const newW = Math.max(50, (x - selected.x) * 2);
        const ratio = selected.naturalHeight && selected.naturalWidth ? selected.naturalHeight / selected.naturalWidth : selected.height / selected.width;
        setElements(prev => prev.map(el =>
          el.id === selectedId ? { ...el, width: Math.round(newW), height: Math.round(newW * ratio) } : el
        ));
      }
    }
  }

  function onMouseUp() {
    setDragging(false);
    setResizing(false);
  }

  // Add text
  function addText() {
    const el: CanvasElement = {
      id: newId(),
      type: 'text',
      x: CANVAS_W / 2,
      y: CANVAS_H / 2,
      width: 600,
      height: 120,
      rotation: 0,
      text: 'YOUR TEXT',
      fontSize: 100,
      fontFamily: 'Impact',
      fill: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 6,
      bold: true,
    };
    setElements(prev => [...prev, el]);
    setSelectedId(el.id);
  }

  // Upload image
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
        if (asBg) {
          setBgImage(src);
        } else {
          const img = await loadImage(src);
          const maxH = CANVAS_H * 0.7;
          const ratio = img.width / img.height;
          let w = img.width;
          let h = img.height;
          if (h > maxH) { h = maxH; w = h * ratio; }
          if (w > CANVAS_W * 0.7) { w = CANVAS_W * 0.7; h = w / ratio; }
          const el: CanvasElement = {
            id: newId(),
            type: 'image',
            x: CANVAS_W / 2,
            y: CANVAS_H / 2,
            width: Math.round(w),
            height: Math.round(h),
            rotation: 0,
            src,
            naturalWidth: img.width,
            naturalHeight: img.height,
          };
          setElements(prev => [...prev, el]);
          setSelectedId(el.id);
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  // Update selected element
  function updateSelected(updates: Partial<CanvasElement>) {
    if (!selectedId) return;
    setElements(prev => prev.map(el => el.id === selectedId ? { ...el, ...updates } : el));
  }

  // Delete selected
  function deleteSelected() {
    if (!selectedId) return;
    setElements(prev => prev.filter(el => el.id !== selectedId));
    setSelectedId(null);
  }

  // Layer controls
  function moveUp() {
    if (!selectedId) return;
    setElements(prev => {
      const idx = prev.findIndex(e => e.id === selectedId);
      if (idx < prev.length - 1) {
        const next = [...prev];
        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
        return next;
      }
      return prev;
    });
  }

  function moveDown() {
    if (!selectedId) return;
    setElements(prev => {
      const idx = prev.findIndex(e => e.id === selectedId);
      if (idx > 0) {
        const next = [...prev];
        [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
        return next;
      }
      return prev;
    });
  }

  // Duplicate
  function duplicateSelected() {
    if (!selected) return;
    const dup: CanvasElement = { ...selected, id: newId(), x: selected.x + 30, y: selected.y + 30 };
    setElements(prev => [...prev, dup]);
    setSelectedId(dup.id);
  }

  // Apply template
  function applyTemplate(t: Template) {
    setBgColor(t.bg);
    setBgImage(null);
    imageCache.current.clear();
    const newEls = t.elements.map(e => ({ ...e, id: newId() })) as CanvasElement[];
    setElements(newEls);
    setSelectedId(null);
  }

  // Export
  function exportPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Re-render without selection box
    const prevSelected = selectedId;
    setSelectedId(null);
    setTimeout(() => {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'thumbnail-1280x720.png';
      a.click();
      setSelectedId(prevSelected);
    }, 50);
  }

  // Styles
  const panelStyle: React.CSSProperties = {
    background: '#111',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '16px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 700,
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.07em',
    marginBottom: '8px',
    display: 'block',
  };

  const btnStyle: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.7)',
    cursor: 'pointer',
  };

  const btnPrimaryStyle: React.CSSProperties = {
    ...btnStyle,
    background: '#ffffff',
    color: '#000000',
    border: '1px solid #ffffff',
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
        Thumbnail Maker
      </h1>
      <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.45)', marginBottom: '24px' }}>
        Drag-and-drop editor — upload your face, add bold text, export YouTube-ready thumbnails
      </p>

      {/* Templates */}
      <div style={{ marginBottom: '20px' }}>
        <span style={labelStyle}>Templates</span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {TEMPLATES.map(t => (
            <button
              key={t.name}
              onClick={() => applyTemplate(t)}
              style={{
                ...btnStyle,
                background: t.bg,
                color: ['#000000', '#ffcc00', '#ffffff'].includes(t.bg) ? '#000' : '#fff',
                border: `2px solid ${t.bg === '#000000' ? 'rgba(255,255,255,0.2)' : t.bg}`,
                fontSize: '12px',
                padding: '6px 14px',
              }}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Canvas */}
        <div ref={containerRef} style={{ flex: '1 1 700px', minWidth: '300px' }}>
          <div style={{
            ...panelStyle,
            padding: '8px',
            display: 'inline-block',
            width: '100%',
          }}>
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: '8px',
                cursor: dragging ? 'grabbing' : resizing ? 'nwse-resize' : 'crosshair',
                display: 'block',
              }}
            />
          </div>

          {/* Action bar */}
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
          {/* Background color */}
          <div style={panelStyle}>
            <span style={labelStyle}>Background Color</span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {BG_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setBgColor(c)}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    background: c,
                    border: bgColor === c ? '3px solid #00ccff' : '2px solid rgba(255,255,255,0.15)',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                />
              ))}
              <input
                type="color"
                value={bgColor}
                onChange={e => setBgColor(e.target.value)}
                style={{ width: '28px', height: '28px', border: 'none', padding: 0, cursor: 'pointer', borderRadius: '6px' }}
              />
            </div>
            {bgImage && (
              <button
                onClick={() => setBgImage(null)}
                style={{ ...btnStyle, marginTop: '10px', fontSize: '11px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
              >
                Remove BG Image
              </button>
            )}
          </div>

          {/* Text properties */}
          {selected?.type === 'text' && (
            <div style={panelStyle}>
              <span style={labelStyle}>Text Properties</span>

              <textarea
                value={selected.text || ''}
                onChange={e => updateSelected({ text: e.target.value })}
                rows={2}
                style={{
                  width: '100%',
                  background: '#0a0a0a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  marginBottom: '10px',
                }}
              />

              {/* Font */}
              <span style={{ ...labelStyle, marginTop: '4px' }}>Font</span>
              <select
                value={selected.fontFamily}
                onChange={e => updateSelected({ fontFamily: e.target.value })}
                style={{
                  width: '100%',
                  background: '#0a0a0a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: '13px',
                  marginBottom: '10px',
                }}
              >
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>

              {/* Font size */}
              <span style={labelStyle}>Size: {selected.fontSize}px</span>
              <input
                type="range"
                min={20}
                max={300}
                value={selected.fontSize || 80}
                onChange={e => updateSelected({ fontSize: Number(e.target.value) })}
                style={{ width: '100%', marginBottom: '10px' }}
              />

              {/* Text color */}
              <span style={labelStyle}>Text Color</span>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {TEXT_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => updateSelected({ fill: c })}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '5px',
                      background: c,
                      border: selected.fill === c ? '3px solid #00ccff' : '2px solid rgba(255,255,255,0.15)',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  />
                ))}
                <input
                  type="color"
                  value={selected.fill || '#ffffff'}
                  onChange={e => updateSelected({ fill: e.target.value })}
                  style={{ width: '24px', height: '24px', border: 'none', padding: 0, cursor: 'pointer', borderRadius: '5px' }}
                />
              </div>

              {/* Stroke color */}
              <span style={labelStyle}>Outline Color</span>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {TEXT_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => updateSelected({ strokeColor: c })}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '5px',
                      background: c,
                      border: selected.strokeColor === c ? '3px solid #00ccff' : '2px solid rgba(255,255,255,0.15)',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  />
                ))}
              </div>

              {/* Stroke width */}
              <span style={labelStyle}>Outline Thickness: {selected.strokeWidth}px</span>
              <input
                type="range"
                min={0}
                max={20}
                value={selected.strokeWidth || 0}
                onChange={e => updateSelected({ strokeWidth: Number(e.target.value) })}
                style={{ width: '100%', marginBottom: '10px' }}
              />

              {/* Rotation */}
              <span style={labelStyle}>Rotation: {selected.rotation}deg</span>
              <input
                type="range"
                min={-45}
                max={45}
                value={selected.rotation}
                onChange={e => updateSelected({ rotation: Number(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>
          )}

          {/* Image properties */}
          {selected?.type === 'image' && (
            <div style={panelStyle}>
              <span style={labelStyle}>Image Properties</span>

              <span style={labelStyle}>Size: {selected.width} x {selected.height}</span>
              <input
                type="range"
                min={50}
                max={CANVAS_W}
                value={selected.width}
                onChange={e => {
                  const w = Number(e.target.value);
                  const ratio = (selected.naturalHeight || selected.height) / (selected.naturalWidth || selected.width);
                  updateSelected({ width: w, height: Math.round(w * ratio) });
                }}
                style={{ width: '100%', marginBottom: '10px' }}
              />

              <span style={labelStyle}>Rotation: {selected.rotation}deg</span>
              <input
                type="range"
                min={-180}
                max={180}
                value={selected.rotation}
                onChange={e => updateSelected({ rotation: Number(e.target.value) })}
                style={{ width: '100%' }}
              />
            </div>
          )}

          {!selected && (
            <div style={{ ...panelStyle, color: 'rgba(255,255,255,0.3)', fontSize: '13px', textAlign: 'center' }}>
              Click an element on the canvas to edit it
            </div>
          )}

          {/* Keyboard shortcuts */}
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
    </div>
  );
}
