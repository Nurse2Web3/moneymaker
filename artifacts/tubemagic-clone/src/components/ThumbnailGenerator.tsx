import { useState } from 'react';

interface ThumbnailSuggestion {
  mainText: string;
  subText: string;
  style: string;
  colorScheme: string;
  why: string;
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

  const styleIcons: Record<string, string> = {
    'Number/List': '🔢',
    'Shock/Curiosity': '😱',
    'Personal Result': '💰',
    'Versus/Comparison': '⚔️',
    'Question': '❓',
    'Bold Statement': '🔥',
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Thumbnail Text Generator</h1>
      <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.45)', marginBottom: '28px' }}>Get high-CTR text overlay ideas for your thumbnail — the text that makes people stop scrolling</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Your video title *"
          style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '24px', fontFamily: 'inherit', outline: 'none' }} />
        <input value={niche} onChange={e => setNiche(e.target.value)} placeholder="Channel niche (optional — e.g. finance, fitness, gaming)"
          style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '24px', fontFamily: 'inherit', outline: 'none' }} />
        <button onClick={generate} disabled={!title.trim() || loading} style={{
          padding: '12px', borderRadius: '10px', fontWeight: 600, fontSize: '17px', border: 'none',
          background: title.trim() && !loading ? '#fff' : '#1a1a1a',
          color: title.trim() && !loading ? '#000' : 'rgba(255,255,255,0.3)',
          cursor: title.trim() && !loading ? 'pointer' : 'not-allowed',
        }}>
          {loading ? 'Generating...' : '✦ Generate Thumbnail Text'}
        </button>
      </div>

      {error && <div style={{ background: '#ff4d4d15', border: '1px solid #ff4d4d30', borderRadius: '8px', padding: '12px 16px', color: '#ff4d4d', fontSize: '24px', marginBottom: '16px' }}>{error}</div>}

      {suggestions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {suggestions.map((s, i) => (
            <div key={i} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', overflow: 'hidden' }}>
              {/* Thumbnail preview */}
              <div style={{
                background: `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`,
                padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '6px', minHeight: '110px', position: 'relative',
              }}>
                <div style={{ position: 'absolute', top: '10px', left: '12px', fontSize: '24px' }}>{styleIcons[s.style] || '🎯'}</div>
                <div style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.2, letterSpacing: '-0.5px', textTransform: 'uppercase', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                  {s.mainText}
                </div>
                {s.subText && (
                  <div style={{ fontSize: 'clamp(13px, 1.8vw, 17px)', fontWeight: 600, color: 'rgba(255,255,255,0.75)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {s.subText}
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: '8px', right: '12px', fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>{s.colorScheme}</div>
              </div>

              <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '17px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{s.style}</div>
                  <div style={{ fontSize: '24px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{s.why}</div>
                </div>
                <button onClick={() => copy(s, i)} style={{ flexShrink: 0, padding: '6px 14px', borderRadius: '6px', fontSize: '24px', background: copiedIdx === i ? '#22c55e20' : 'rgba(255,255,255,0.08)', color: copiedIdx === i ? '#22c55e' : 'rgba(255,255,255,0.5)', border: `1px solid ${copiedIdx === i ? '#22c55e40' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer' }}>
                  {copiedIdx === i ? '✓' : 'Copy'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
