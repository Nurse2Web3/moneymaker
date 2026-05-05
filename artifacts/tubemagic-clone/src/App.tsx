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

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <Navbar />
      <main>
        <HeroSection />
        <ScriptWritingSection />
        <VideoIdeasSection />
        <ContentToolsSection />
        <UploadOptimizeSection />
        <BonusToolsSection />
        <CTASection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
}
