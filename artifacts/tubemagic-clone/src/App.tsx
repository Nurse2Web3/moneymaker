import { useState, useRef, useEffect } from 'react';
import HeroSection from './components/HeroSection';
import ScriptWritingSection from './components/ScriptWritingSection';
import VideoIdeasSection from './components/VideoIdeasSection';
import ContentToolsSection from './components/ContentToolsSection';
import UploadOptimizeSection from './components/UploadOptimizeSection';
import BonusToolsSection from './components/BonusToolsSection';
import CTASection from './components/CTASection';
import FAQSection from './components/FAQSection';
import Footer from './components/Footer';
import ScriptWriter from './components/ScriptWriter';
import TitleGenerator from './components/TitleGenerator';
import SeoBundle from './components/SeoBundle';
import IdeaGenerator from './components/IdeaGenerator';
import DescriptionGenerator from './components/DescriptionGenerator';
import TagGenerator from './components/TagGenerator';
import ScriptImprover from './components/ScriptImprover';
import HookGenerator from './components/HookGenerator';
import ThumbnailGenerator from './components/ThumbnailGenerator';
import ThumbnailMaker from './components/ThumbnailMaker';
import NicheAnalyzer from './components/NicheAnalyzer';
import VideoAnalyzer from './components/VideoAnalyzer';
import Teleprompter from './components/Teleprompter';
import ChannelCloner from './components/ChannelCloner';
import VideoMaker from './components/VideoMaker';
import SavedDashboard from './components/SavedDashboard';
import { useSavedItems } from './lib/savedItems';

type Page =
  | 'home'
  | 'script-writer'
  | 'script-improver'
  | 'hook-generator'
  | 'idea-generator'
  | 'title-generator'
  | 'seo-bundle'
  | 'description-generator'
  | 'tag-generator'
  | 'thumbnail-generator'
  | 'thumbnail-maker'
  | 'niche-analyzer'
  | 'video-analyzer'
  | 'teleprompter'
  | 'channel-cloner'
  | 'video-maker'
  | 'saved';

const TOOL_GROUPS = [
  {
    label: 'Scripts',
    color: '#a78bfa',
    tools: [
      { id: 'script-writer' as Page, label: 'Script Writer', icon: '✦', desc: 'Full scripts with Tension Engine' },
      { id: 'script-improver' as Page, label: 'Script Improver', icon: '✨', desc: 'Rewrite & upgrade existing scripts' },
      { id: 'hook-generator' as Page, label: 'Hook Generator', icon: '🎣', desc: '6 viral hook styles for any topic' },
      { id: 'teleprompter' as Page, label: 'Teleprompter', icon: '🎬', desc: 'Full-screen auto-scroll while you record' },
      { id: 'video-maker' as Page, label: 'Video Maker', icon: '🎥', desc: 'Turn your script into an animated video' },
    ],
  },
  {
    label: 'Research',
    color: '#34d399',
    tools: [
      { id: 'idea-generator' as Page, label: 'Video Ideas', icon: '💡', desc: 'High-potential ideas for your niche' },
      { id: 'niche-analyzer' as Page, label: 'Niche Analyzer', icon: '🔬', desc: 'Gaps, opportunities & quick wins' },
      { id: 'video-analyzer' as Page, label: 'Video Analyzer', icon: '📡', desc: 'Decode any video\'s transcript & formula' },
      { id: 'channel-cloner' as Page, label: 'Channel DNA', icon: '🧬', desc: 'Clone any channel\'s style & voice' },
    ],
  },
  {
    label: 'Optimize',
    color: '#60a5fa',
    tools: [
      { id: 'title-generator' as Page, label: 'Title Generator', icon: '✏️', desc: '5 viral titles — scored 0-100 for CTR' },
      { id: 'seo-bundle' as Page, label: 'SEO Bundle', icon: '📦', desc: 'Titles + description + tags + hashtags in one call' },
      { id: 'description-generator' as Page, label: 'Description', icon: '📄', desc: 'SEO description + timestamps' },
      { id: 'tag-generator' as Page, label: 'Tags', icon: '🏷️', desc: '20 high-SEO tags' },
      { id: 'thumbnail-maker' as Page, label: 'Thumbnail Maker', icon: '🎨', desc: 'Drag-and-drop MrBeast-style editor' },
      { id: 'thumbnail-generator' as Page, label: 'Thumbnail Text', icon: '🖼️', desc: 'High-CTR text overlay ideas' },
    ],
  },
];

function AppNavbar({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { items: savedItems } = useSavedItems();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const allTools = TOOL_GROUPS.flatMap(g => g.tools);
  const activeLabel = allTools.find(t => t.id === page)?.label;

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px', height: '60px',
      background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
    }}>
      {/* Logo */}
      <button onClick={() => { setPage('home'); setOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '24px', color: '#fff', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 0L16.5 4.5V13.5L9 18L1.5 13.5V4.5L9 0Z" fill="white"/>
          <path d="M6 6.5L12 9L6 11.5V6.5Z" fill="black"/>
        </svg>
        MoneyMaker
      </button>

      {/* Tools Dropdown */}
      <div ref={ref} style={{ position: 'relative' }}>
        <button onClick={() => setOpen(o => !o)} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '7px 14px', borderRadius: '8px', fontSize: '17px', fontWeight: 500,
          background: open || page !== 'home' ? 'rgba(255,255,255,0.08)' : 'transparent',
          color: page !== 'home' ? '#fff' : 'rgba(255,255,255,0.7)',
          border: `1px solid ${open || page !== 'home' ? 'rgba(255,255,255,0.15)' : 'transparent'}`,
          cursor: 'pointer',
        }}>
          {page !== 'home' ? `${allTools.find(t => t.id === page)?.icon} ${activeLabel}` : '⚡ Tools'}
          <svg width="12" height="12" viewBox="0 0 12 12" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', opacity: 0.6 }}>
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </button>

        {open && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
            width: '560px', background: '#111', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '14px', padding: '16px', display: 'flex', gap: '0',
            boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
          }}>
            {TOOL_GROUPS.map((group, gi) => (
              <div key={group.label} style={{ flex: 1, padding: '0 12px', borderRight: gi < TOOL_GROUPS.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: group.color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px', paddingLeft: '4px' }}>{group.label}</div>
                {group.tools.map(t => (
                  <button key={t.id} onClick={() => { setPage(t.id); setOpen(false); }} style={{
                    width: '100%', display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 10px',
                    borderRadius: '8px', background: page === t.id ? 'rgba(255,255,255,0.07)' : 'transparent',
                    border: 'none', cursor: 'pointer', textAlign: 'left', marginBottom: '2px',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = page === t.id ? 'rgba(255,255,255,0.07)' : 'transparent')}
                  >
                    <span style={{ fontSize: '24px', flexShrink: 0, marginTop: '1px' }}>{t.icon}</span>
                    <div>
                      <div style={{ fontSize: '17px', fontWeight: 500, color: page === t.id ? '#fff' : 'rgba(255,255,255,0.85)', marginBottom: '1px' }}>{t.label}</div>
                      <div style={{ fontSize: '17px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>{t.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Saved bookmark */}
        <button
          onClick={() => { setPage('saved'); setOpen(false); }}
          title="Saved items"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 8,
            background: page === 'saved' ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${page === 'saved' ? 'rgba(167,139,250,0.35)' : 'rgba(255,255,255,0.1)'}`,
            color: page === 'saved' ? '#a78bfa' : 'rgba(255,255,255,0.55)',
            cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}
        >
          <svg width="13" height="15" viewBox="0 0 12 15" fill={page === 'saved' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 1h10v13l-5-3.5L1 14V1z" />
          </svg>
          Saved
          {savedItems.length > 0 && (
            <span style={{
              background: page === 'saved' ? '#a78bfa' : 'rgba(167,139,250,0.7)',
              color: '#fff', borderRadius: 20, fontSize: 10, fontWeight: 700,
              padding: '1px 6px', lineHeight: 1.5,
            }}>
              {savedItems.length}
            </span>
          )}
        </button>

        {/* CTA */}
        <button onClick={() => { setPage('script-writer'); setOpen(false); }} style={{
          background: '#ffffff', color: '#000000',
          padding: '7px 16px', borderRadius: '8px', fontSize: '17px', fontWeight: 600,
          border: 'none', cursor: 'pointer',
        }}>Get started</button>
      </div>
    </nav>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>('home');

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <AppNavbar page={page} setPage={setPage} />

      {page === 'home' && (
        <main>
          <HeroSection onGetStarted={() => setPage('script-writer')} />
          <ScriptWritingSection onTryIt={() => setPage('script-writer')} />
          <VideoIdeasSection onTryIt={() => setPage('idea-generator')} />
          <ContentToolsSection />
          <UploadOptimizeSection onTryTitles={() => setPage('title-generator')} onTryDesc={() => setPage('description-generator')} onTryTags={() => setPage('tag-generator')} />
          <BonusToolsSection />
          <CTASection onGetStarted={() => setPage('script-writer')} />
          <FAQSection />
          <Footer />
        </main>
      )}

      <div style={{ display: page !== 'home' ? 'block' : 'none', minHeight: '100vh', background: '#0a0a0a', paddingTop: '60px' }}>
        {page === 'script-writer' && <ScriptWriter />}
        {page === 'script-improver' && <ScriptImprover />}
        {page === 'hook-generator' && <HookGenerator />}
        {page === 'idea-generator' && <IdeaGenerator />}
        {page === 'niche-analyzer' && <NicheAnalyzer />}
        {page === 'video-analyzer' && <VideoAnalyzer />}
        {page === 'teleprompter' && <Teleprompter />}
        {page === 'title-generator' && <TitleGenerator />}
        {page === 'seo-bundle' && <SeoBundle />}
        {page === 'description-generator' && <DescriptionGenerator />}
        {page === 'tag-generator' && <TagGenerator />}
        {page === 'thumbnail-maker' && <ThumbnailMaker />}
        {page === 'thumbnail-generator' && <ThumbnailGenerator />}
        {page === 'channel-cloner' && <ChannelCloner />}
        {page === 'video-maker' && <VideoMaker />}
        {page === 'saved' && <SavedDashboard />}
      </div>
    </div>
  );
}
