import { useState } from 'react';

const VIEW_COLORS: Record<string, string> = {
  Low: '#6b7280',
  Medium: '#3b82f6',
  High: '#f59e0b',
  Viral: '#ec4899',
};

export default function IdeaGenerator() {
  const [niche, setNiche] = useState('');
  const [ideas, setIdeas] = useState<{ title: string; description: string; estimatedViews: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function generate() {
    if (!niche.trim()) return;
    setError('');
    setIdeas([]);
    setLoading(true);
    try {
      const res = await fetch('/api/tools/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelNiche: niche, count: 8 }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setIdeas(data.ideas || []);
    } catch {
      setError('Failed to generate ideas. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Video Idea Generator</h2>
      <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.45)', marginBottom: '24px' }}>Get 8 high-potential ideas for your niche</p>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          value={niche}
          onChange={e => setNiche(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && generate()}
          placeholder="Your channel niche (e.g. personal finance, gaming, fitness)"
          style={{ flex: 1, background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '24px', fontFamily: 'inherit', outline: 'none' }}
        />
        <button
          onClick={generate}
          disabled={!niche.trim() || loading}
          style={{ padding: '12px 20px', borderRadius: '10px', background: '#fff', color: '#000', fontWeight: 600, fontSize: '24px', cursor: niche.trim() && !loading ? 'pointer' : 'not-allowed', opacity: (!niche.trim() || loading) ? 0.5 : 1, border: 'none', whiteSpace: 'nowrap' }}
        >
          {loading ? 'Generating...' : '✦ Get Ideas'}
        </button>
      </div>

      {error && <div style={{ background: '#ff4d4d15', border: '1px solid #ff4d4d30', borderRadius: '8px', padding: '12px 16px', color: '#ff4d4d', fontSize: '24px', marginBottom: '16px' }}>{error}</div>}

      {ideas.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {ideas.map((idea, i) => (
            <div key={i} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '24px', fontWeight: 600, color: '#fff', lineHeight: 1.4, flex: 1 }}>{idea.title}</h3>
                <span style={{ flexShrink: 0, fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '20px', background: (VIEW_COLORS[idea.estimatedViews] || '#6b7280') + '20', color: VIEW_COLORS[idea.estimatedViews] || '#6b7280', border: `1px solid ${(VIEW_COLORS[idea.estimatedViews] || '#6b7280')}40`, letterSpacing: '0.05em' }}>
                  {idea.estimatedViews}
                </span>
              </div>
              <p style={{ fontSize: '24px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{idea.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
