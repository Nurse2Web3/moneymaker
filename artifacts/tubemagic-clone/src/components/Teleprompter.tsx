import { useState, useEffect, useRef, useCallback } from 'react';

export default function Teleprompter() {
  const [script, setScript] = useState('');
  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(3);
  const [fontSize, setFontSize] = useState(36);
  const [mirror, setMirror] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<number>(0);

  const scrollPx = speed * 0.4;

  const tick = useCallback((time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const delta = time - lastTimeRef.current;
    lastTimeRef.current = time;

    if (scrollRef.current) {
      scrollRef.current.scrollTop += (scrollPx * delta) / 16;
      const el = scrollRef.current;
      const max = el.scrollHeight - el.clientHeight;
      const pct = max > 0 ? Math.min((el.scrollTop / max) * 100, 100) : 0;
      setProgress(pct);
      if (pct >= 100) { setPlaying(false); return; }
    }

    setElapsed(Math.floor((time - startRef.current) / 1000));
    animRef.current = requestAnimationFrame(tick);
  }, [scrollPx]);

  useEffect(() => {
    if (playing) {
      if (!startRef.current) startRef.current = performance.now();
      lastTimeRef.current = 0;
      animRef.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(animRef.current);
      lastTimeRef.current = 0;
    }
    return () => cancelAnimationFrame(animRef.current);
  }, [playing, tick]);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
      setCameraError('');
    } catch {
      setCameraError('Camera access denied.');
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  function toggleCamera() {
    cameraOn ? stopCamera() : startCamera();
  }

  function beginCountdown() {
    setCountdown(3);
    let n = 3;
    const id = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(id);
        setCountdown(null);
        startRef.current = performance.now();
        setPlaying(true);
      } else {
        setCountdown(n);
      }
    }, 1000);
  }

  function launch() {
    if (!script.trim()) return;
    if (containerRef.current?.requestFullscreen) containerRef.current.requestFullscreen().catch(() => {});
    setActive(true);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setProgress(0);
    setElapsed(0);
    startRef.current = 0;
    setPlaying(false);
    setCountdown(null);
  }

  function exit() {
    setActive(false);
    setPlaying(false);
    cancelAnimationFrame(animRef.current);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }

  function reset() {
    setPlaying(false);
    cancelAnimationFrame(animRef.current);
    startRef.current = 0;
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setProgress(0);
    setElapsed(0);
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, '0')}`;
  }

  if (active) {
    return (
      <div ref={containerRef} style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 9999, display: 'flex', flexDirection: 'column', userSelect: 'none' }}>

        {/* Camera preview */}
        {cameraOn && (
          <video ref={videoRef} autoPlay muted playsInline style={{
            position: 'absolute', bottom: '90px', right: '24px', width: '200px', height: '150px',
            objectFit: 'cover', borderRadius: '12px', border: '2px solid rgba(255,255,255,0.2)',
            transform: mirror ? 'scaleX(-1)' : 'none', zIndex: 10,
          }} />
        )}

        {/* Progress bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'rgba(255,255,255,0.1)', zIndex: 10 }}>
          <div style={{ height: '100%', background: '#fff', width: `${progress}%`, transition: 'width 0.1s linear' }} />
        </div>

        {/* Countdown */}
        {countdown !== null && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', zIndex: 20 }}>
            <div style={{ fontSize: '120px', fontWeight: 800, color: '#fff', animation: 'pulse 0.9s ease' }}>{countdown}</div>
          </div>
        )}

        {/* Scroll area */}
        <div ref={scrollRef} style={{
          flex: 1, overflowY: 'hidden', padding: '60px 80px 120px',
          transform: mirror ? 'scaleX(-1)' : 'none',
        }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            {/* Top spacer so first word isn't at very top */}
            <div style={{ height: '40vh' }} />
            <div style={{
              fontSize: `${fontSize}px`, lineHeight: 1.5, color: '#fff', fontWeight: 500,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word', textAlign: 'center',
            }}>
              {script}
            </div>
            <div style={{ height: '80vh' }} />
          </div>
        </div>

        {/* Reading guide line */}
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', background: 'rgba(255,255,255,0.12)', pointerEvents: 'none' }} />

        {/* Controls bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px',
          background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', gap: '16px',
        }}>
          {/* Timer */}
          <div style={{ fontSize: '24px', fontWeight: 600, color: playing ? '#22c55e' : 'rgba(255,255,255,0.4)', minWidth: '60px', fontFamily: 'monospace' }}>
            {playing && <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', marginRight: '8px', animation: 'pulse 1s infinite' }} />}
            {formatTime(elapsed)}
          </div>

          {/* Center controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={reset} style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', fontSize: '17px', cursor: 'pointer' }}>↺ Reset</button>

            <button onClick={() => { playing ? setPlaying(false) : (countdown === null ? beginCountdown() : null); }}
              style={{ width: '56px', height: '56px', borderRadius: '50%', background: playing ? 'rgba(239,68,68,0.2)' : '#fff', border: playing ? '2px solid #ef4444' : 'none', color: playing ? '#ef4444' : '#000', fontSize: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              {playing ? '⏸' : '▶'}
            </button>

            <button onClick={toggleCamera} style={{ padding: '8px 14px', borderRadius: '8px', background: cameraOn ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)', border: `1px solid ${cameraOn ? 'rgba(34,197,94,0.4)' : 'transparent'}`, color: cameraOn ? '#22c55e' : 'rgba(255,255,255,0.6)', fontSize: '17px', cursor: 'pointer' }}>
              {cameraOn ? '📷 On' : '📷 Off'}
            </button>
          </div>

          {/* Speed + Font + Mirror + Exit */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '17px', color: 'rgba(255,255,255,0.4)' }}>Speed</span>
              <button onClick={() => setSpeed(s => Math.max(1, s - 1))} style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <span style={{ fontSize: '17px', fontWeight: 600, color: '#fff', minWidth: '16px', textAlign: 'center' }}>{speed}</span>
              <button onClick={() => setSpeed(s => Math.min(10, s + 1))} style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '17px', color: 'rgba(255,255,255,0.4)' }}>Text</span>
              <button onClick={() => setFontSize(s => Math.max(20, s - 4))} style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>A</button>
              <button onClick={() => setFontSize(s => Math.min(72, s + 4))} style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>A</button>
            </div>

            <button onClick={() => setMirror(m => !m)} style={{ padding: '6px 12px', borderRadius: '8px', background: mirror ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.08)', border: `1px solid ${mirror ? 'rgba(167,139,250,0.4)' : 'transparent'}`, color: mirror ? '#a78bfa' : 'rgba(255,255,255,0.5)', fontSize: '24px', cursor: 'pointer' }}>⟺ Mirror</button>

            <button onClick={exit} style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '17px', cursor: 'pointer' }}>✕ Exit</button>
          </div>
        </div>

        {cameraError && <div style={{ position: 'absolute', bottom: '90px', right: '24px', background: '#ff4d4d20', border: '1px solid #ff4d4d40', borderRadius: '8px', padding: '8px 14px', color: '#ff4d4d', fontSize: '24px' }}>{cameraError}</div>}

        <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.3} }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Teleprompter</h1>
      <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.45)', marginBottom: '28px' }}>Paste your script, hit Launch — full-screen auto-scroll while you record</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '20px', alignItems: 'start' }}>
        {/* Script input */}
        <div>
          <textarea
            value={script}
            onChange={e => setScript(e.target.value)}
            placeholder="Paste your script here — or generate one with Script Writer and copy it over..."
            rows={22}
            style={{ width: '100%', background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', color: '#fff', fontSize: '24px', lineHeight: 1.7, resize: 'vertical', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
            <span style={{ fontSize: '17px', color: 'rgba(255,255,255,0.25)' }}>{script.split(/\s+/).filter(Boolean).length} words · ~{Math.ceil(script.split(/\s+/).filter(Boolean).length / 130)} min read</span>
            {script && <button onClick={() => setScript('')} style={{ fontSize: '17px', color: 'rgba(255,255,255,0.25)', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>}
          </div>
        </div>

        {/* Settings sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '17px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Scroll Speed</label>
              <input type="range" min={1} max={10} value={speed} onChange={e => setSpeed(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#fff' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '17px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
                <span>Slow</span><span style={{ color: '#fff', fontWeight: 600 }}>{speed}</span><span>Fast</span>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '17px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Font Size: {fontSize}px</label>
              <input type="range" min={20} max={72} step={4} value={fontSize} onChange={e => setFontSize(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#fff' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '24px', color: 'rgba(255,255,255,0.6)' }}>Mirror text</span>
              <button onClick={() => setMirror(m => !m)} style={{
                width: '36px', height: '20px', borderRadius: '10px', border: 'none', cursor: 'pointer', position: 'relative',
                background: mirror ? '#a78bfa' : 'rgba(255,255,255,0.15)',
                transition: 'background 0.2s',
              }}>
                <div style={{ position: 'absolute', top: '2px', left: mirror ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '24px', color: 'rgba(255,255,255,0.6)' }}>Camera preview</span>
              <button onClick={toggleCamera} style={{
                width: '36px', height: '20px', borderRadius: '10px', border: 'none', cursor: 'pointer', position: 'relative',
                background: cameraOn ? '#22c55e' : 'rgba(255,255,255,0.15)',
                transition: 'background 0.2s',
              }}>
                <div style={{ position: 'absolute', top: '2px', left: cameraOn ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </button>
            </div>
            {cameraError && <div style={{ fontSize: '17px', color: '#f87171' }}>{cameraError}</div>}
          </div>

          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px', fontSize: '24px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Tips</div>
            <div>• Use Speed 2–4 for natural-sounding delivery</div>
            <div>• Enable Mirror if recording from a laptop with the screen visible in frame</div>
            <div>• 3-second countdown before scroll starts</div>
            <div>• Spacebar to pause/resume after launch</div>
          </div>

          <button onClick={launch} disabled={!script.trim()} style={{
            padding: '14px', borderRadius: '12px', fontWeight: 700, fontSize: '24px', border: 'none',
            background: script.trim() ? '#fff' : '#1a1a1a',
            color: script.trim() ? '#000' : 'rgba(255,255,255,0.2)',
            cursor: script.trim() ? 'pointer' : 'not-allowed',
          }}>
            🎬 Launch
          </button>
        </div>
      </div>
    </div>
  );
}
