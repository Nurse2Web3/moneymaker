import { useState } from 'react';
import SaveButton from './SaveButton';

export default function TagGenerator() {
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedAll, setCopiedAll] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [dataSource, setDataSource] = useState<string | null>(null);

  async function generate() {
    if (!title.trim()) return;
    setError('');
    setTags([]);
    setSelectedTags(new Set());
    setDataSource(null);
    setLoading(true);
    try {
      const res = await fetch('/api/tools/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, topic }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTags(data.tags || []);
      setSelectedTags(new Set(data.tags || []));
      setDataSource(data.dataSource || null);
    } catch {
      setError('Failed to generate tags. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function toggleTag(tag: string) {
    setSelectedTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag); else next.add(tag);
      return next;
    });
  }

  function copySelected() {
    navigator.clipboard.writeText([...selectedTags].join(', ')).catch(() => {});
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 24px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Tag Generator</h2>
      <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.45)', marginBottom: '24px' }}>Generate high-SEO tags. Click to deselect any you don't want.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Video title *"
          style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '24px', fontFamily: 'inherit', outline: 'none' }} />
        <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Additional topic context (optional)"
          style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '24px', fontFamily: 'inherit', outline: 'none' }} />
        <button onClick={generate} disabled={!title.trim() || loading}
          style={{ padding: '12px', borderRadius: '10px', background: '#fff', color: '#000', fontWeight: 600, fontSize: '17px', cursor: title.trim() && !loading ? 'pointer' : 'not-allowed', opacity: (!title.trim() || loading) ? 0.5 : 1, border: 'none' }}>
          {loading ? 'Generating...' : '✦ Generate Tags'}
        </button>
      </div>

      {error && <div style={{ background: '#ff4d4d15', border: '1px solid #ff4d4d30', borderRadius: '8px', padding: '12px 16px', color: '#ff4d4d', fontSize: '24px', marginBottom: '16px' }}>{error}</div>}

      {dataSource && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', padding: '7px 12px', borderRadius: '8px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', width: 'fit-content' }}>
          <span style={{ fontSize: '13px' }}>📊</span>
          <span style={{ fontSize: '13px', color: '#22c55e', fontWeight: 500 }}>{dataSource} — tags reflect real keyword patterns</span>
        </div>
      )}

      {tags.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '17px', color: 'rgba(255,255,255,0.45)' }}>{selectedTags.size} of {tags.length} selected</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <SaveButton type="tags" label={`Tags for: ${title}`} content={[...selectedTags].join(', ')} meta={`Video: ${title}`} />
              <button onClick={copySelected} style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '24px', background: copiedAll ? '#22c55e20' : 'rgba(255,255,255,0.08)', color: copiedAll ? '#22c55e' : 'rgba(255,255,255,0.5)', border: `1px solid ${copiedAll ? '#22c55e40' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer' }}>
                {copiedAll ? '✓ Copied!' : 'Copy selected'}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {tags.map(tag => (
              <button key={tag} onClick={() => toggleTag(tag)} style={{
                padding: '6px 14px', borderRadius: '20px', fontSize: '17px',
                background: selectedTags.has(tag) ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: selectedTags.has(tag) ? '#fff' : 'rgba(255,255,255,0.35)',
                border: `1px solid ${selectedTags.has(tag) ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`,
                cursor: 'pointer', transition: 'all 0.15s',
                textDecoration: selectedTags.has(tag) ? 'none' : 'line-through',
              }}>
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
