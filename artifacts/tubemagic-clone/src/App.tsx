import { useState } from 'react';
import Navbar from './components/Navbar';
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
import IdeaGenerator from './components/IdeaGenerator';
import DescriptionGenerator from './components/DescriptionGenerator';
import TagGenerator from './components/TagGenerator';

type Page = 'home' | 'script-writer' | 'title-generator' | 'idea-generator' | 'description-generator' | 'tag-generator';

function AppNavbar({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const tools = [
    { id: 'script-writer' as Page, label: 'Script Writer', icon: '✦' },
    { id: 'idea-generator' as Page, label: 'Video Ideas', icon: '💡' },
    { id: 'title-generator' as Page, label: 'Title Generator', icon: '✏️' },
    { id: 'description-generator' as Page, label: 'Description', icon: '📄' },
    { id: 'tag-generator' as Page, label: 'Tags', icon: '🏷️' },
  ];

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px', height: '60px',
      background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
    }}>
      <button onClick={() => setPage('home')} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '16px', letterSpacing: '-0.3px', color: '#fff', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 0L16.5 4.5V13.5L9 18L1.5 13.5V4.5L9 0Z" fill="white"/>
          <path d="M6 6.5L12 9L6 11.5V6.5Z" fill="black"/>
        </svg>
        TubeMagic
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {tools.map(t => (
          <button key={t.id} onClick={() => setPage(t.id)} style={{
            padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
            background: page === t.id ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: page === t.id ? '#fff' : 'rgba(255,255,255,0.6)',
            border: page === t.id ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
            cursor: 'pointer', transition: 'all 0.15s',
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <button onClick={() => setPage('script-writer')} style={{
        background: '#ffffff', color: '#000000',
        padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
        border: 'none', cursor: 'pointer',
      }}>Get started</button>
    </nav>
  );
}

function ToolLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', paddingTop: '60px' }}>
      {children}
    </div>
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

      {page === 'script-writer' && (
        <ToolLayout title="Script Writer" subtitle="Powered by Claude · Tension Engine built-in">
          <ScriptWriter />
        </ToolLayout>
      )}

      {page === 'idea-generator' && (
        <ToolLayout title="Video Idea Generator" subtitle="AI-powered ideas for your niche">
          <IdeaGenerator />
        </ToolLayout>
      )}

      {page === 'title-generator' && (
        <ToolLayout title="Title Generator" subtitle="5 viral titles instantly">
          <TitleGenerator />
        </ToolLayout>
      )}

      {page === 'description-generator' && (
        <ToolLayout title="Description Generator" subtitle="SEO-optimized descriptions with timestamps">
          <DescriptionGenerator />
        </ToolLayout>
      )}

      {page === 'tag-generator' && (
        <ToolLayout title="Tag Generator" subtitle="High-SEO tags with one click">
          <TagGenerator />
        </ToolLayout>
      )}
    </div>
  );
}
