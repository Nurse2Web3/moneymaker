import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoScene {
  id: number;
  duration: number;
  text: string;
  subtext: string;
  mood: string;
  bgColor: string;
  accentColor: string;
  character: { action: string; position: string };
  visualElement: string;
  transition: string;
}

// ─── SVG Characters ────────────────────────────────────────────────────────────
function StickFigure({ action, color = '#fff', scale = 1 }: { action: string; color?: string; scale?: number }) {
  const s = (n: number) => n * scale;

  const bodyParts = {
    head: <circle cx={s(50)} cy={s(18)} r={s(12)} stroke={color} strokeWidth={s(2.5)} fill="none" />,
    body: <line x1={s(50)} y1={s(30)} x2={s(50)} y2={s(68)} stroke={color} strokeWidth={s(2.5)} strokeLinecap="round" />,
  };

  const arms: Record<string, JSX.Element> = {
    idle: <><line x1={s(50)} y1={s(38)} x2={s(30)} y2={s(55)} stroke={color} strokeWidth={s(2.5)} strokeLinecap="round" /><line x1={s(50)} y1={s(38)} x2={s(70)} y2={s(55)} stroke={color} strokeWidth={s(2.5)} strokeLinecap="round" /></>,
    talk: <><line x1={s(50)} y1={s(38)} x2={s(28)} y2={s(48)} stroke={color} strokeWidth={s(2.5)} strokeLinecap="round" /><line x1={s(50)} y1={s(38)} x2={s(72)} y2={s(45)} stroke={color} strokeWidth={s(2.5)} strokeLinecap="round" /></>,
    excited: <><line x1={s(50)} y1={s(38)} x2={s(22)} y2={s(26)} stroke={color} strokeWidth={s(2.5)} strokeLinecap="round" /><line x1={s(50)} y1={s(38)} x2={s(78)} y2={s(26)} stroke={color} strokeWidth={s(2.5)} strokeLinecap="round" /></>,
    raise_hands: <><line x1={s(50)} y1={s(38)} x2={s(20)} y2={s(20)} stroke={color} strokeWidth={s(2.5)} strokeLinecap="round" /><line x1={s(50)} y1={s(38)} x2={s(80)} y2={s(20)} stroke={color} strokeWidth={s(2.5)} strokeLinecap="round" /></>,
    think: <><line x1={s(50)} y1={s(38)} x2={s(30)} y2={s(52)} stroke={color} strokeWidth={s(2.5)} strokeLinecap="round" /><line x1={s(50)} y1={s(38)} x2={s(65)} y2={s(32)} stroke={color} strokeWidth={s(2.5)} strokeLinecap="round" /></>,
    point: <><line x1={s(50)} y1={s(38)} x2={s(28)} y2={s(52)} stroke={color} strokeWidth={s(2.5)} strokeLinecap="round" /><line x1={s(50)} y1={s(38)} x2={s(80)} y2={s(32)} stroke={color} strokeWidth={s(2.5)} strokeLinecap="round" /></>,
    jump: <><line x1={s(50)} y1={s(38)} x2={s(20)} y2={s(28)} stroke={color} strokeWidth={s(2.5)} strokeLinecap="round" /><line x1={s(50)} y1={s(38)} x2={s(80)} y2={s(28)} stroke={color} strokeWidth={s(2.5)} strokeLinecap="round" /></>,
    shrug: <><line x1={s(50)} y1={s(38)} x2={s(26)} y2={s(36)} stroke={color} strokeWidth={s(2.5)} strokeLinecap="round" /><line x1={s(50)} y1={s(38)} x2={s(74)} y2={s(36)} stroke={color} strokeWidth={s(2.5)} strokeLinecap="round" /></>,
    nod: <><line x1={s(50)} y1={s(38)} x2={s(30)} y2={s(50)} stroke={color} strokeWidth={s(2.5)} strokeLinecap="round" /><line x1={s(50)} y1={s(38)} x2={s(70)} y2={s(50)} stroke={color} strokeWidth={s(2.5)} strokeLinecap="round" /></>,
    walk: <><line x1={s(50)} y1={s(38)} x2={s(30)} y2={s(50)} stroke={color} strokeWidth={s(2.5)} strokeLinecap="round" /><line x1={s(50)} y1={s(38)} x2={s(72)} y2={s(45)} stroke={color} strokeWidth={s(2.5)} strokeLinecap="round" /></>,
  };

  const legs: Record<string, JSX.Element> = {
    idle: <><line x1={s(50)} y1={s(68)} x2={s(34)} y2={s(92)} stroke={color} strokeWidth={s(2.5)} strokeLinecap="round" /><line x1={s(50)} y1={s(68)} x2={s(66)} y2={s(92)} stroke={color} strokeWidth={s(2.5)} strokeLinecap="round" /></>,
    jump: <><line x1={s(50)} y1={s(68)} x2={s(30)} y2={s(88)} stroke={color} strokeWidth={s(2.5)} strokeLinecap="round" /><line x1={s(50)} y1={s(68)} x2={s(70)} y2={s(88)} stroke={color} strokeWidth={s(2.5)} strokeLinecap="round" /></>,
    walk: <><line x1={s(50)} y1={s(68)} x2={s(36)} y2={s(90)} stroke={color} strokeWidth={s(2.5)} strokeLinecap="round" /><line x1={s(50)} y1={s(68)} x2={s(62)} y2={s(92)} stroke={color} strokeWidth={s(2.5)} strokeLinecap="round" /></>,
    excited: <><line x1={s(50)} y1={s(68)} x2={s(32)} y2={s(90)} stroke={color} strokeWidth={s(2.5)} strokeLinecap="round" /><line x1={s(50)} y1={s(68)} x2={s(68)} y2={s(90)} stroke={color} strokeWidth={s(2.5)} strokeLinecap="round" /></>,
  };

  const armEl = arms[action] ?? arms.idle;
  const legEl = legs[action] ?? legs.idle;

  const motionProps: Record<string, object> = {
    excited: { animate: { y: [0, -8, 0], rotate: [-3, 3, -3] }, transition: { duration: 0.5, repeat: Infinity } },
    raise_hands: { animate: { y: [0, -4, 0] }, transition: { duration: 0.8, repeat: Infinity } },
    talk: { animate: { rotate: [-1, 1, -1] }, transition: { duration: 0.6, repeat: Infinity } },
    jump: { animate: { y: [0, -20, 0] }, transition: { duration: 0.6, repeat: Infinity } },
    nod: { animate: { rotate: [-2, 2, -2] }, transition: { duration: 0.5, repeat: Infinity } },
    walk: { animate: { x: [-3, 3, -3] }, transition: { duration: 0.7, repeat: Infinity } },
    think: { animate: { y: [0, -2, 0] }, transition: { duration: 1.2, repeat: Infinity } },
  };

  const mp = motionProps[action] ?? {};

  return (
    <motion.svg width={s(100)} height={s(100)} viewBox="0 0 100 100" {...mp}>
      {bodyParts.head}
      {bodyParts.body}
      {armEl}
      {legEl}
    </motion.svg>
  );
}

// ─── Visual Elements ───────────────────────────────────────────────────────────
function VisualElement({ type, color }: { type: string; color: string }) {
  if (type === 'none') return null;

  const els: Record<string, JSX.Element> = {
    chart_up: (
      <svg width="80" height="60" viewBox="0 0 80 60">
        <motion.polyline points="0,50 20,40 40,25 60,10 80,5" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: 'easeOut' }} />
        <motion.circle cx="80" cy="5" r="4" fill={color} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.1 }} />
      </svg>
    ),
    chart_down: (
      <svg width="80" height="60" viewBox="0 0 80 60">
        <motion.polyline points="0,10 20,20 40,35 60,48 80,55" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: 'easeOut' }} />
      </svg>
    ),
    explosion: (
      <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 1] }} transition={{ duration: 0.5 }}>
        <svg width="70" height="70" viewBox="0 0 70 70">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <motion.line key={i} x1="35" y1="35"
              x2={35 + 28 * Math.cos((angle * Math.PI) / 180)}
              y2={35 + 28 * Math.sin((angle * Math.PI) / 180)}
              stroke={color} strokeWidth="3" strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: i * 0.05 }} />
          ))}
          <circle cx="35" cy="35" r="8" fill={color} />
        </svg>
      </motion.div>
    ),
    lightning: (
      <motion.svg width="50" height="80" viewBox="0 0 50 80" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
        <motion.polyline points="30,0 15,40 28,40 10,80" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} />
      </motion.svg>
    ),
    stars: (
      <div style={{ position: 'relative', width: 80, height: 60 }}>
        {[{ x: 10, y: 30, s: 1.2 }, { x: 40, y: 10, s: 1.6 }, { x: 70, y: 35, s: 1 }, { x: 25, y: 55, s: 0.8 }, { x: 60, y: 55, s: 1.1 }].map((star, i) => (
          <motion.div key={i} style={{ position: 'absolute', left: star.x, top: star.y, fontSize: 18 * star.s, color }}
            initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.12, type: 'spring' }}>★</motion.div>
        ))}
      </div>
    ),
    money: (
      <motion.div style={{ fontSize: 48, filter: 'drop-shadow(0 0 12px rgba(34,197,94,0.6))' }}
        animate={{ y: [0, -8, 0], rotate: [-5, 5, -5] }} transition={{ duration: 1.5, repeat: Infinity }}>
        💰
      </motion.div>
    ),
    brain: (
      <motion.div style={{ fontSize: 48 }}
        animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
        🧠
      </motion.div>
    ),
    fire: (
      <motion.div style={{ fontSize: 48 }}
        animate={{ scale: [1, 1.15, 1], rotate: [-3, 3, -3] }} transition={{ duration: 0.6, repeat: Infinity }}>
        🔥
      </motion.div>
    ),
    clock: (
      <svg width="60" height="60" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="26" stroke={color} strokeWidth="2.5" fill="none" />
        <motion.line x1="30" y1="30" x2="30" y2="10" stroke={color} strokeWidth="2.5" strokeLinecap="round"
          animate={{ rotate: 360 }} transition={{ duration: 5, repeat: Infinity, ease: 'linear' }} style={{ originX: '30px', originY: '30px' }} />
        <motion.line x1="30" y1="30" x2="44" y2="30" stroke={color} strokeWidth="2" strokeLinecap="round"
          animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }} style={{ originX: '30px', originY: '30px' }} />
      </svg>
    ),
    checkmark: (
      <svg width="60" height="60" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="26" stroke={color} strokeWidth="2.5" fill="none" />
        <motion.polyline points="16,30 26,42 46,18" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: 0.2 }} />
      </svg>
    ),
    question_mark: (
      <motion.div style={{ fontSize: 64, fontWeight: 900, color, lineHeight: 1 }}
        animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>?</motion.div>
    ),
    arrow_up: (
      <svg width="50" height="70" viewBox="0 0 50 70">
        <motion.path d="M25,5 L5,30 L18,30 L18,65 L32,65 L32,30 L45,30 Z" fill={color}
          initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 300 }} />
      </svg>
    ),
    shield: (
      <svg width="60" height="70" viewBox="0 0 60 70">
        <motion.path d="M30,2 L55,12 L55,35 C55,50 42,62 30,68 C18,62 5,50 5,35 L5,12 Z" fill="none" stroke={color} strokeWidth="2.5"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} />
      </svg>
    ),
    target: (
      <svg width="70" height="70" viewBox="0 0 70 70">
        {[30, 20, 10].map((r, i) => (
          <motion.circle key={i} cx="35" cy="35" r={r} fill="none" stroke={color} strokeWidth="2"
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.15, type: 'spring' }} />
        ))}
        <motion.circle cx="35" cy="35" r="5" fill={color} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.45, type: 'spring' }} />
      </svg>
    ),
  };

  return els[type] ?? null;
}

// ─── Scene Renderer ────────────────────────────────────────────────────────────
function SceneView({ scene, isShort }: { scene: VideoScene; isShort: boolean }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    setPhase(0);
    const t1 = setTimeout(() => setPhase(1), 150);
    const t2 = setTimeout(() => setPhase(2), 600);
    const t3 = setTimeout(() => setPhase(3), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [scene.id]);

  const charPosition = scene.character.position === 'left' ? '8%' : scene.character.position === 'right' ? 'auto' : '50%';
  const charRight = scene.character.position === 'right' ? '8%' : 'auto';
  const charTranslateX = scene.character.position === 'center' ? '-50%' : '0';

  const moodGradients: Record<string, string> = {
    energetic: `linear-gradient(135deg, ${scene.bgColor}dd 0%, #1a0a2e 100%)`,
    dramatic: `linear-gradient(160deg, #0a0a0a 0%, ${scene.bgColor}88 100%)`,
    calm: `linear-gradient(120deg, #0d1b2a 0%, ${scene.bgColor}99 100%)`,
    intense: `linear-gradient(145deg, ${scene.bgColor}cc 0%, #1a0505 100%)`,
    inspiring: `linear-gradient(130deg, #0a1628 0%, ${scene.bgColor}bb 100%)`,
    curious: `linear-gradient(150deg, #0f1117 0%, ${scene.bgColor}aa 100%)`,
    dark: `linear-gradient(135deg, #050505 0%, ${scene.bgColor}66 100%)`,
    triumphant: `linear-gradient(140deg, ${scene.bgColor}bb 0%, #1a1a0a 100%)`,
  };

  const transitionVariants: Record<string, object> = {
    slide_up: { initial: { y: '100%', opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: '-100%', opacity: 0 } },
    zoom_in: { initial: { scale: 0.7, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 1.3, opacity: 0 } },
    fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
    wipe_left: { initial: { x: '100%', opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: '-100%', opacity: 0 } },
    clip_circle: { initial: { clipPath: 'circle(0% at 50% 50%)', opacity: 0 }, animate: { clipPath: 'circle(100% at 50% 50%)', opacity: 1 }, exit: { clipPath: 'circle(0% at 50% 50%)', opacity: 0 } },
  };

  const tv = transitionVariants[scene.transition] ?? transitionVariants.fade;

  const charScale = isShort ? 2.2 : 1.8;

  return (
    <motion.div
      key={scene.id}
      style={{ position: 'absolute', inset: 0, background: moodGradients[scene.mood] ?? moodGradients.calm, overflow: 'hidden' }}
      initial={tv.initial as object}
      animate={tv.animate as object}
      exit={tv.exit as object}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Floating background orbs */}
      <motion.div style={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        background: `radial-gradient(circle, ${scene.accentColor}22, transparent)`,
        top: '-10%', right: '-5%', filter: 'blur(40px)',
      }} animate={{ scale: [1, 1.2, 1], x: [0, 20, 0] }} transition={{ duration: 6, repeat: Infinity }} />
      <motion.div style={{
        position: 'absolute', width: 200, height: 200, borderRadius: '50%',
        background: `radial-gradient(circle, ${scene.bgColor}33, transparent)`,
        bottom: '5%', left: '5%', filter: 'blur(30px)',
      }} animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 8, repeat: Infinity, delay: 1 }} />

      {/* Accent line */}
      <motion.div style={{
        position: 'absolute', top: isShort ? '12%' : '15%', left: isShort ? '6%' : '8%',
        height: 3, background: scene.accentColor, borderRadius: 2,
      }}
        initial={{ width: 0 }} animate={{ width: phase >= 1 ? (isShort ? '88%' : '84%') : 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} />

      {/* Character */}
      <motion.div style={{
        position: 'absolute', bottom: isShort ? '12%' : '10%',
        left: charPosition, right: charRight,
        transform: `translateX(${charTranslateX})`,
        opacity: phase >= 1 ? 1 : 0,
        transition: 'opacity 0.3s',
      }}>
        <StickFigure action={scene.character.action} color={scene.accentColor} scale={charScale} />
      </motion.div>

      {/* Visual element */}
      {scene.visualElement !== 'none' && phase >= 2 && (
        <motion.div style={{
          position: 'absolute',
          top: '20%', right: isShort ? '6%' : '8%',
        }} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
          <VisualElement type={scene.visualElement} color={scene.accentColor} />
        </motion.div>
      )}

      {/* Main text */}
      <div style={{
        position: 'absolute',
        top: '50%', transform: 'translateY(-50%)',
        left: isShort ? '6%' : '8%',
        right: isShort ? '6%' : '8%',
        textAlign: scene.character.position === 'left' ? 'right' : scene.character.position === 'right' ? 'left' : 'center',
      }}>
        <motion.h2 style={{
          fontSize: isShort ? 'clamp(28px, 7vw, 52px)' : 'clamp(24px, 3.5vw, 52px)',
          fontWeight: 900, color: '#fff', lineHeight: 1.15,
          fontFamily: "'Inter', sans-serif",
          textShadow: `0 0 40px ${scene.accentColor}66`,
          letterSpacing: '-0.02em',
        }}
          initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
          animate={phase >= 2 ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 30, filter: 'blur(10px)' }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          {scene.text}
        </motion.h2>

        {scene.subtext && (
          <motion.p style={{
            fontSize: isShort ? 'clamp(14px, 3.5vw, 22px)' : 'clamp(13px, 1.6vw, 22px)',
            color: 'rgba(255,255,255,0.65)', marginTop: 12, lineHeight: 1.5,
            fontFamily: "'Inter', sans-serif",
          }}
            initial={{ opacity: 0, y: 15 }}
            animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
            transition={{ duration: 0.4 }}
          >
            {scene.subtext}
          </motion.p>
        )}
      </div>

      {/* Scene number badge */}
      <div style={{
        position: 'absolute', bottom: isShort ? '5%' : '4%', right: isShort ? '6%' : '8%',
        fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace',
      }}>
        {scene.id}/{scene.id}
      </div>
    </motion.div>
  );
}

// ─── Progress Bar ──────────────────────────────────────────────────────────────
function SceneProgressBar({ scenes, currentIdx, accentColor }: { scenes: VideoScene[]; currentIdx: number; accentColor: string }) {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '0 4px' }}>
      {scenes.map((_, i) => (
        <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= currentIdx ? accentColor : 'rgba(255,255,255,0.15)', transition: 'background 0.3s' }} />
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function VideoMaker() {
  const [script, setScript] = useState('');
  const [format, setFormat] = useState<'long' | 'short'>('long');
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

  // ── Generate scenes from AI ──
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

  // ── Playback ──
  const advanceScene = useCallback((idx: number, sceneList: VideoScene[]) => {
    if (idx >= sceneList.length) {
      setPlaying(false);
      setCurrentScene(0);
      return;
    }
    setCurrentScene(idx);
    timerRef.current = setTimeout(() => advanceScene(idx + 1, sceneList), sceneList[idx].duration);
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

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  // Stop playback timer when not playing
  useEffect(() => {
    if (!playing && timerRef.current) clearTimeout(timerRef.current);
  }, [playing]);

  // ── Recording (WebM via canvas capture) ──
  async function startRecording() {
    if (!videoRef.current) return;
    chunksRef.current = [];
    setRecordedChunks([]);
    setRecording(true);

    try {
      const stream = (videoRef.current as HTMLElement & { captureStream?: () => MediaStream }).captureStream?.();
      if (!stream) { alert('Screen capture not supported in this browser.'); setRecording(false); return; }

      const mr = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        setRecordedChunks([...chunksRef.current]);
        setRecording(false);
      };
      mr.start(100);

      // Auto-play through all scenes while recording
      setPlaying(true);
      setCurrentScene(0);
      let idx = 0;
      const playAndRecord = (i: number) => {
        if (i >= scenes.length) { mr.stop(); setPlaying(false); return; }
        setCurrentScene(i);
        timerRef.current = setTimeout(() => playAndRecord(i + 1), scenes[i].duration);
      };
      playAndRecord(idx);
      void idx;
    } catch {
      setRecording(false);
    }
  }

  function downloadRecording() {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moneymaker-video-${format}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalDuration = scenes.reduce((s, sc) => s + sc.duration, 0);
  const totalSec = Math.round(totalDuration / 1000);

  // ── Input step ──
  if (step === 'input') {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 8 }}>🎬 Script → Video</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>Paste your script and AI will turn it into an animated video — kinetic text, animated characters, scene transitions.</p>
        </div>

        {/* Format selector */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          {[
            { id: 'long', label: '▶ YouTube 16:9', desc: 'Landscape — up to 30 min' },
            { id: 'short', label: '↕ TikTok / Shorts 9:16', desc: 'Vertical — any length' },
          ].map(f => (
            <button key={f.id} onClick={() => setFormat(f.id as 'long' | 'short')} style={{
              flex: 1, padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
              background: format === f.id ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${format === f.id ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
              textAlign: 'left',
            }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: format === f.id ? '#fff' : 'rgba(255,255,255,0.6)', marginBottom: 3 }}>{f.label}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>{f.desc}</div>
            </button>
          ))}
        </div>

        {/* Script textarea */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your Script</label>
          <textarea
            value={script}
            onChange={e => setScript(e.target.value)}
            placeholder="Paste your script here — from the Script Writer, Script Improver, or write your own. The AI will break it into cinematic scenes with animated characters and kinetic text..."
            style={{
              width: '100%', minHeight: 280, padding: '16px', borderRadius: 10,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', fontSize: 15, lineHeight: 1.7, resize: 'vertical',
              fontFamily: 'inherit', outline: 'none',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>{script.trim().split(/\s+/).filter(Boolean).length} words</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Max 8,000 words per video</span>
          </div>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, color: '#fca5a5', fontSize: 14, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <button onClick={generate} disabled={loading || script.trim().length < 50} style={{
          width: '100%', padding: '15px', borderRadius: 10, fontSize: 16, fontWeight: 700,
          background: loading || script.trim().length < 50 ? 'rgba(255,255,255,0.1)' : '#fff',
          color: loading || script.trim().length < 50 ? 'rgba(255,255,255,0.3)' : '#000',
          border: 'none', cursor: loading || script.trim().length < 50 ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s',
        }}>
          {loading ? 'AI is building your video scenes…' : '✨ Generate Video'}
        </button>

        {loading && (
          <div style={{ marginTop: 20, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
            Analyzing script and crafting cinematic scenes…
          </div>
        )}
      </div>
    );
  }

  // ── Preview step ──
  const previewW = isShort ? 360 : 640;
  const previewH = isShort ? 640 : 360;
  const scene = scenes[currentScene];

  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 4 }}>🎬 Video Preview</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
            {scenes.length} scenes · {totalSec < 60 ? `${totalSec}s` : `${Math.floor(totalSec / 60)}m ${totalSec % 60}s`} total · {format === 'short' ? '9:16 Vertical' : '16:9 Landscape'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => { setStep('input'); setPlaying(false); if (timerRef.current) clearTimeout(timerRef.current); }} style={{
            padding: '8px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontSize: 14, cursor: 'pointer',
          }}>← Edit Script</button>
          {recordedChunks.length > 0 && (
            <button onClick={downloadRecording} style={{
              padding: '8px 16px', borderRadius: 8, background: '#22c55e',
              border: 'none', color: '#000', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>⬇ Download WebM</button>
          )}
          <button onClick={startRecording} disabled={recording} style={{
            padding: '8px 16px', borderRadius: 8,
            background: recording ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)',
            border: `1px solid ${recording ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.15)'}`,
            color: recording ? '#fca5a5' : '#fff', fontSize: 14, cursor: recording ? 'not-allowed' : 'pointer',
          }}>
            {recording ? '⏺ Recording…' : '⏺ Record & Export'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Video player */}
        <div style={{ flexShrink: 0 }}>
          <div ref={videoRef} style={{
            width: previewW, height: previewH, borderRadius: 12, overflow: 'hidden',
            position: 'relative', background: '#000',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 20px 60px rgba(0,0,0,0.6)',
          }}>
            <AnimatePresence mode="popLayout">
              {scene && <SceneView key={scene.id} scene={scene} isShort={isShort} />}
            </AnimatePresence>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 10 }}>
            <SceneProgressBar scenes={scenes} currentIdx={currentScene} accentColor={scene?.accentColor ?? '#fff'} />
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 14 }}>
            <button onClick={() => setCurrentScene(Math.max(0, currentScene - 1))} style={{
              width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 16, cursor: 'pointer',
            }}>‹</button>
            <button onClick={togglePlay} style={{
              width: 48, height: 48, borderRadius: '50%', background: '#fff',
              border: 'none', color: '#000', fontSize: 20, cursor: 'pointer', fontWeight: 700,
            }}>{playing ? '⏸' : '▶'}</button>
            <button onClick={() => setCurrentScene(Math.min(scenes.length - 1, currentScene + 1))} style={{
              width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 16, cursor: 'pointer',
            }}>›</button>
          </div>
          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
            Scene {currentScene + 1} of {scenes.length}
          </div>
        </div>

        {/* Scene list */}
        <div style={{ flex: 1, minWidth: 0, maxHeight: previewH + 60, overflowY: 'auto' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Scenes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {scenes.map((sc, i) => (
              <button key={sc.id} onClick={() => { setCurrentScene(i); setPlaying(false); if (timerRef.current) clearTimeout(timerRef.current); }} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', borderRadius: 8, textAlign: 'left',
                background: currentScene === i ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${currentScene === i ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)'}`,
                cursor: 'pointer', width: '100%', transition: 'all 0.15s',
              }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: sc.accentColor + '33', border: `1px solid ${sc.accentColor}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: sc.accentColor }}>{i + 1}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: currentScene === i ? '#fff' : 'rgba(255,255,255,0.7)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sc.text}
                  </div>
                  <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                    <span>{sc.character.action}</span>
                    <span>·</span>
                    <span>{sc.mood}</span>
                    <span>·</span>
                    <span>{(sc.duration / 1000).toFixed(1)}s</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
