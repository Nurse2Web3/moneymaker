import { useState } from 'react';

interface NicheAnalysis {
  summary: string;
  opportunities: { title: string; description: string; potential: string }[];
  contentGaps: { gap: string; why: string }[];
  topFormats: { format: string; description: string; examples: string }[];
  avoidMistakes: string[];
  quickWins: string[];
}

export default function NicheAnalyzer() {
  const [niche, setNiche] = useState('');
  const [channelDesc, setChannelDesc] = useState('');
  const [analysis, setAnalysis] = useState<NicheAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function analyze() {
    if (!niche.trim()) return;
    setError('');
    setAnalysis(null);
    setLoading(true);
    try {
      const res = await fetch('/api/tools/niche-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, channelDescription: channelDesc }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data.analysis);
    } catch {
      setError('Failed to analyze niche. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const potentialColors: Record<string, string> = { High: '#f59e0b', Viral: '#ec4899', Medium: '#3b82f6', Low: '#6b7280' };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Channel Niche Analyzer</h1>
      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '28px' }}>Get a full content strategy breakdown — opportunities, gaps, formats, and quick wins</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        <input value={niche} onChange={e => setNiche(e.target.value)} placeholder="Your niche * (e.g. personal finance for millennials, gaming tutorials, fitness for beginners)"
          style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }} />
        <textarea value={channelDesc} onChange={e => setChannelDesc(e.target.value)} placeholder="Optional: describe your channel, audience, or current content style..."
          rows={3} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '14px', fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 1.5 }} />
        <button onClick={analyze} disabled={!niche.trim() || loading} style={{
          padding: '13px', borderRadius: '10px', fontWeight: 600, fontSize: '15px', border: 'none',
          background: niche.trim() && !loading ? '#fff' : '#1a1a1a',
          color: niche.trim() && !loading ? '#000' : 'rgba(255,255,255,0.3)',
          cursor: niche.trim() && !loading ? 'pointer' : 'not-allowed',
        }}>
          {loading ? 'Analyzing your niche...' : '✦ Analyze Niche'}
        </button>
      </div>

      {error && <div style={{ background: '#ff4d4d15', border: '1px solid #ff4d4d30', borderRadius: '8px', padding: '12px 16px', color: '#ff4d4d', fontSize: '14px', marginBottom: '16px' }}>{error}</div>}

      {analysis && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Summary */}
          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '20px 24px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Niche Overview</div>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>{analysis.summary}</p>
          </div>

          {/* Opportunities */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#f59e0b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>🚀 Content Opportunities</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
              {analysis.opportunities.map((o, i) => (
                <div key={i} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{o.title}</div>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: (potentialColors[o.potential] || '#6b7280') + '20', color: potentialColors[o.potential] || '#6b7280', border: `1px solid ${(potentialColors[o.potential] || '#6b7280')}40` }}>{o.potential}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{o.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Content Gaps */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#3b82f6', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>🔍 Untapped Content Gaps</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {analysis.contentGaps.map((g, i) => (
                <div key={i} style={{ background: '#111', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '10px', padding: '14px 16px', display: 'flex', gap: '12px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#3b82f620', border: '1px solid #3b82f640', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#3b82f6' }}>{i + 1}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>{g.gap}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{g.why}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Formats */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#22c55e', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>🎬 Best Performing Formats</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
              {analysis.topFormats.map((f, i) => (
                <div key={i} style={{ background: '#111', border: '1px solid rgba(34,197,94,0.1)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>{f.format}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: '8px' }}>{f.description}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(34,197,94,0.7)', fontStyle: 'italic' }}>e.g. {f.examples}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Wins + Mistakes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#22c55e', marginBottom: '14px' }}>⚡ Quick Wins</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {analysis.quickWins.map((w, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span style={{ color: '#22c55e', flexShrink: 0, marginTop: '1px' }}>✓</span>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{w}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#ef4444', marginBottom: '14px' }}>⚠️ Common Mistakes to Avoid</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {analysis.avoidMistakes.map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span style={{ color: '#ef4444', flexShrink: 0, marginTop: '1px' }}>✗</span>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{m}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
