interface Props {
  onTryIt: () => void;
}

const cards = [
  { title: 'Multiple AI Models', desc: 'Choose between Claude Sonnet, GPT-4o, and more. Claude is perfect for natural, human-like scripts.', imgUrl: 'https://tubemagic.com/_next/image?url=%2Ffeatures%2Fscript-writing-1.png&w=1920&q=75', hasImg: true },
  { title: 'Inspiration-Based Writing', desc: 'Input links to top-performing videos and TubeMagic will extract the best ideas for your script.', imgUrl: 'https://tubemagic.com/_next/image?url=%2Ffeatures%2Fscript-writing-2.png&w=1920&q=75', hasImg: true },
  { title: 'Custom Video Length', desc: 'Match script length to video time: 100 words = 1 min, 800 = 5 min, 1500 = 10 min, 3000 = 20 min.', imgUrl: 'https://tubemagic.com/_next/image?url=%2Ffeatures%2Fscript-writing-3.png&w=1920&q=75', hasImg: true },
  { title: 'Channel Writing Style', desc: 'Input your YouTube channel to match tone and structure for consistency.', hasImg: false },
  { title: 'Fully Editable', desc: 'Regenerate, edit, or chat with your script for fine-tuning.', hasImg: false },
  { title: 'Trained on the Best', desc: 'Default training uses top advice from elite YouTube scriptwriters for hooks, retention, and pacing.', hasImg: false },
];

export default function ScriptWritingSection({ onTryIt }: Props) {
  return (
    <section style={{ padding: '80px 40px', maxWidth: '1120px', margin: '0 auto' }}>
      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em', marginBottom: '18px', textAlign: 'center', fontWeight: 500, textTransform: 'uppercase' }}>Script Writing</p>
      <h2 style={{ fontSize: 'clamp(26px, 3vw, 40px)', fontWeight: 700, letterSpacing: '-0.8px', textAlign: 'center', marginBottom: '16px', color: '#fff' }}>
        Craft High-Retention YouTube Scripts with AI
      </h2>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <button onClick={onTryIt} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)', padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
          Try Script Writer →
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {cards.map(card => (
          <div key={card.title} style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden' }}>
            {card.hasImg && (
              <div style={{ background: '#1a1a1a', overflow: 'hidden' }}>
                <img src={card.imgUrl} alt={card.title} style={{ width: '100%', display: 'block' }} onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }} />
              </div>
            )}
            <div style={{ padding: '22px 24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px', color: '#fff' }}>{card.title}</h3>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{card.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
