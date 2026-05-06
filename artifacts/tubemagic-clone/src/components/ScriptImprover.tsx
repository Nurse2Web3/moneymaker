import { useState } from 'react';

const IMPROVEMENTS = [
  { id: 'hooks', label: 'Stronger Hooks' },
  { id: 'open_loops', label: 'Open Loops' },
  { id: 'pacing', label: 'Pacing & Flow' },
  { id: 'pattern_interrupts', label: 'Pattern Interrupts' },
  { id: 'cta', label: 'Sharper CTA' },
  { id: 'retention', label: 'Retention Spikes' },
];

export default function ScriptImprover() {
  const [script, setScript] = useState('');
  const [focus, setFocus] = useState<string[]>(['hooks', 'open_loops', 'pacing']);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  function toggleFocus(id: string) {
    setFocus(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  }

  async function improve() {
    if (!script.trim()) return;
    setError('');
    setResult('');
    setWordCount(0);
    setLoading(true);
    try {
      const res = await fetch('/api/tools/improve-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, focusAreas: focus }),
      });
      if (!res.ok || !res.body) throw new Error('Server error');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.error) { setError(data.error); break; }
            if (data.done) break;
            if (data.content) {
              full += data.content;
              setResult(full);
              setWordCount(full.split(/\s+/).filter(Boolean).length);
            }
          } catch {}
        }
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(result).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', paddingTop: '70px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>

        {/* LEFT — Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Script Improver</h1>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>Paste your existing script — AI rewrites it with Tension Engine techniques</p>
          </div>

          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>Your Script *</label>
            <textarea
              value={script}
              onChange={e => setScript(e.target.value)}
              placeholder="Paste your existing YouTube script here..."
              rows={16}
              style={{ width: '100%', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: '#fff', fontSize: '13px', lineHeight: 1.7, resize: 'vertical', fontFamily: 'inherit', outline: 'none' }}
            />
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '6px' }}>
              {script.split(/\s+/).filter(Boolean).length} words
            </div>
          </div>

          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>Focus Areas</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {IMPROVEMENTS.map(f => (
                <button key={f.id} onClick={() => toggleFocus(f.id)} style={{
                  padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                  background: focus.includes(f.id) ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: focus.includes(f.id) ? '#fff' : 'rgba(255,255,255,0.4)',
                  border: `1px solid ${focus.includes(f.id) ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'}`,
                }}>
                  {focus.includes(f.id) ? '✓ ' : ''}{f.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={improve} disabled={!script.trim() || loading} style={{
            padding: '13px', borderRadius: '10px', fontWeight: 600, fontSize: '15px', border: 'none',
            background: !script.trim() || loading ? '#1a1a1a' : '#fff',
            color: !script.trim() || loading ? 'rgba(255,255,255,0.3)' : '#000',
            cursor: !script.trim() || loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? '✦ Improving...' : '✦ Improve Script'}
          </button>
        </div>

        {/* RIGHT — Output */}
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', overflow: 'hidden', minHeight: '600px', display: 'flex', flexDirection: 'column', position: 'sticky', top: '80px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0d0d0d' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>Improved Script</span>
              {wordCount > 0 && <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', padding: '2px 8px', borderRadius: '20px' }}>{wordCount.toLocaleString()} words</span>}
              {loading && <span style={{ fontSize: '11px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', animation: 'pulse 1s infinite' }} />Rewriting...</span>}
            </div>
            {result && <button onClick={copy} style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '12px', background: copied ? '#22c55e20' : 'rgba(255,255,255,0.08)', color: copied ? '#22c55e' : 'rgba(255,255,255,0.5)', border: `1px solid ${copied ? '#22c55e40' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer' }}>{copied ? '✓ Copied' : 'Copy'}</button>}
          </div>
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
            {error && <div style={{ background: '#ff4d4d15', border: '1px solid #ff4d4d30', borderRadius: '8px', padding: '12px 16px', color: '#ff4d4d', fontSize: '14px', marginBottom: '16px' }}>{error}</div>}
            {!result && !loading && !error && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', gap: '12px', color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
                <span style={{ fontSize: '40px' }}>✨</span>
                <p style={{ fontSize: '15px', fontWeight: 500 }}>Your improved script will appear here</p>
                <p style={{ fontSize: '13px' }}>Paste your script on the left and hit improve</p>
              </div>
            )}
            {result && <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '13px', lineHeight: '1.8', color: 'rgba(255,255,255,0.85)', fontFamily: 'inherit', margin: 0 }}>{result}{loading && <span style={{ opacity: 0.5, animation: 'pulse 1s infinite' }}>▊</span>}</pre>}
          </div>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }`}</style>
    </div>
  );
}
