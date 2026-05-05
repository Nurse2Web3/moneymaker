export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid rgba(255,255,255,0.07)',
      padding: '32px 40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: '#0a0a0a',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '15px' }}>
        <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 0L16.5 4.5V13.5L9 18L1.5 13.5V4.5L9 0Z" fill="white"/>
          <path d="M6 6.5L12 9L6 11.5V6.5Z" fill="black"/>
        </svg>
        TubeMagic
      </div>
      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
        © 2024 TubeMagic. All rights reserved.
      </p>
    </footer>
  );
}
