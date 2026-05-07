import { useState } from 'react';
import SaveButton from './SaveButton';

const HOOK_STYLES = [
  { id: 'bold_claim', label: 'Bold Claim', example: '"Most creators will never tell you this..."' },
  { id: 'shocking_stat', label: 'Shocking Stat', example: '"95% of YouTube channels fail in year one."' },
  { id: 'question', label: 'Question', example: '"What would you do with an extra $10,000/month?"' },
  { id: 'story', label: 'Personal Story', example: '"I was completely broke 18 months ago..."' },
  { id: 'controversy', label: 'Controversy', example: '"Everything you\'ve been told is wrong."' },
  { id: 'pattern_interrupt', label: 'Pattern Interrupt', example: '"Stop. Don\'t press play on another video until you hear this."' },
];

export default function HookGenerator() {
  const [topic, setTopic] = useState('');
  const [hooks, setHooks] = useState<{ style: string; hook: string; why: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  async function generate() {
    if (!topic.trim()) return;
    setError('');
    setHooks([]);
    setLoading(true);
    try {
      const res = await fetch('/api/tools/hooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setHooks(data.hooks || []);
    } catch {
      setError('Failed to generate hooks. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string, i: number) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedIdx(i);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  const styleColors: Record<string, string> = {
    'Bold Claim': '#f59e0b',
    'Shocking Stat': '#ef4444',
    'Question': '#3b82f6',
    'Personal Story': '#22c55e',
    'Controversy': '#ec4899',
    'Pattern Interrupt': '#a855f7',
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Viral Hook Generator</h1>
      <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.45)', marginBottom: '28px' }}>Get 6 different hook styles for your video — find the one that grabs hardest</p>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <input
          value={topic}
          onChange={e => setTopic(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && generate()}
          placeholder="Video topic (e.g. how to save money in your 20s)"
          style={{ flex: 1, background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '24px', fontFamily: 'inherit', outline: 'none' }}
        />
        <button onClick={generate} disabled={!topic.trim() || loading} style={{
          padding: '12px 22px', borderRadius: '10px', background: topic.trim() && !loading ? '#fff' : '#1a1a1a',
          color: topic.trim() && !loading ? '#000' : 'rgba(255,255,255,0.3)',
          fontWeight: 600, fontSize: '24px', cursor: topic.trim() && !loading ? 'pointer' : 'not-allowed', border: 'none', whiteSpace: 'nowrap',
        }}>
          {loading ? 'Generating...' : '✦ Generate Hooks'}
        </button>
      </div>

      {/* Style reference */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '28px' }}>
        {HOOK_STYLES.map(s => (
          <div key={s.id} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px 14px' }}>
            <div style={{ fontSize: '17px', fontWeight: 700, color: styleColors[s.label] || '#fff', marginBottom: '4px', letterSpacing: '0.04em' }}>{s.label.toUpperCase()}</div>
            <div style={{ fontSize: '17px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, fontStyle: 'italic' }}>{s.example}</div>
          </div>
        ))}
      </div>

      {error && <div style={{ background: '#ff4d4d15', border: '1px solid #ff4d4d30', borderRadius: '8px', padding: '12px 16px', color: '#ff4d4d', fontSize: '24px', marginBottom: '16px' }}>{error}</div>}

      {hooks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {hooks.map((h, i) => (
            <div key={i} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '17px', fontWeight: 700, color: styleColors[h.style] || '#fff', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h.style}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <SaveButton type="hook" label={h.style + ' Hook'} content={h.hook} meta={`Topic: ${topic}`} />
                  <button onClick={() => copy(h.hook, i)} style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '17px', background: copiedIdx === i ? '#22c55e20' : 'rgba(255,255,255,0.07)', color: copiedIdx === i ? '#22c55e' : 'rgba(255,255,255,0.4)', border: `1px solid ${copiedIdx === i ? '#22c55e40' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer' }}>
                    {copiedIdx === i ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              <p style={{ fontSize: '24px', color: '#fff', lineHeight: 1.6, marginBottom: '8px', fontWeight: 500 }}>"{h.hook}"</p>
              <p style={{ fontSize: '24px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>💡 {h.why}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
