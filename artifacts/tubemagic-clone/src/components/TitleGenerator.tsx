import { useState } from 'react';
import SaveButton from './SaveButton';

export default function TitleGenerator() {
  const [topic, setTopic] = useState('');
  const [niche, setNiche] = useState('');
  const [titles, setTitles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [dataSource, setDataSource] = useState<string | null>(null);

  async function generate() {
    if (!topic.trim()) return;
    setError('');
    setTitles([]);
    setDataSource(null);
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
      setDataSource(data.dataSource || null);
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
      <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Title Generator</h2>
      <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.45)', marginBottom: '24px' }}>Get 5 viral YouTube titles instantly</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
        <input
          value={topic}
          onChange={e => setTopic(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && generate()}
          placeholder="Video topic or keyword..."
          style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '24px', fontFamily: 'inherit', outline: 'none' }}
        />
        <input
          value={niche}
          onChange={e => setNiche(e.target.value)}
          placeholder="Channel niche (optional, e.g. finance, fitness, tech)"
          style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '24px', fontFamily: 'inherit', outline: 'none' }}
        />
        <button
          onClick={generate}
          disabled={!topic.trim() || loading}
          style={{ padding: '12px', borderRadius: '10px', background: '#fff', color: '#000', fontWeight: 600, fontSize: '17px', cursor: topic.trim() && !loading ? 'pointer' : 'not-allowed', opacity: (!topic.trim() || loading) ? 0.5 : 1, border: 'none' }}
        >
          {loading ? 'Generating...' : '✦ Generate Titles'}
        </button>
      </div>

      {error && <div style={{ background: '#ff4d4d15', border: '1px solid #ff4d4d30', borderRadius: '8px', padding: '12px 16px', color: '#ff4d4d', fontSize: '24px', marginBottom: '16px' }}>{error}</div>}

      {dataSource && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', padding: '7px 12px', borderRadius: '8px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', width: 'fit-content' }}>
          <span style={{ fontSize: '13px' }}>📊</span>
          <span style={{ fontSize: '13px', color: '#22c55e', fontWeight: 500 }}>{dataSource} — titles grounded in real performance data</span>
        </div>
      )}

      {titles.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {titles.map((t, i) => (
            <div key={i} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ fontSize: '24px', color: '#fff', lineHeight: 1.4 }}>{t}</span>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <SaveButton type="title" label={t} content={t} meta={topic ? `Topic: ${topic}` : undefined} />
                <button onClick={() => copy(t, i)} style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '24px', background: copiedIdx === i ? '#22c55e20' : 'rgba(255,255,255,0.08)', color: copiedIdx === i ? '#22c55e' : 'rgba(255,255,255,0.5)', border: `1px solid ${copiedIdx === i ? '#22c55e40' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer' }}>
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
