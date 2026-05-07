import { useState } from 'react';
import { useSavedItems, TYPE_META, type SavedItemType } from '../lib/savedItems';

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

function copyText(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

const ALL_TYPES = Object.keys(TYPE_META) as SavedItemType[];

export default function SavedDashboard() {
  const { items, removeItem } = useSavedItems();
  const [filter, setFilter] = useState<SavedItemType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = items.filter(item => {
    if (filter !== 'all' && item.type !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return item.label.toLowerCase().includes(q) || item.content.toLowerCase().includes(q) || (item.meta ?? '').toLowerCase().includes(q);
    }
    return true;
  });

  function copy(id: string, content: string) {
    copyText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const typesWithItems = ALL_TYPES.filter(t => items.some(i => i.type === t));

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>Saved Items</h1>
          {items.length > 0 && (
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>{items.length} saved</span>
          )}
        </div>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)' }}>Everything you've saved from across the app — scripts, hooks, titles, ideas, and more.</p>
      </div>

      {items.length === 0 ? (
        /* Empty state */
        <div style={{ textAlign: 'center', padding: '80px 24px' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🔖</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Nothing saved yet</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)', maxWidth: 380, margin: '0 auto' }}>
            Hit the bookmark icon on any script, hook, title, idea, or niche to save it here for later.
          </p>
        </div>
      ) : (
        <>
          {/* Search + filter bar */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search saved items…"
              style={{
                flex: 1, minWidth: 200, padding: '9px 14px', borderRadius: 9,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none',
              }}
            />
          </div>

          {/* Type filter pills */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
            <button onClick={() => setFilter('all')} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: filter === 'all' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${filter === 'all' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'}`,
              color: filter === 'all' ? '#fff' : 'rgba(255,255,255,0.45)',
            }}>
              All ({items.length})
            </button>
            {typesWithItems.map(t => {
              const m = TYPE_META[t];
              const count = items.filter(i => i.type === t).length;
              return (
                <button key={t} onClick={() => setFilter(t)} style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  background: filter === t ? m.color + '22' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${filter === t ? m.color + '55' : 'rgba(255,255,255,0.08)'}`,
                  color: filter === t ? m.color : 'rgba(255,255,255,0.45)',
                }}>
                  {m.icon} {m.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Items grid */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', color: 'rgba(255,255,255,0.35)', fontSize: 15 }}>
              No items match your search.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
              {filtered.map(item => {
                const tm = TYPE_META[item.type];
                const isExpanded = expandedId === item.id;
                const preview = isExpanded ? item.content : item.content.slice(0, 200) + (item.content.length > 200 ? '…' : '');

                return (
                  <div key={item.id} style={{
                    background: '#111', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
                    borderTop: `2px solid ${item.color}44`,
                  }}>
                    {/* Card header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                            background: item.color + '22', color: item.color, border: `1px solid ${item.color}44`,
                            letterSpacing: '0.05em', flexShrink: 0,
                          }}>
                            {tm.icon} {tm.label}
                          </span>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{timeAgo(item.savedAt)}</span>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.label}
                        </div>
                        {item.meta && (
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{item.meta}</div>
                        )}
                      </div>
                    </div>

                    {/* Content preview */}
                    <div
                      style={{
                        fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6,
                        background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 12px',
                        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        maxHeight: isExpanded ? 400 : 120, overflowY: isExpanded ? 'auto' : 'hidden',
                        transition: 'max-height 0.2s',
                      }}
                    >
                      {preview}
                    </div>

                    {item.content.length > 200 && (
                      <button onClick={() => setExpandedId(isExpanded ? null : item.id)} style={{
                        fontSize: 12, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none',
                        cursor: 'pointer', textAlign: 'left', padding: 0,
                      }}>
                        {isExpanded ? '▲ Show less' : '▼ Show more'}
                      </button>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                      <button onClick={() => copy(item.id, item.content)} style={{
                        flex: 1, padding: '6px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                        background: copiedId === item.id ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)',
                        border: `1px solid ${copiedId === item.id ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
                        color: copiedId === item.id ? '#22c55e' : 'rgba(255,255,255,0.55)',
                        cursor: 'pointer',
                      }}>
                        {copiedId === item.id ? '✓ Copied' : 'Copy'}
                      </button>
                      <button onClick={() => removeItem(item.id)} style={{
                        padding: '6px 10px', borderRadius: 7, fontSize: 12,
                        background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)',
                        color: 'rgba(239,68,68,0.6)', cursor: 'pointer',
                      }}>
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
