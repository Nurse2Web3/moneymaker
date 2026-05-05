import { useState } from 'react';

export default function TitleGenerator() {
  const [topic, setTopic] = useState('');
  const [niche, setNiche] = useState('');
  const [titles, setTitles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  async function generate() {
    if (!topic.trim()) return;
    setError('');
    setTitles([]);
    setLoading(true);
    try {
      const res = await fetch('/api/tools/titles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, channelNiche: niche }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTitles(data.titles || []);
    } catch {
      setError('Failed to generate titles. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function copy(t: string, i: number) {
    navigator.clipboard.writeText(t).catch(() => {});
    setCopiedIdx(i);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 24px' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Title Generator</h2>
      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '24px' }}>Get 5 viral YouTube titles instantly</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
        <input
          value={topic}
          onChange={e => setTopic(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && generate()}
          placeholder="Video topic or keyword..."
          style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}
        />
        <input
          value={niche}
          onChange={e => setNiche(e.target.value)}
          placeholder="Channel niche (optional, e.g. finance, fitness, tech)"
          style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}
        />
        <button
          onClick={generate}
          disabled={!topic.trim() || loading}
          style={{ padding: '12px', borderRadius: '10px', background: '#fff', color: '#000', fontWeight: 600, fontSize: '15px', cursor: topic.trim() && !loading ? 'pointer' : 'not-allowed', opacity: (!topic.trim() || loading) ? 0.5 : 1, border: 'none' }}
        >
          {loading ? 'Generating...' : '✦ Generate Titles'}
        </button>
      </div>

      {error && <div style={{ background: '#ff4d4d15', border: '1px solid #ff4d4d30', borderRadius: '8px', padding: '12px 16px', color: '#ff4d4d', fontSize: '14px', marginBottom: '16px' }}>{error}</div>}

      {titles.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {titles.map((t, i) => (
            <div key={i} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ fontSize: '14px', color: '#fff', lineHeight: 1.4 }}>{t}</span>
              <button onClick={() => copy(t, i)} style={{ flexShrink: 0, padding: '5px 12px', borderRadius: '6px', fontSize: '12px', background: copiedIdx === i ? '#22c55e20' : 'rgba(255,255,255,0.08)', color: copiedIdx === i ? '#22c55e' : 'rgba(255,255,255,0.5)', border: `1px solid ${copiedIdx === i ? '#22c55e40' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer' }}>
                {copiedIdx === i ? '✓' : 'Copy'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
