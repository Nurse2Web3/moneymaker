export default function CTASection() {
  return (
    <section style={{
      padding: '100px 40px',
      background: '#0d0d0d',
      textAlign: 'center',
    }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <h2 style={{
          fontSize: 'clamp(28px, 3.5vw, 44px)',
          fontWeight: 700,
          letterSpacing: '-0.8px',
          marginBottom: '20px',
          color: '#fff',
          lineHeight: 1.2,
        }}>
          Get Started Now
        </h2>
        <p style={{
          fontSize: '16px',
          color: 'rgba(255,255,255,0.55)',
          lineHeight: 1.7,
          marginBottom: '36px',
          maxWidth: '540px',
          margin: '0 auto 36px',
        }}>
          Write world-class scripts and start taking advantage of some of the best AI tools out there for growing your YouTube channel faster.
        </p>
        <a href="#" style={{
          display: 'inline-block',
          background: '#ffffff',
          color: '#000000',
          padding: '14px 32px',
          borderRadius: '10px',
          fontSize: '15px',
          fontWeight: 600,
          letterSpacing: '-0.2px',
        }}>
          Get started
        </a>
      </div>
    </section>
  );
}
