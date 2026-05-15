import { useState } from 'react';
import SaveButton from './SaveButton';

type ScoredTitle = {
  title: string;
  score: number;
  warnings: string[];
  breakdown?: Record<string, number>;
};

type Bundle = {
  titles: ScoredTitle[];
  description: string;
  tags: string[];
  hashtags: string[];
  dataSource: string | null;
};

function scoreColor(score: number): string {
  if (score >= 75) return '#22c55e';
  if (score >= 55) return '#eab308';
  if (score >= 35) return '#f97316';
  return '#ef4444';
}

function ScoreBadge({ score }: { score: number }) {
  const color = scoreColor(score);
  return (
    <span
      title="0-100 CTR score"
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        minWidth: 44, height: 28, padding: '0 8px', borderRadius: 6,
        background: `${color}1f`, border: `1px solid ${color}55`, color,
        fontSize: 13, fontWeight: 700, flexShrink: 0,
      }}
    >
      {score}
    </span>
  );
}

export default function SeoBundle() {
  const [topic, setTopic] = useState('');
  const [niche, setNiche] = useState('');
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  async function generate() {
    if (!topic.trim()) return;
    setError('');
    setBundle(null);
    setLoading(true);
    try {
      const res = await fetch('/api/tools/seo-bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, channelNiche: niche }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setBundle(data);
    } catch {
      setError('Failed to generate bundle. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function copy(t: string) {
    navigator.clipboard.writeText(t).catch(() => {});
  }

  function copyTitle(t: string, i: number) {
    navigator.clipboard.writeText(t).catch(() => {});
    setCopiedIdx(i);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  const sectionTitle: React.CSSProperties = {
    fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12,
  };
  const card: React.CSSProperties = {
    background: '#111', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10, padding: 16, marginBottom: 24,
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px' }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 4 }}>SEO Bundle</h2>
      <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.45)', marginBottom: 24 }}>
        One call returns scored titles, description, tags, and hashtags — all anchored to the same topic.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        <input
          value={topic}
          onChange={e => setTopic(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && generate()}
          placeholder="Video topic or keyword..."
          style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', color: '#fff', fontSize: 18, outline: 'none' }}
        />
        <input
          value={niche}
          onChange={e => setNiche(e.target.value)}
          placeholder="Channel niche (optional)"
          style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', color: '#fff', fontSize: 18, outline: 'none' }}
        />
        <button
          onClick={generate}
          disabled={!topic.trim() || loading}
          style={{ padding: 12, borderRadius: 10, background: '#fff', color: '#000', fontWeight: 600, fontSize: 17, cursor: topic.trim() && !loading ? 'pointer' : 'not-allowed', opacity: (!topic.trim() || loading) ? 0.5 : 1, border: 'none' }}
        >
          {loading ? 'Generating bundle...' : '✦ Generate SEO Bundle'}
        </button>
      </div>

      {error && (
        <div style={{ background: '#ff4d4d15', border: '1px solid #ff4d4d30', borderRadius: 8, padding: '12px 16px', color: '#ff4d4d', fontSize: 15, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {bundle?.dataSource && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16, padding: '7px 12px', borderRadius: 8, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <span style={{ fontSize: 13 }}>📊</span>
          <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 500 }}>{bundle.dataSource}</span>
        </div>
      )}

      {bundle && (
        <>
          <div style={{ ...card, padding: 0, background: 'transparent', border: 'none' }}>
            <div style={sectionTitle}>Titles (ranked + scored)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {bundle.titles.map((s, i) => (
                <div key={i} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <ScoreBadge score={s.score} />
                      <span style={{ fontSize: '24px', color: '#fff', lineHeight: 1.4 }}>{s.title}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <SaveButton type="title" label={s.title} content={s.title} meta={topic ? `Topic: ${topic}` : undefined} />
                      <button onClick={() => copyTitle(s.title, i)} style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '24px', background: copiedIdx === i ? '#22c55e20' : 'rgba(255,255,255,0.08)', color: copiedIdx === i ? '#22c55e' : 'rgba(255,255,255,0.5)', border: `1px solid ${copiedIdx === i ? '#22c55e40' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer' }}>
                        {copiedIdx === i ? '✓' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  {s.warnings && s.warnings.length > 0 && (
                    <ul style={{ margin: 0, paddingLeft: 18, color: 'rgba(255,255,255,0.45)', fontSize: 12, lineHeight: 1.5 }}>
                      {s.warnings.map((w, wi) => <li key={wi}>{w}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={sectionTitle}>Description</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <SaveButton type="description" label="SEO bundle description" content={bundle.description} meta={topic ? `Topic: ${topic}` : undefined} />
                <button onClick={() => copy(bundle.description)} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 13, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                  Copy
                </button>
              </div>
            </div>
            <pre style={{ whiteSpace: 'pre-wrap', color: '#e5e5e5', fontSize: 15, lineHeight: 1.55, fontFamily: 'inherit', margin: 0 }}>
              {bundle.description}
            </pre>
          </div>

          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={sectionTitle}>Tags ({bundle.tags.length})</div>
              <button onClick={() => copy(bundle.tags.join(', '))} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 13, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                Copy all
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {bundle.tags.map((t, i) => (
                <span key={i} style={{ padding: '5px 10px', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 6, color: '#60a5fa', fontSize: 13 }}>
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={sectionTitle}>Hashtags</div>
              <button onClick={() => copy(bundle.hashtags.join(' '))} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 13, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                Copy all
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {bundle.hashtags.map((h, i) => (
                <span key={i} style={{ padding: '5px 10px', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 6, color: '#a78bfa', fontSize: 13 }}>
                  {h}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
