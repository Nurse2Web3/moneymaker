import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoScene {
  id: number;
  duration: number;
  headline: string;
  highlightWords: string[];
  subtext: string;
  emoji: string;
  palette: string;
  animStyle: 'word-by-word' | 'all-in' | 'rise-up';
}

// ─── Palette definitions ──────────────────────────────────────────────────────
const PALETTES: Record<string, { bg: string; orb1: string; orb2: string; accent: string; highlightText: string }> = {
  purple: { bg: 'linear-gradient(145deg,#0d0618 0%,#1e0a3c 50%,#2d1060 100%)', orb1: '#7c3aed', orb2: '#4c1d95', accent: '#a78bfa', highlightText: '#0d0618' },
  blue:   { bg: 'linear-gradient(145deg,#020917 0%,#0a1f3d 50%,#0f3460 100%)', orb1: '#2563eb', orb2: '#1e3a5f', accent: '#60a5fa', highlightText: '#020917' },
  red:    { bg: 'linear-gradient(145deg,#0f0202 0%,#3b0a0a 50%,#7f1d1d 100%)', orb1: '#dc2626', orb2: '#991b1b', accent: '#f87171', highlightText: '#0f0202' },
  gold:   { bg: 'linear-gradient(145deg,#0e0900 0%,#2d1e00 50%,#78350f 100%)', orb1: '#d97706', orb2: '#92400e', accent: '#fbbf24', highlightText: '#0e0900' },
  green:  { bg: 'linear-gradient(145deg,#010d04 0%,#052e16 50%,#166534 100%)', orb1: '#16a34a', orb2: '#14532d', accent: '#4ade80', highlightText: '#010d04' },
  teal:   { bg: 'linear-gradient(145deg,#000d0d 0%,#042726 50%,#0f766e 100%)', orb1: '#0d9488', orb2: '#134e4a', accent: '#2dd4bf', highlightText: '#000d0d' },
  pink:   { bg: 'linear-gradient(145deg,#100010 0%,#3b0a28 50%,#831843 100%)', orb1: '#db2777', orb2: '#9d174d', accent: '#f472b6', highlightText: '#100010' },
  orange: { bg: 'linear-gradient(145deg,#0f0500 0%,#431407 50%,#9a3412 100%)', orb1: '#ea580c', orb2: '#c2410c', accent: '#fb923c', highlightText: '#0f0500' },
  dark:   { bg: 'linear-gradient(145deg,#050505 0%,#0f0f0f 50%,#1a1a2e 100%)', orb1: '#6366f1', orb2: '#312e81', accent: '#e2e8f0', highlightText: '#050505' },
};

// ─── Floating background orbs ─────────────────────────────────────────────────
function FloatingOrbs({ color1, color2 }: { color1: string; color2: string }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <motion.div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: `radial-gradient(circle, ${color1}28, transparent 70%)`,
        top: '-20%', left: '-15%', filter: 'blur(60px)',
      }} animate={{ scale: [1, 1.15, 1], x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: `radial-gradient(circle, ${color2}20, transparent 70%)`,
        bottom: '-15%', right: '-10%', filter: 'blur(50px)',
      }} animate={{ scale: [1, 1.2, 1], x: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }} />
      <motion.div style={{
        position: 'absolute', width: 200, height: 200, borderRadius: '50%',
        background: `radial-gradient(circle, ${color1}15, transparent 70%)`,
        top: '40%', right: '15%', filter: 'blur(40px)',
      }} animate={{ scale: [1, 1.3, 1], y: [0, 20, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }} />
    </div>
  );
}

// ─── Animated word ────────────────────────────────────────────────────────────
function Word({ word, isHighlighted, accentColor, highlightText, isVisible, delay, animStyle }: {
  word: string; isHighlighted: boolean; accentColor: string; highlightText: string;
  isVisible: boolean; delay: number; animStyle: string;
}) {
  const variants = {
    'word-by-word': {
      hidden: { opacity: 0, y: 28, filter: 'blur(4px)' },
      visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
    },
    'all-in': {
      hidden: { opacity: 0, scale: 0.85 },
      visible: { opacity: 1, scale: 1 },
    },
    'rise-up': {
      hidden: { opacity: 0, y: 50, scale: 0.9 },
      visible: { opacity: 1, y: 0, scale: 1 },
    },
  };

  const v = variants[animStyle as keyof typeof variants] ?? variants['word-by-word'];

  return (
    <motion.span
      style={{
        display: 'inline-block',
        color: isHighlighted ? highlightText : '#ffffff',
        background: isHighlighted ? accentColor : 'transparent',
        borderRadius: isHighlighted ? 6 : 0,
        padding: isHighlighted ? '2px 10px 4px' : '0',
        margin: '0 3px',
        fontWeight: 900,
        letterSpacing: '-0.025em',
        textShadow: isHighlighted ? 'none' : '0 2px 20px rgba(0,0,0,0.5)',
      }}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      variants={v}
      transition={{ duration: animStyle === 'rise-up' ? 0.45 : 0.22, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {word}
    </motion.span>
  );
}

// ─── Scene View ────────────────────────────────────────────────────────────────
function SceneView({ scene, isShort }: { scene: VideoScene; isShort: boolean }) {
  const pal = PALETTES[scene.palette] ?? PALETTES.dark;
  const words = scene.headline.split(' ');
  const [visibleCount, setVisibleCount] = useState(0);
  const [showSub, setShowSub] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);

  useEffect(() => {
    setVisibleCount(0);
    setShowSub(false);
    setShowEmoji(false);

    if (scene.animStyle === 'word-by-word') {
      let i = 0;
      const step = () => {
        i++;
        setVisibleCount(i);
        if (i < words.length) {
          setTimeout(step, 160);
        } else {
          setTimeout(() => { setShowSub(true); setShowEmoji(true); }, 250);
        }
      };
      const t = setTimeout(step, 200);
      return () => clearTimeout(t);
    } else {
      const t1 = setTimeout(() => { setVisibleCount(words.length); setShowEmoji(true); }, 150);
      const t2 = setTimeout(() => setShowSub(true), scene.animStyle === 'rise-up' ? 700 : 500);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene.id]);

  const fontSize = isShort
    ? `clamp(32px, ${Math.max(5, 9 - words.length * 0.3)}vw, 64px)`
    : `clamp(26px, ${Math.max(3, 5 - words.length * 0.15)}vw, 56px)`;

  const transitionVariants: Record<string, { initial: object; animate: object; exit: object }> = {
    'word-by-word': { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
    'all-in':       { initial: { opacity: 0, scale: 0.96 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.02 } },
    'rise-up':      { initial: { y: '6%', opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: '-6%', opacity: 0 } },
  };
  const tv = transitionVariants[scene.animStyle] ?? transitionVariants['all-in'];

  return (
    <motion.div
      key={scene.id}
      style={{ position: 'absolute', inset: 0, background: pal.bg, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
      initial={tv.initial}
      animate={tv.animate}
      exit={tv.exit}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <FloatingOrbs color1={pal.orb1} color2={pal.orb2} />

      {/* Subtle grain texture via SVG filter */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <filter id={`grain-${scene.id}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feBlend in="SourceGraphic" mode="multiply" />
        </filter>
      </svg>

      {/* Content container */}
      <div style={{
        position: 'relative', zIndex: 10,
        width: '100%', padding: isShort ? '0 9%' : '0 10%',
        textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isShort ? 20 : 16,
      }}>
        {/* Emoji */}
        {scene.emoji && (
          <AnimatePresence>
            {showEmoji && (
              <motion.div
                style={{ fontSize: isShort ? 64 : 52, lineHeight: 1, filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.4))' }}
                initial={{ scale: 0, rotate: -15, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
              >
                {scene.emoji}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Headline words */}
        <div style={{ fontSize, lineHeight: 1.15, fontFamily: "'Inter', system-ui, sans-serif" }}>
          {words.map((w, i) => {
            const clean = w.replace(/[^a-zA-Z0-9%$]/g, '').toLowerCase();
            const isHl = scene.highlightWords.some(hw => hw.toLowerCase().replace(/[^a-zA-Z0-9%$]/g, '') === clean);
            const wordDelay = scene.animStyle === 'word-by-word' ? 0 : i * 0.06;
            return (
              <Word
                key={i}
                word={w}
                isHighlighted={isHl}
                accentColor={pal.accent}
                highlightText={pal.highlightText}
                isVisible={i < visibleCount}
                delay={wordDelay}
                animStyle={scene.animStyle}
              />
            );
          })}
        </div>

        {/* Subtext */}
        {scene.subtext && (
          <AnimatePresence>
            {showSub && (
              <motion.p
                style={{
                  fontSize: isShort ? 'clamp(14px, 3.5vw, 20px)' : 'clamp(13px, 1.5vw, 18px)',
                  color: 'rgba(255,255,255,0.55)',
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontWeight: 500,
                  letterSpacing: '0.01em',
                  lineHeight: 1.5,
                  maxWidth: '80%',
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                {scene.subtext}
              </motion.p>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Accent bottom bar — sweeps across, acts as scene timer */}
      <motion.div style={{
        position: 'absolute', bottom: 0, left: 0, height: 3,
        background: `linear-gradient(90deg, ${pal.accent}aa, ${pal.accent})`,
        borderRadius: '0 2px 2px 0',
      }}
        initial={{ width: '0%' }}
        animate={{ width: '100%' }}
        transition={{ duration: scene.duration / 1000, ease: 'linear' }}
      />

      {/* Palette accent dot top-left */}
      <div style={{
        position: 'absolute', top: 14, left: 16,
        width: 8, height: 8, borderRadius: '50%',
        background: pal.accent, boxShadow: `0 0 10px ${pal.accent}88`,
      }} />
    </motion.div>
  );
}

// ─── Stories-style progress bar ───────────────────────────────────────────────
function StoriesProgress({ total, current, accentColor }: { total: number; current: number; accentColor: string }) {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '0 2px' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 2,
            background: i < current ? accentColor : i === current ? accentColor : 'transparent',
            width: i < current ? '100%' : i === current ? '100%' : '0%',
            transition: i < current ? 'none' : 'none',
          }} />
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function VideoMaker() {
  const [script, setScript] = useState('');
  const [format, setFormat] = useState<'long' | 'short'>('short');
  const [scenes, setScenes] = useState<VideoScene[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentScene, setCurrentScene] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [step, setStep] = useState<'input' | 'preview'>('input');

  const videoRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const isShort = format === 'short';

  async function generate() {
    if (!script.trim()) return;
    setLoading(true);
    setError('');
    setScenes([]);
    setCurrentScene(0);
    setPlaying(false);
    try {
      const res = await fetch('/api/tools/video-scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, format }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Generation failed');
      setScenes(data.scenes);
      setStep('preview');
      setCurrentScene(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const advanceScene = useCallback((idx: number, list: VideoScene[]) => {
    if (idx >= list.length) { setPlaying(false); setCurrentScene(0); return; }
    setCurrentScene(idx);
    timerRef.current = setTimeout(() => advanceScene(idx + 1, list), list[idx].duration);
  }, []);

  function togglePlay() {
    if (playing) {
      setPlaying(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    } else {
      setPlaying(true);
      advanceScene(currentScene, scenes);
    }
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  useEffect(() => { if (!playing && timerRef.current) clearTimeout(timerRef.current); }, [playing]);

  async function startRecording() {
    if (!videoRef.current) return;
    chunksRef.current = [];
    setRecordedChunks([]);
    setRecording(true);
    try {
      const el = videoRef.current as HTMLElement & { captureStream?: () => MediaStream };
      const stream = el.captureStream?.();
      if (!stream) { alert('Screen capture not supported in this browser.'); setRecording(false); return; }
      const mr = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => { setRecordedChunks([...chunksRef.current]); setRecording(false); };
      mr.start(100);
      setPlaying(true);
      setCurrentScene(0);
      const playThrough = (i: number) => {
        if (i >= scenes.length) { mr.stop(); setPlaying(false); return; }
        setCurrentScene(i);
        timerRef.current = setTimeout(() => playThrough(i + 1), scenes[i].duration);
      };
      playThrough(0);
    } catch { setRecording(false); }
  }

  function downloadRecording() {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moneymaker-${format}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalSec = Math.round(scenes.reduce((s, sc) => s + sc.duration, 0) / 1000);
  const currentPal = PALETTES[scenes[currentScene]?.palette] ?? PALETTES.dark;

  // ── Input step ──────────────────────────────────────────────────────────────
  if (step === 'input') {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#fff', marginBottom: 8 }}>🎬 Script → Video</h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, lineHeight: 1.6 }}>
            Paste your script and AI breaks it into punchy kinetic text slides — bold words, animated reveals, professional motion graphics.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          {([
            { id: 'short', label: '9:16 — TikTok / Shorts', icon: '📱', desc: 'Vertical, optimized for Shorts & Reels' },
            { id: 'long',  label: '16:9 — YouTube',        icon: '🖥️', desc: 'Landscape, wide-screen YouTube format' },
          ] as const).map(f => (
            <button key={f.id} onClick={() => setFormat(f.id)} style={{
              flex: 1, padding: '14px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
              background: format === f.id ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${format === f.id ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.1)'}`,
            }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{f.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: format === f.id ? '#a78bfa' : 'rgba(255,255,255,0.8)', marginBottom: 2 }}>{f.label}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{f.desc}</div>
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Your Script
          </label>
          <textarea
            value={script}
            onChange={e => setScript(e.target.value)}
            placeholder="Paste your script here — from the Script Writer, Script Improver, or your own. AI will pull the key messages and animate them into punchy slides with highlighted words, emoji, and smooth transitions."
            style={{
              width: '100%', minHeight: 280, padding: 16, borderRadius: 10, boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', fontSize: 15, lineHeight: 1.7, resize: 'vertical',
              fontFamily: 'inherit', outline: 'none',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>{script.trim().split(/\s+/).filter(Boolean).length} words</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Max 8,000 words</span>
          </div>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, color: '#fca5a5', fontSize: 14, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <button onClick={generate} disabled={loading || script.trim().length < 50} style={{
          width: '100%', padding: 15, borderRadius: 10, fontSize: 15, fontWeight: 700,
          background: loading || script.trim().length < 50 ? 'rgba(255,255,255,0.08)' : '#fff',
          color: loading || script.trim().length < 50 ? 'rgba(255,255,255,0.3)' : '#000',
          border: 'none', cursor: loading || script.trim().length < 50 ? 'not-allowed' : 'pointer',
        }}>
          {loading ? '✨ Building your video slides…' : '✨ Generate Video'}
        </button>

        {loading && (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {['Analyzing script', 'Writing slide copy', 'Choosing palettes', 'Setting animations'].map((s, i) => (
                <motion.div key={s} style={{ flex: 1, padding: '8px 4px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.3 }}>
                  {s}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Preview step ────────────────────────────────────────────────────────────
  const previewW = isShort ? 340 : 640;
  const previewH = isShort ? 606 : 360;
  const scene = scenes[currentScene];

  return (
    <div style={{ padding: '24px', maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Video Preview</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
            {scenes.length} slides · {totalSec < 60 ? `${totalSec}s` : `${Math.floor(totalSec / 60)}m ${totalSec % 60}s`} · {isShort ? '9:16 Vertical' : '16:9 Landscape'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { setStep('input'); setPlaying(false); if (timerRef.current) clearTimeout(timerRef.current); }} style={{
            padding: '7px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.65)', fontSize: 13, cursor: 'pointer',
          }}>← Edit Script</button>
          {recordedChunks.length > 0 && (
            <button onClick={downloadRecording} style={{
              padding: '7px 14px', borderRadius: 8, background: '#22c55e',
              border: 'none', color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>⬇ Download .webm</button>
          )}
          <button onClick={startRecording} disabled={recording} style={{
            padding: '7px 14px', borderRadius: 8,
            background: recording ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.08)',
            border: `1px solid ${recording ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.12)'}`,
            color: recording ? '#fca5a5' : '#fff', fontSize: 13, cursor: recording ? 'not-allowed' : 'pointer',
          }}>
            {recording ? '⏺ Recording…' : '⏺ Record & Export'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Video player */}
        <div style={{ flexShrink: 0 }}>
          {/* Stories progress */}
          <div style={{ marginBottom: 8 }}>
            <StoriesProgress total={scenes.length} current={currentScene} accentColor={currentPal.accent} />
          </div>

          <div ref={videoRef} style={{
            width: previewW, height: previewH, borderRadius: 14, overflow: 'hidden',
            position: 'relative', background: '#000',
            boxShadow: `0 0 0 1px rgba(255,255,255,0.08), 0 24px 80px rgba(0,0,0,0.7), 0 0 60px ${currentPal.accent}18`,
          }}>
            <AnimatePresence mode="wait">
              {scene && <SceneView key={scene.id} scene={scene} isShort={isShort} />}
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 14 }}>
            <button onClick={() => { setCurrentScene(Math.max(0, currentScene - 1)); setPlaying(false); }} style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>‹</button>
            <button onClick={togglePlay} style={{
              width: 52, height: 52, borderRadius: '50%',
              background: currentPal.accent, border: 'none',
              color: currentPal.highlightText, fontSize: 22, cursor: 'pointer', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 20px ${currentPal.accent}55`,
            }}>{playing ? '⏸' : '▶'}</button>
            <button onClick={() => { setCurrentScene(Math.min(scenes.length - 1, currentScene + 1)); setPlaying(false); }} style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>›</button>
          </div>

          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
            {currentScene + 1} / {scenes.length}
          </div>
        </div>

        {/* Scene list */}
        <div style={{ flex: 1, minWidth: 0, maxHeight: previewH + 60, overflowY: 'auto' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Slides</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {scenes.map((sc, i) => {
              const pal = PALETTES[sc.palette] ?? PALETTES.dark;
              const isActive = currentScene === i;
              return (
                <button key={sc.id} onClick={() => { setCurrentScene(i); setPlaying(false); if (timerRef.current) clearTimeout(timerRef.current); }} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 9,
                  textAlign: 'left', width: '100%', cursor: 'pointer', transition: 'all 0.15s',
                  background: isActive ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isActive ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)'}`,
                  borderLeft: `3px solid ${isActive ? pal.accent : 'transparent'}`,
                }}>
                  {/* Palette swatch + scene number */}
                  <div style={{
                    width: 32, height: 32, borderRadius: 7, flexShrink: 0,
                    background: pal.bg, border: `1px solid ${pal.accent}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, color: pal.accent,
                  }}>
                    {sc.emoji || i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12, fontWeight: 600, marginBottom: 2,
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {sc.headline}
                    </div>
                    <div style={{ display: 'flex', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>
                      <span style={{ color: pal.accent + 'cc', fontWeight: 600 }}>{sc.palette}</span>
                      <span>·</span>
                      <span>{sc.animStyle}</span>
                      <span>·</span>
                      <span>{(sc.duration / 1000).toFixed(1)}s</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
