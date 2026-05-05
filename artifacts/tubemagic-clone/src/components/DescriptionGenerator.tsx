import { useState } from 'react';

export default function DescriptionGenerator() {
  const [title, setTitle] = useState('');
  const [script, setScript] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!title.trim()) return;
    setError('');
    setDescription('');
    setLoading(true);
    try {
      const res = await fetch('/api/tools/description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, script }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDescription(data.description || '');
    } catch {
      setError('Failed to generate description. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(description).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 24px' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Description Generator</h2>
      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '24px' }}>Auto-generate SEO-optimized YouTube descriptions with timestamps</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Video title *"
          style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}
        />
        <textarea
          value={script}
          onChange={e => setScript(e.target.value)}
          placeholder="Paste your script or key points (optional — improves accuracy)"
          rows={4}
          style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '14px', fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 1.5 }}
        />
        <button
          onClick={generate}
          disabled={!title.trim() || loading}
          style={{ padding: '12px', borderRadius: '10px', background: '#fff', color: '#000', fontWeight: 600, fontSize: '15px', cursor: title.trim() && !loading ? 'pointer' : 'not-allowed', opacity: (!title.trim() || loading) ? 0.5 : 1, border: 'none' }}
        >
          {loading ? 'Generating...' : '✦ Generate Description'}
        </button>
      </div>

      {error && <div style={{ background: '#ff4d4d15', border: '1px solid #ff4d4d30', borderRadius: '8px', padding: '12px 16px', color: '#ff4d4d', fontSize: '14px', marginBottom: '16px' }}>{error}</div>}

      {description && (
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0d0d0d' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>Generated Description</span>
            <button onClick={copy} style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '12px', background: copied ? '#22c55e20' : 'rgba(255,255,255,0.08)', color: copied ? '#22c55e' : 'rgba(255,255,255,0.5)', border: `1px solid ${copied ? '#22c55e40' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer' }}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <pre style={{ padding: '16px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '13px', lineHeight: 1.8, color: 'rgba(255,255,255,0.8)', fontFamily: 'inherit', margin: 0 }}>
            {description}
          </pre>
        </div>
      )}
    </div>
  );
}
