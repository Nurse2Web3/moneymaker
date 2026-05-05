export default function BonusToolsSection() {
  return (
    <section style={{ padding: '80px 40px' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em', marginBottom: '18px', textAlign: 'center', fontWeight: 500, textTransform: 'uppercase' }}>
          Bonus Tools
        </p>
        <h2 style={{
          fontSize: 'clamp(26px, 3vw, 40px)',
          fontWeight: 700,
          letterSpacing: '-0.8px',
          textAlign: 'center',
          marginBottom: '52px',
          color: '#fff',
        }}>
          Supercharge Your Channel Growth
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', maxWidth: '720px', margin: '0 auto' }}>
          <div style={{
            background: '#111111',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '14px',
            padding: '32px 28px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '18px',
          }}>
            <div style={{ fontSize: '32px', flexShrink: 0 }}>💬</div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>Channel Name Generator</h3>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>Get creative YouTube name ideas based on your niche or keywords.</p>
            </div>
          </div>

          <div style={{
            background: '#111111',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '14px',
            padding: '32px 28px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '18px',
          }}>
            <div style={{ fontSize: '32px', flexShrink: 0 }}>🧩</div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>Chrome Extension</h3>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>Optimize your videos directly on YouTube with our browser extension.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
