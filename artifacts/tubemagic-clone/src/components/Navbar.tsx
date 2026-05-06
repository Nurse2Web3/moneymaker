export default function Navbar() {
  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 40px',
      height: '60px',
      background: 'rgba(10,10,10,0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '17px', letterSpacing: '-0.3px' }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 0L16.5 4.5V13.5L9 18L1.5 13.5V4.5L9 0Z" fill="white"/>
          <path d="M6 6.5L12 9L6 11.5V6.5Z" fill="black"/>
        </svg>
        MoneyMaker
      </a>

      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <a href="#" style={{ fontSize: '24px', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>Features</a>
        <a href="#" style={{ fontSize: '24px', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>Pricing</a>
        <a href="#" style={{ fontSize: '24px', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>Affiliates</a>
        <a href="#" style={{
          background: '#ffffff',
          color: '#000000',
          padding: '8px 18px',
          borderRadius: '8px',
          fontSize: '24px',
          fontWeight: 600,
        }}>Get started</a>
      </div>
    </nav>
  );
}
