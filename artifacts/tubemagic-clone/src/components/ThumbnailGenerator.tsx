import { useState } from 'react';

interface ThumbnailSuggestion {
  mainText: string;
  subText: string;
  style: string;
  colorScheme: string;
  why: string;
}

const styleIcons: Record<string, string> = {
  'Number/List': '🔢',
  'Shock/Curiosity': '😱',
  'Personal Result': '💰',
  'Versus/Comparison': '⚔️',
  'Question': '❓',
  'Bold Statement': '🔥',
};

const colorBg: Record<string, string> = {
  'Red + White': 'linear-gradient(135deg,#b91c1c,#ef4444)',
  'Yellow + Black': 'linear-gradient(135deg,#ca8a04,#eab308)',
  'Black + Gold': 'linear-gradient(135deg,#111,#1c1c1c)',
  'Blue + White': 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
  'Orange + Black': 'linear-gradient(135deg,#c2410c,#f97316)',
  'Green + White': 'linear-gradient(135deg,#15803d,#22c55e)',
  'Purple + Yellow': 'linear-gradient(135deg,#6d28d9,#8b5cf6)',
  'White + Black': 'linear-gradient(135deg,#e5e7eb,#fff)',
};

const colorText: Record<string, string> = {
  'Yellow + Black': '#000',
  'White + Black': '#111',
};

type Ratio = '16:9' | '9:16';

const RATIO_META: Record<Ratio, { label: string; platform: string; w: number; h: number }> = {
  '16:9': { label: '16:9 — YouTube', platform: '1280 × 720 px', w: 1280, h: 720 },
  '9:16': { label: '9:16 — TikTok / Shorts', platform: '1080 × 1920 px', w: 1080, h: 1920 },
};

function downloadResized(src: string, ratio: Ratio, filename: string) {
  const { w, h } = RATIO_META[ratio];
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, w, h);
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = filename;
    a.click();
  };
  img.src = src;
}

function GeneratedImage({ src, ratio, onDownload }: { src: string; ratio: Ratio; onDownload: () => void }) {
  const meta = RATIO_META[ratio];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.06em' }}>{meta.label}</div>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>{meta.platform}</div>
      </div>
      <img
        src={src}
        alt={`${ratio} thumbnail`}
        style={{
          width: ratio === '16:9' ? '100%' : 'auto',
          height: ratio === '9:16' ? '220px' : 'auto',
          maxWidth: '100%',
          borderRadius: '6px',
          display: 'block',
        }}
      />
      <button
        onClick={onDownload}
        style={{ padding: '5px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', cursor: 'pointer' }}
      >
        ↓ Download {meta.platform}
      </button>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '16px 0' }}>
      <div style={{ width: '22px', height: '22px', border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Generating…</span>
    </div>
  );
}

function ThumbnailCard({ s, i, title, niche, copiedIdx, onCopy }: {
  s: ThumbnailSuggestion; i: number; title: string; niche: string;
  copiedIdx: number | null; onCopy: (s: ThumbnailSuggestion, i: number) => void;
}) {
  const [images, setImages] = useState<Record<Ratio, string | null>>({ '16:9': null, '9:16': null });
  const [loading, setLoading] = useState<Record<Ratio, boolean>>({ '16:9': false, '9:16': false });
  const [errors, setErrors] = useState<Record<Ratio, string>>({ '16:9': '', '9:16': '' });

  async function generateImage(ratio: Ratio) {
    setLoading(prev => ({ ...prev, [ratio]: true }));
    setErrors(prev => ({ ...prev, [ratio]: '' }));
    try {
      const res = await fetch('/api/tools/thumbnail-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, niche, mainText: s.mainText, subText: s.subText, style: s.style, colorScheme: s.colorScheme, aspectRatio: ratio }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setImages(prev => ({ ...prev, [ratio]: `data:image/png;base64,${data.image}` }));
    } catch {
      setErrors(prev => ({ ...prev, [ratio]: 'Failed — try again.' }));
    } finally {
      setLoading(prev => ({ ...prev, [ratio]: false }));
    }
  }

  function download(ratio: Ratio) {
    const src = images[ratio];
    if (!src) return;
    const filename = `thumbnail-${ratio.replace(':', 'x')}-${s.style.toLowerCase().replace(/\//g, '-')}.png`;
    downloadResized(src, ratio, filename);
  }

  const bg = colorBg[s.colorScheme] || 'linear-gradient(135deg,#1a1a2e,#0f3460)';
  const textColor = colorText[s.colorScheme] || '#fff';
  const hasAnyImage = images['16:9'] || images['9:16'];

  return (
    <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', overflow: 'hidden' }}>
      {/* CSS concept preview */}
      <div style={{ background: bg, padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '6px', minHeight: '100px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '10px', left: '12px', fontSize: '18px' }}>{styleIcons[s.style] || '🎯'}</div>
        <div style={{ fontSize: 'clamp(18px, 2.5vw, 28px)', fontWeight: 800, color: textColor, textAlign: 'center', lineHeight: 1.2, letterSpacing: '-0.5px', textTransform: 'uppercase', textShadow: textColor === '#fff' ? '0 2px 8px rgba(0,0,0,0.8)' : 'none', padding: '0 40px' }}>
          {s.mainText}
        </div>
        {s.subText && (
          <div style={{ fontSize: 'clamp(11px, 1.5vw, 14px)', fontWeight: 600, color: textColor === '#fff' ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.65)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {s.subText}
          </div>
        )}
        <div style={{ position: 'absolute', bottom: '7px', right: '10px', fontSize: '10px', color: textColor === '#fff' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', fontWeight: 500 }}>{s.colorScheme}</div>
      </div>

      {/* Generate buttons row */}
      <div style={{ padding: '12px 16px', display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {(['16:9', '9:16'] as Ratio[]).map(ratio => (
          <button
            key={ratio}
            onClick={() => generateImage(ratio)}
            disabled={loading[ratio]}
            style={{
              flex: 1, padding: '8px 0', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: '1px solid rgba(255,255,255,0.12)',
              background: images[ratio] ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.05)',
              color: images[ratio] ? '#22c55e' : loading[ratio] ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)',
              cursor: loading[ratio] ? 'not-allowed' : 'pointer',
            }}
          >
            {loading[ratio] ? '…' : images[ratio]
              ? `✓ ${RATIO_META[ratio].platform} — Regenerate`
              : `✦ ${ratio} — ${RATIO_META[ratio].platform}`}
          </button>
        ))}
      </div>

      {/* Generated images */}
      {(loading['16:9'] || loading['9:16'] || hasAnyImage || errors['16:9'] || errors['9:16']) && (
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: images['9:16'] || loading['9:16'] ? '1fr auto' : '1fr', gap: '16px', alignItems: 'start' }}>
            {/* 16:9 */}
            <div>
              {loading['16:9'] && <Spinner />}
              {errors['16:9'] && <div style={{ fontSize: '12px', color: '#ef4444', padding: '8px 0' }}>{errors['16:9']}</div>}
              {images['16:9'] && (
                <GeneratedImage src={images['16:9']!} ratio="16:9" onDownload={() => download('16:9')} />
              )}
            </div>
            {/* 9:16 */}
            {(loading['9:16'] || images['9:16'] || errors['9:16']) && (
              <div style={{ width: '120px' }}>
                {loading['9:16'] && <Spinner />}
                {errors['9:16'] && <div style={{ fontSize: '12px', color: '#ef4444', padding: '8px 0' }}>{errors['9:16']}</div>}
                {images['9:16'] && (
                  <GeneratedImage src={images['9:16']!} ratio="9:16" onDownload={() => download('9:16')} />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom info row */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '2px' }}>{s.style}</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>{s.why}</div>
        </div>
        <button
          onClick={() => onCopy(s, i)}
          style={{ flexShrink: 0, padding: '5px 12px', borderRadius: '6px', fontSize: '13px', background: copiedIdx === i ? '#22c55e20' : 'rgba(255,255,255,0.07)', color: copiedIdx === i ? '#22c55e' : 'rgba(255,255,255,0.4)', border: `1px solid ${copiedIdx === i ? '#22c55e40' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer' }}
        >
          {copiedIdx === i ? '✓' : 'Copy Text'}
        </button>
      </div>
    </div>
  );
}

export default function ThumbnailGenerator() {
  const [title, setTitle] = useState('');
  const [niche, setNiche] = useState('');
  const [suggestions, setSuggestions] = useState<ThumbnailSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  async function generate() {
    if (!title.trim()) return;
    setError('');
    setSuggestions([]);
    setLoading(true);
    try {
      const res = await fetch('/api/tools/thumbnail-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, niche }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSuggestions(data.suggestions || []);
    } catch {
      setError('Failed to generate thumbnail concepts. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function copy(s: ThumbnailSuggestion, i: number) {
    const text = s.subText ? `MAIN: ${s.mainText}\nSUB: ${s.subText}` : `MAIN: ${s.mainText}`;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedIdx(i);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '40px 24px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Thumbnail Generator</h1>
      <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.45)', marginBottom: '28px' }}>
        AI thumbnail concepts — generate 16:9 for YouTube or 9:16 for Shorts, then download
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        <input
          value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Your video title *"
          style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '17px', fontFamily: 'inherit', outline: 'none' }}
        />
        <input
          value={niche} onChange={e => setNiche(e.target.value)}
          placeholder="Channel niche (optional — e.g. finance, fitness, gaming)"
          style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '17px', fontFamily: 'inherit', outline: 'none' }}
        />
        <button
          onClick={generate}
          disabled={!title.trim() || loading}
          style={{ padding: '12px', borderRadius: '10px', fontWeight: 600, fontSize: '17px', border: 'none', background: title.trim() && !loading ? '#fff' : '#1a1a1a', color: title.trim() && !loading ? '#000' : 'rgba(255,255,255,0.3)', cursor: title.trim() && !loading ? 'pointer' : 'not-allowed' }}
        >
          {loading ? 'Generating concepts…' : '✦ Generate Thumbnail Concepts'}
        </button>
      </div>

      {error && <div style={{ background: '#ff4d4d15', border: '1px solid #ff4d4d30', borderRadius: '8px', padding: '12px 16px', color: '#ff4d4d', fontSize: '15px', marginBottom: '16px' }}>{error}</div>}

      {suggestions.length > 0 && (
        <>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginBottom: '14px' }}>
            Click <strong style={{ color: 'rgba(255,255,255,0.5)' }}>✦ Generate 16:9</strong> for a YouTube thumbnail or <strong style={{ color: 'rgba(255,255,255,0.5)' }}>✦ Generate 9:16</strong> for a Shorts cover — or generate both.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {suggestions.map((s, i) => (
              <ThumbnailCard key={i} s={s} i={i} title={title} niche={niche} copiedIdx={copiedIdx} onCopy={copy} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
