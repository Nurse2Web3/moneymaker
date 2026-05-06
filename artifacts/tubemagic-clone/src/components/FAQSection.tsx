import { useState } from 'react';

const faqs = [
  {
    q: 'Do we offer free trials?',
    a: 'We have disabled free trials for now due to spam. We do offer a 30-day money back guarantee, so you can try out MoneyMaker risk free.',
  },
  {
    q: 'Are my payments secure?',
    a: 'All of our payments are processed through Paddle, which is one of the most secure payment processors out there. We do not even store any of your payment information.',
  },
  {
    q: 'Do you support Languages other than English?',
    a: 'Oh yes. We support over 95 languages for descriptions, titles, tags, community posts and video ideas. From Spanish to Japanese, you name it.',
  },
  {
    q: 'Can I get a refund?',
    a: 'Absolutely, if you do not like something and it has not been more than 30 days since your payment, you can send an email at support@moneymaker.app and get a full refund. No questions asked.',
  },
  {
    q: 'Can I cancel my subscription at any time?',
    a: "Of course, if there is any reason you'd like to cancel your subscription, you may do so.",
  },
  {
    q: "What if Stripe isn't available in my country?",
    a: "Reach out to us on support@moneymaker.app and we'll see what we can do. We may be able to offer you a different payment method.",
  },
  {
    q: 'Do you have an affiliate program?',
    a: 'Yes we do! 50% recurring commissions for life. Check it out here.',
  },
  {
    q: 'Is AI generated content good for SEO? Is it plagiarism free?',
    a: 'It absolutely is. We use a combination of AI and human curation to ensure that the content we generate is not only unique, but also high quality. We also have a plagiarism checker built in to ensure that the content we generate is not plagiarized.',
  },
  {
    q: 'Do you offer support?',
    a: 'You can reach us at support@moneymaker.app for anything. We mostly respond in under 12 hours on weekdays. We do prioritize paying customers and have live chat support for them.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      borderBottom: '1px solid rgba(255,255,255,0.07)',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '20px 0',
          fontSize: '17px',
          fontWeight: 500,
          color: '#fff',
          textAlign: 'left',
          background: 'none',
          cursor: 'pointer',
          gap: '16px',
        }}
      >
        <span>{q}</span>
        <span style={{
          flexShrink: 0,
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.4)',
          fontSize: '24px',
          transition: 'transform 0.2s',
          transform: open ? 'rotate(45deg)' : 'none',
        }}>+</span>
      </button>
      {open && (
        <p style={{
          fontSize: '24px',
          color: 'rgba(255,255,255,0.55)',
          lineHeight: 1.7,
          paddingBottom: '20px',
        }}>
          {a}
        </p>
      )}
    </div>
  );
}

export default function FAQSection() {
  return (
    <section style={{ padding: '80px 40px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em', marginBottom: '12px', textAlign: 'center', fontWeight: 500, textTransform: 'uppercase' }}>
          FAQs
        </p>
        <h2 style={{
          fontSize: 'clamp(28px, 3vw, 42px)',
          fontWeight: 700,
          letterSpacing: '-0.8px',
          textAlign: 'center',
          marginBottom: '8px',
          color: '#fff',
        }}>
          Questions we get asked
        </h2>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '17px', marginBottom: '48px' }}>
          Get answers to most frequently asked questions.
        </p>

        <div>
          {faqs.map(f => (
            <FAQItem key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </div>
    </section>
  );
}
