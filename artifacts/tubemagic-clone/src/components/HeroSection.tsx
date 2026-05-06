interface Props {
  onGetStarted: () => void;
}

export default function HeroSection({ onGetStarted }: Props) {
  const checks = ['Training Data', 'Multiple Models', 'Inspiration Videos', 'Custom Length', 'Writing Style', 'Editable'];

  return (
    <section style={{ paddingTop: '120px', paddingBottom: '80px', textAlign: 'center', background: '#0a0a0a' }}>
      <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em', marginBottom: '28px', textTransform: 'uppercase', fontWeight: 500 }}>
        AI YouTube Script Writer
      </p>
      <h1 style={{
        fontSize: 'clamp(34px, 4vw, 56px)', fontWeight: 700, letterSpacing: '-1px',
        lineHeight: 1.15, maxWidth: '760px', margin: '0 auto 32px', color: '#fff',
      }}>
        Generate world-class YouTube scripts that sound like they were written by someone you paid thousands for.
      </h1>

      <button onClick={onGetStarted} style={{
        background: '#fff', color: '#000', padding: '13px 28px', borderRadius: '10px',
        fontSize: '17px', fontWeight: 600, border: 'none', cursor: 'pointer', marginBottom: '48px',
      }}>
        ✦ Try Script Writer Free
      </button>

      <div style={{
        margin: '0 auto 40px', maxWidth: '760px', borderRadius: '14px', overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 30px 80px rgba(0,0,0,0.6)', background: '#111',
      }}>
        <div style={{ padding: '24px', background: '#0d0d0d', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#febc2e' }} />
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#28c840' }} />
          <span style={{ marginLeft: '12px', fontSize: '24px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>MoneyMaker — Script Writer</span>
        </div>
        <div style={{ padding: '32px 40px', textAlign: 'left' }}>
          <div style={{ fontSize: '17px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>Hook (0–15 seconds)</div>
          <div style={{ fontSize: '17px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, marginBottom: '24px', borderLeft: '3px solid #a78bfa', paddingLeft: '16px' }}>
            "What if I told you that 95% of YouTube channels never break 1,000 subscribers — and it has nothing to do with the algorithm, equipment, or how many videos you post?"
          </div>
          <div style={{ fontSize: '17px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>Open Loop</div>
          <div style={{ fontSize: '17px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, marginBottom: '24px', borderLeft: '3px solid #60a5fa', paddingLeft: '16px' }}>
            "By the end of this video, I'm going to show you the three things that top creators do differently — and none of them cost a single dollar..."
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['Open Loop', 'Pattern Interrupt', 'Stakes Escalation', 'Curiosity Gap'].map(t => (
              <span key={t} style={{ fontSize: '17px', padding: '4px 10px', borderRadius: '20px', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', color: '#a78bfa' }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px 32px' }}>
        {checks.map(c => (
          <div key={c} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '17px', color: 'rgba(255,255,255,0.7)' }}>
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
