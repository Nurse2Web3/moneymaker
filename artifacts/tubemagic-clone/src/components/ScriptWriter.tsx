import { useState, useRef } from 'react';

const MODELS = [
  { id: 'claude-sonnet', label: 'Claude Sonnet', icon: '✦', desc: 'Fast & smart' },
  { id: 'claude-opus', label: 'Claude Opus', icon: '✦✦', desc: 'Most powerful' },
];

const LENGTHS = [
  { value: '100', label: '100 Words (~1min)' },
  { value: '800', label: '800 Words (~5min)' },
  { value: '1500', label: '1500 Words (~10min)' },
  { value: '3000', label: '3000 Words (~20min)' },
];

const TENSION_LEVELS = [
  { value: 'low', label: 'Low', color: '#4ade80', desc: 'Relaxed, informative' },
  { value: 'medium', label: 'Medium', color: '#facc15', desc: 'Balanced hooks' },
  { value: 'high', label: 'High', color: '#fb923c', desc: 'Aggressive tension' },
  { value: 'extreme', label: 'Extreme', color: '#f43f5e', desc: 'Maximum engagement' },
];

const TENSION_TECHNIQUES = [
  { id: 'open_loops', label: 'Open Loops' },
  { id: 'pattern_interrupts', label: 'Pattern Interrupts' },
  { id: 'stakes_escalation', label: 'Stakes Escalation' },
  { id: 'curiosity_gaps', label: 'Curiosity Gaps' },
  { id: 'cliffhangers', label: 'Cliffhangers' },
  { id: 'social_proof', label: 'Social Proof' },
  { id: 'foreshadowing', label: 'Foreshadowing' },
];

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

export default function ScriptWriter() {
  const [topic, setTopic] = useState('');
  const [channelStyle, setChannelStyle] = useState('');
  const [videoLength, setVideoLength] = useState('1500');
  const [model, setModel] = useState('claude-sonnet');
  const [tensionLevel, setTensionLevel] = useState('high');
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>(['open_loops', 'cliffhangers', 'curiosity_gaps']);
  const [inspirationLinks, setInspirationLinks] = useState('');
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  function toggleTechnique(id: string) {
    setSelectedTechniques(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  }

  async function generate() {
    if (!topic.trim()) return;
    setError('');
    setScript('');
    setWordCount(0);
    setLoading(true);

    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/scripts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          channelStyle,
          videoLength,
          tensionLevel,
          tensionTechniques: selectedTechniques,
          inspirationLinks,
          model,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error('Server error');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.error) { setError(data.error); break; }
            if (data.done) break;
            if (data.content) {
              full += data.content;
              setScript(full);
              setWordCount(full.split(/\s+/).filter(Boolean).length);
            }
          } catch {}
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    copyToClipboard(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const activeTension = TENSION_LEVELS.find(t => t.value === tensionLevel)!;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', paddingTop: '70px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px', display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px', alignItems: 'start' }}>

        {/* LEFT PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Script Writer</h1>
            <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.45)' }}>Powered by Claude · Tension Engine built-in</p>
          </div>

          {/* Topic */}
          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' }}>
            <label style={{ fontSize: '24px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>Video Topic *</label>
            <textarea
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. How to grow a YouTube channel from 0 to 10,000 subscribers"
              rows={3}
              style={{
                width: '100%', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                padding: '10px 12px', color: '#fff', fontSize: '24px', lineHeight: 1.5, resize: 'vertical',
                fontFamily: 'inherit', outline: 'none',
              }}
            />
          </div>

          {/* Model */}
          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' }}>
            <label style={{ fontSize: '24px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>AI Model</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {MODELS.map(m => (
                <button key={m.id} onClick={() => setModel(m.id)} style={{
                  flex: 1, padding: '10px 12px', borderRadius: '8px', fontSize: '17px', fontWeight: 500,
                  border: `1px solid ${model === m.id ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  background: model === m.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: model === m.id ? '#fff' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer', textAlign: 'left',
                }}>
                  <div>{m.icon} {m.label}</div>
                  <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '2px', fontWeight: 400 }}>{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Video Length */}
          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' }}>
            <label style={{ fontSize: '24px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>Video Length</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {LENGTHS.map(l => (
                <button key={l.value} onClick={() => setVideoLength(l.value)} style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px',
                  border: `1px solid ${videoLength === l.value ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)'}`,
                  background: videoLength === l.value ? 'rgba(255,255,255,0.07)' : 'transparent',
                  color: videoLength === l.value ? '#fff' : 'rgba(255,255,255,0.5)',
                  fontSize: '17px', cursor: 'pointer', textAlign: 'left',
                }}>
                  {videoLength === l.value && (
                    <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6L5 9L10 3" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
                  )}
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tension Engine */}
          <div style={{ background: '#111', border: `1px solid ${activeTension.color}30`, borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeTension.color, boxShadow: `0 0 8px ${activeTension.color}` }} />
              <label style={{ fontSize: '24px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Tension Engine</label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', marginBottom: '12px' }}>
              {TENSION_LEVELS.map(t => (
                <button key={t.value} onClick={() => setTensionLevel(t.value)} style={{
                  padding: '8px 10px', borderRadius: '8px', fontSize: '24px', fontWeight: 600,
                  border: `1px solid ${tensionLevel === t.value ? t.color + '60' : 'rgba(255,255,255,0.06)'}`,
                  background: tensionLevel === t.value ? t.color + '15' : 'transparent',
                  color: tensionLevel === t.value ? t.color : 'rgba(255,255,255,0.45)',
                  cursor: 'pointer',
                }}>
                  {t.label}
                  <div style={{ fontSize: '10px', fontWeight: 400, opacity: 0.75, marginTop: '2px' }}>{t.desc}</div>
                </button>
              ))}
            </div>

            <div style={{ fontSize: '17px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Techniques</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {TENSION_TECHNIQUES.map(t => (
                <button key={t.id} onClick={() => toggleTechnique(t.id)} style={{
                  padding: '5px 10px', borderRadius: '20px', fontSize: '17px', fontWeight: 500,
                  border: `1px solid ${selectedTechniques.includes(t.id) ? activeTension.color + '60' : 'rgba(255,255,255,0.08)'}`,
                  background: selectedTechniques.includes(t.id) ? activeTension.color + '15' : 'transparent',
                  color: selectedTechniques.includes(t.id) ? activeTension.color : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Channel Style */}
          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' }}>
            <label style={{ fontSize: '24px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>Channel Style <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></label>
            <input
              value={channelStyle}
              onChange={e => setChannelStyle(e.target.value)}
              placeholder="e.g. Educational, fast-paced, MrBeast-style energy"
              style={{
                width: '100%', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                padding: '10px 12px', color: '#fff', fontSize: '17px', fontFamily: 'inherit', outline: 'none',
              }}
            />
          </div>

          {/* Inspiration Links */}
          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px' }}>
            <label style={{ fontSize: '24px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>Inspiration Links <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></label>
            <textarea
              value={inspirationLinks}
              onChange={e => setInspirationLinks(e.target.value)}
              placeholder="Paste YouTube video URLs for style inspiration..."
              rows={2}
              style={{
                width: '100%', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                padding: '10px 12px', color: '#fff', fontSize: '17px', lineHeight: 1.5, resize: 'vertical',
                fontFamily: 'inherit', outline: 'none',
              }}
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={loading ? () => abortRef.current?.abort() : generate}
            disabled={!topic.trim() && !loading}
            style={{
              width: '100%', padding: '14px', borderRadius: '10px', fontSize: '17px', fontWeight: 600,
              background: loading ? '#1a1a1a' : '#ffffff',
              color: loading ? '#fff' : '#000',
              border: loading ? '1px solid rgba(255,255,255,0.15)' : 'none',
              cursor: topic.trim() || loading ? 'pointer' : 'not-allowed',
              opacity: !topic.trim() && !loading ? 0.5 : 1,
              transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            {loading ? (
              <>
                <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Stop generating
              </>
            ) : '✦ Generate Script'}
          </button>
        </div>

        {/* RIGHT PANEL — Output */}
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', overflow: 'hidden', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0d0d0d' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '17px', fontWeight: 500, color: '#fff' }}>Script Output</span>
              {wordCount > 0 && (
                <span style={{ fontSize: '17px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', padding: '2px 8px', borderRadius: '20px' }}>
                  {wordCount.toLocaleString()} words
                </span>
              )}
              {loading && (
                <span style={{ fontSize: '17px', color: activeTension.color, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: activeTension.color, animation: 'pulse 1s infinite' }} />
                  Writing...
                </span>
              )}
            </div>
            {script && (
              <button onClick={handleCopy} style={{
                padding: '6px 14px', borderRadius: '6px', fontSize: '24px', fontWeight: 500,
                background: copied ? '#22c55e20' : 'rgba(255,255,255,0.08)',
                color: copied ? '#22c55e' : 'rgba(255,255,255,0.6)',
                border: `1px solid ${copied ? '#22c55e40' : 'rgba(255,255,255,0.1)'}`,
                cursor: 'pointer',
              }}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            )}
          </div>

          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
            {error && (
              <div style={{ background: '#ff4d4d15', border: '1px solid #ff4d4d30', borderRadius: '8px', padding: '12px 16px', color: '#ff4d4d', fontSize: '24px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            {!script && !loading && !error && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', gap: '16px', color: 'rgba(255,255,255,0.2)' }}>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <rect x="8" y="8" width="32" height="32" rx="6" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 18h16M16 24h16M16 30h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '17px', fontWeight: 500, marginBottom: '4px' }}>Your script will appear here</p>
                  <p style={{ fontSize: '17px' }}>Enter a topic and hit generate</p>
                </div>
              </div>
            )}

            {script && (
              <pre style={{
                whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '24px', lineHeight: '1.8',
                color: 'rgba(255,255,255,0.85)', fontFamily: 'inherit', margin: 0,
              }}>
                {script}
                {loading && <span style={{ opacity: 0.5, animation: 'pulse 1s infinite' }}>▊</span>}
              </pre>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        textarea:focus, input:focus { border-color: rgba(255,255,255,0.25) !important; }
      `}</style>
    </div>
  );
}
