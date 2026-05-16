interface Props {
  onTryTitles: () => void;
  onTryDesc: () => void;
  onTryTags: () => void;
}

export default function UploadOptimizeSection({ onTryTitles, onTryDesc, onTryTags }: Props) {
  const tools = [
    { title: 'Warp Upload Optimizer', desc: 'Input your unlisted video and get: Optimized titles, tags, and descriptions instantly.', icon: '⚡', onClick: onTryTitles },
    { title: 'Title Generator', desc: 'Get 3 viral titles for any video or keyword.', icon: '✏️', onClick: onTryTitles },
    { title: 'Description Generator', desc: 'Auto-generate YouTube descriptions with timestamps.', icon: '📄', onClick: onTryDesc },
    { title: 'Keyword Analyzer', desc: 'Score real YouTube keywords by demand, competition, and freshness.', icon: '🔍', onClick: onTryTags },
  ];

  return (
    <section style={{ padding: '80px 40px', background: '#0d0d0d' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em', marginBottom: '18px', textAlign: 'center', fontWeight: 500, textTransform: 'uppercase' }}>Upload & Optimize</p>
        <h2 style={{ fontSize: 'clamp(28px, 3vw, 44px)', fontWeight: 700, letterSpacing: '-0.8px', textAlign: 'center', marginBottom: '52px', color: '#fff' }}>
          Optimize Every Video Before It Goes Live
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {tools.map(t => (
            <button key={t.title} onClick={t.onClick} style={{
              background: '#111111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px',
              padding: '32px 28px', display: 'flex', alignItems: 'flex-start', gap: '18px',
              cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
            >
              <div style={{ fontSize: '32px', flexShrink: 0 }}>{t.icon}</div>
              <div>
                <h3 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>{t.title}</h3>
                <p style={{ fontSize: '24px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{t.desc}</p>
                <span style={{ display: 'inline-block', marginTop: '12px', fontSize: '24px', color: 'rgba(255,255,255,0.35)' }}>Try it →</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
