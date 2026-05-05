const tools = [
  {
    title: 'Warp Upload Optimizer',
    desc: 'Input your unlisted video and get: Optimized titles, tags, and descriptions instantly.',
    icon: '⚡',
  },
  {
    title: 'Title Generator',
    desc: 'Get 3 viral titles for any video or keyword.',
    icon: '✏️',
  },
  {
    title: 'Description Generator',
    desc: 'Auto-generate YouTube descriptions with timestamps.',
    icon: '📄',
  },
  {
    title: 'Tag Generator & Organizer',
    desc: 'Create high-SEO tags and organize/delete them easily.',
    icon: '🏷️',
  },
];

export default function UploadOptimizeSection() {
  return (
    <section style={{ padding: '80px 40px', background: '#0d0d0d' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em', marginBottom: '18px', textAlign: 'center', fontWeight: 500, textTransform: 'uppercase' }}>
          Upload & Optimize
        </p>
        <h2 style={{
          fontSize: 'clamp(26px, 3vw, 40px)',
          fontWeight: 700,
          letterSpacing: '-0.8px',
          textAlign: 'center',
          marginBottom: '52px',
          color: '#fff',
        }}>
          Optimize Every Video Before It Goes Live
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
