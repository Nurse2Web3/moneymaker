interface Props {
  onGetStarted: () => void;
}

export default function HeroSection({ onGetStarted }: Props) {
  const checks = ['Training Data', 'Multiple Models', 'Inspiration Videos', 'Custom Length', 'Writing Style', 'Editable'];

  return (
    <section style={{ paddingTop: '120px', paddingBottom: '80px', textAlign: 'center', background: '#0a0a0a' }}>
      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em', marginBottom: '28px', textTransform: 'uppercase', fontWeight: 500 }}>
        AI YouTube Script Writer
      </p>
      <h1 style={{
        fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 700, letterSpacing: '-1px',
        lineHeight: 1.15, maxWidth: '760px', margin: '0 auto 32px', color: '#fff',
      }}>
        Generate world-class YouTube scripts that sound like they were written by someone you paid thousands for.
      </h1>

      <button onClick={onGetStarted} style={{
        background: '#fff', color: '#000', padding: '13px 28px', borderRadius: '10px',
        fontSize: '15px', fontWeight: 600, border: 'none', cursor: 'pointer', marginBottom: '48px',
      }}>
        ✦ Try Script Writer Free
      </button>

      <div style={{
        margin: '0 auto 40px', maxWidth: '760px', borderRadius: '14px', overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 30px 80px rgba(0,0,0,0.6)', background: '#111',
      }}>
        <img
          src="https://tubemagic.com/_next/image?url=%2Ffeatures%2Ffeatures-1.png&w=1920&q=75"
          alt="MoneyMaker Script Writer"
          style={{ width: '100%', display: 'block' }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px 32px' }}>
        {checks.map(c => (
          <div key={c} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7L5.5 10.5L12 3.5" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {c}
          </div>
        ))}
      </div>
    </section>
  );
}
