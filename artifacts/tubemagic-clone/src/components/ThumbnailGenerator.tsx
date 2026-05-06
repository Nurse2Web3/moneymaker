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

function ThumbnailCard({
  s, i, title, niche, copiedIdx, onCopy,
}: {
  s: ThumbnailSuggestion; i: number; title: string; niche: string;
  copiedIdx: number | null; onCopy: (s: ThumbnailSuggestion, i: number) => void;
}) {
  const [imgLoading, setImgLoading] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [imgError, setImgError] = useState('');

  async function generateImage() {
    setImgLoading(true);
    setImgError('');
    setImgSrc(null);
    try {
      const res = await fetch('/api/tools/thumbnail-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, niche, mainText: s.mainText, subText: s.subText, style: s.style, colorScheme: s.colorScheme }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setImgSrc(`data:image/png;base64,${data.image}`);
    } catch {
      setImgError('Image generation failed — try again.');
    } finally {
      setImgLoading(false);
    }
  }

  function download() {
    if (!imgSrc) return;
    const a = document.createElement('a');
    a.href = imgSrc;
    a.download = `thumbnail-${s.style.toLowerCase().replace(/\//g, '-')}.png`;
    a.click();
  }

  const bg = colorBg[s.colorScheme] || 'linear-gradient(135deg,#1a1a2e,#0f3460)';
  const textColor = colorText[s.colorScheme] || '#fff';

  return (
    <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', overflow: 'hidden' }}>
      {/* Preview area — shows generated image or CSS mockup */}
      <div style={{ position: 'relative', aspectRatio: '16/9', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}>
        {imgSrc ? (
          <img src={imgSrc} alt="Generated thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <>
            <div style={{ position: 'absolute', top: '10px', left: '12px', fontSize: '20px' }}>{styleIcons[s.style] || '🎯'}</div>
            <div style={{ fontSize: 'clamp(20px, 3vw, 30px)', fontWeight: 800, color: textColor, textAlign: 'center', lineHeight: 1.2, letterSpacing: '-0.5px', textTransform: 'uppercase', textShadow: textColor === '#fff' ? '0 2px 8px rgba(0,0,0,0.8)' : 'none', padding: '0 20px' }}>
              {s.mainText}
            </div>
            {s.subText && (
              <div style={{ fontSize: 'clamp(11px, 1.6vw, 15px)', fontWeight: 600, color: textColor === '#fff' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 20px' }}>
                {s.subText}
              </div>
            )}
            <div style={{ position: 'absolute', bottom: '8px', right: '12px', fontSize: '10px', color: textColor === '#fff' ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', fontWeight: 500 }}>{s.colorScheme}</div>
          </>
        )}

        {/* Generate Image overlay button */}
        {!imgSrc && !imgLoading && (
          <button
            onClick={generateImage}
            style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: 'rgba(0,0,0,0.7)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer', backdropFilter: 'blur(4px)', whiteSpace: 'nowrap' }}
          >
            ✦ Generate Image
          </button>
        )}

        {imgLoading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', border: '3px solid rgba(255,255,255,0.15)', borderTop: '3px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>Generating thumbnail…</span>
          </div>
        )}
      </div>

      {imgError && (
        <div style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '13px' }}>{imgError}</div>
      )}

      {/* Bottom bar */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>{s.style}</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>{s.why}</div>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          {imgSrc && (
            <button onClick={download} style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '13px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', cursor: 'pointer' }}>
              ↓ Download
            </button>
          )}
          <button onClick={() => onCopy(s, i)} style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '13px', background: copiedIdx === i ? '#22c55e20' : 'rgba(255,255,255,0.07)', color: copiedIdx === i ? '#22c55e' : 'rgba(255,255,255,0.45)', border: `1px solid ${copiedIdx === i ? '#22c55e40' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer' }}>
            {copiedIdx === i ? '✓ Copied' : 'Copy Text'}
          </button>
        </div>
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
      setError('Failed to generate thumbnail suggestions. Please try again.');
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
      <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.45)', marginBottom: '28px' }}>AI-designed thumbnail concepts — preview, generate the full image, and download</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Your video title *"
          style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '17px', fontFamily: 'inherit', outline: 'none' }} />
        <input value={niche} onChange={e => setNiche(e.target.value)} placeholder="Channel niche (optional — e.g. finance, fitness, gaming)"
          style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '17px', fontFamily: 'inherit', outline: 'none' }} />
        <button onClick={generate} disabled={!title.trim() || loading} style={{
          padding: '12px', borderRadius: '10px', fontWeight: 600, fontSize: '17px', border: 'none',
          background: title.trim() && !loading ? '#fff' : '#1a1a1a',
          color: title.trim() && !loading ? '#000' : 'rgba(255,255,255,0.3)',
          cursor: title.trim() && !loading ? 'pointer' : 'not-allowed',
        }}>
          {loading ? 'Generating concepts…' : '✦ Generate Thumbnail Concepts'}
        </button>
      </div>

      {error && <div style={{ background: '#ff4d4d15', border: '1px solid #ff4d4d30', borderRadius: '8px', padding: '12px 16px', color: '#ff4d4d', fontSize: '15px', marginBottom: '16px' }}>{error}</div>}

      {suggestions.length > 0 && (
        <>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginBottom: '14px' }}>
            Hover each concept and click <strong style={{ color: 'rgba(255,255,255,0.5)' }}>✦ Generate Image</strong> to create a full AI-rendered thumbnail you can download.
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
