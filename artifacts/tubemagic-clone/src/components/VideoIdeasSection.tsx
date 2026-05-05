const features = [
  {
    title: 'Video Idea Generator',
    desc: 'Add your channel link to get endless ideas that match your niche.',
    icon: '💡',
  },
  {
    title: 'Keyword Research',
    desc: 'See search volume, competition & our "Magic Score" to pick the right topics.',
    icon: '🔍',
  },
  {
    title: 'Niche Explorer',
    desc: 'Discover high-RPM niches and viral trends.',
    icon: '🚀',
  },
  {
    title: 'Top Video Finder',
    desc: 'Find most-viewed videos on any keyword instantly.',
    icon: '📈',
  },
  {
    title: 'Ideas Manager',
    desc: 'Track, save & organize your content pipeline.',
    icon: '📋',
  },
];

export default function VideoIdeasSection() {
  return (
    <section style={{ padding: '80px 40px', background: '#0d0d0d' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em', marginBottom: '18px', textAlign: 'center', fontWeight: 500, textTransform: 'uppercase' }}>
          Video Ideas & Research
        </p>
        <h2 style={{
          fontSize: 'clamp(26px, 3vw, 40px)',
          fontWeight: 700,
          letterSpacing: '-0.8px',
          textAlign: 'center',
          marginBottom: '52px',
          color: '#fff',
        }}>
          Never Run Out of Viral Video Ideas
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {features.map(f => (
            <div key={f.title} style={{
              background: '#111111',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '14px',
              padding: '28px 24px',
            }}>
              <div style={{ fontSize: '28px', marginBottom: '14px' }}>{f.icon}</div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>{f.title}</h3>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
