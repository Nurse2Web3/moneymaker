const tools = [
  {
    title: 'AI Thumbnail Generator',
    desc: 'Instantly create scroll-stopping thumbnails with high CTR.',
    icon: '🖼️',
  },
  {
    title: 'Youtube to Transcript',
    desc: 'Paste a video link and get a clean transcript with formatting.',
    icon: '📝',
  },
  {
    title: 'Article to Script',
    desc: "Input any article URL and we'll turn it into a YouTube-ready script.",
    icon: '📰',
  },
  {
    title: 'Video to Script',
    desc: 'Convert any video into a brand-new original script.',
    icon: '🎬',
  },
];

export default function ContentToolsSection() {
  return (
    <section style={{ padding: '80px 40px' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em', marginBottom: '18px', textAlign: 'center', fontWeight: 500, textTransform: 'uppercase' }}>
          Content Creation Tools
        </p>
        <h2 style={{
          fontSize: 'clamp(26px, 3vw, 40px)',
          fontWeight: 700,
          letterSpacing: '-0.8px',
          textAlign: 'center',
          marginBottom: '52px',
          color: '#fff',
        }}>
          AI-Powered Tools for Thumbnails, Scripts, and More
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {tools.map(t => (
            <div key={t.title} style={{
              background: '#111111',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '14px',
              padding: '32px 28px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '18px',
            }}>
              <div style={{ fontSize: '32px', flexShrink: 0 }}>{t.icon}</div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>{t.title}</h3>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
