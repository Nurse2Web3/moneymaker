import { useState } from 'react';

interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
}

interface VideoAnalysis {
  title: string;
  hookType: string;
  hookScore: number;
  hookText: string;
  hookBreakdown: string;
  structure: { section: string; timestamp: string; description: string; technique: string }[];
  tensionTechniques: { technique: string; where: string; effectiveness: string }[];
  retentionMoments: { moment: string; why: string; timestamp: string }[];
  weakPoints: { issue: string; timestamp: string; fix: string }[];
  stealableFormula: string;
  titleSuggestions: string[];
  overallScore: number;
  scoreBreakdown: { category: string; score: number; note: string }[];
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${score * 10}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize: '13px', fontWeight: 700, color, minWidth: '28px' }}>{score}/10</span>
    </div>
  );
}

export default function VideoAnalyzer() {
  const [url, setUrl] = useState('');
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  async function analyze() {
    if (!url.trim()) return;
    setError('');
    setAnalysis(null);
    setTranscript([]);
    setLoading(true);
    try {
      const res = await fetch('/api/tools/analyze-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data.analysis);
      setTranscript(data.transcript || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Analysis failed. Make sure the video has captions enabled.');
    } finally {
      setLoading(false);
    }
  }

  function copyTitle(t: string, i: number) {
    navigator.clipboard.writeText(t).catch(() => {});
    setCopiedIdx(i);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  const scoreColor = (s: number) => s >= 8 ? '#22c55e' : s >= 6 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Video Analyzer</h1>
      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '28px' }}>Paste any YouTube URL — AI pulls the transcript and breaks down exactly what makes it work (or not)</p>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && analyze()}
          placeholder="https://youtube.com/watch?v=... or paste a video ID"
          style={{ flex: 1, background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }}
        />
        <button onClick={analyze} disabled={!url.trim() || loading} style={{
          padding: '12px 22px', borderRadius: '10px', fontWeight: 600, fontSize: '14px', border: 'none', whiteSpace: 'nowrap',
          background: url.trim() && !loading ? '#fff' : '#1a1a1a',
          color: url.trim() && !loading ? '#000' : 'rgba(255,255,255,0.3)',
          cursor: url.trim() && !loading ? 'pointer' : 'not-allowed',
        }}>
          {loading ? 'Analyzing...' : '▶ Analyze Video'}
        </button>
      </div>

      {error && (
        <div style={{ background: '#ff4d4d15', border: '1px solid #ff4d4d30', borderRadius: '8px', padding: '12px 16px', color: '#ff4d4d', fontSize: '14px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 24px', gap: '16px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
          <div style={{ fontSize: '36px' }}>📡</div>
          <p style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>Fetching transcript + running deep analysis...</p>
          <p style={{ fontSize: '12px' }}>This takes 20–40 seconds</p>
        </div>
      )}

      {analysis && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Overall Score */}
          <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '24px', display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `conic-gradient(${scoreColor(analysis.overallScore)} ${analysis.overallScore * 36}deg, rgba(255,255,255,0.08) 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: scoreColor(analysis.overallScore) }}>{analysis.overallScore}</span>
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em' }}>/ 10</span>
                </div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>Script Quality Score</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {analysis.scoreBreakdown.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', width: '100px', flexShrink: 0 }}>{s.category}</span>
                    <ScoreBar score={s.score} color={scoreColor(s.score)} />
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', minWidth: '120px' }}>{s.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hook Analysis */}
          <div style={{ background: '#111', border: '1px solid rgba(167,139,250,0.2)', borderRadius: '14px', padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#a78bfa' }}>🎣 Hook Analysis</span>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '20px', background: scoreColor(analysis.hookScore) + '20', color: scoreColor(analysis.hookScore), border: `1px solid ${scoreColor(analysis.hookScore)}40` }}>{analysis.hookType} — {analysis.hookScore}/10</span>
            </div>
            <blockquote style={{ borderLeft: '3px solid #a78bfa', paddingLeft: '14px', margin: '0 0 12px', fontSize: '14px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, fontStyle: 'italic' }}>
              "{analysis.hookText}"
            </blockquote>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>{analysis.hookBreakdown}</p>
          </div>

          {/* Script Structure */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#60a5fa', marginBottom: '12px' }}>📐 Script Structure</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {analysis.structure.map((s, i) => (
                <div key={i} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}>{s.timestamp}</span>
                    <div style={{ width: '1px', flex: 1, background: 'rgba(255,255,255,0.06)', minHeight: '8px' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{s.section}</span>
                      {s.technique && <span style={{ fontSize: '10px', color: '#a78bfa', background: 'rgba(167,139,250,0.1)', padding: '1px 8px', borderRadius: '4px' }}>{s.technique}</span>}
                    </div>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.5 }}>{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tension Techniques */}
          {analysis.tensionTechniques.length > 0 && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#f59e0b', marginBottom: '12px' }}>⚡ Tension Engine Techniques Used</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px' }}>
                {analysis.tensionTechniques.map((t, i) => (
                  <div key={i} style={{ background: '#111', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#f59e0b' }}>{t.technique}</span>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>{t.where}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.5 }}>{t.effectiveness}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Retention Moments + Weak Points */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#22c55e', marginBottom: '10px' }}>🔒 High-Retention Moments</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {analysis.retentionMoments.map((m, i) => (
                  <div key={i} style={{ background: '#111', border: '1px solid rgba(34,197,94,0.12)', borderRadius: '10px', padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '10px', color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>{m.timestamp}</span>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: '#fff' }}>{m.moment}</span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.4 }}>{m.why}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#ef4444', marginBottom: '10px' }}>⚠️ Weak Points</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {analysis.weakPoints.map((w, i) => (
                  <div key={i} style={{ background: '#111', border: '1px solid rgba(239,68,68,0.12)', borderRadius: '10px', padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '10px', color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>{w.timestamp}</span>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: '#fff' }}>{w.issue}</span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0, lineHeight: 1.4 }}>Fix: {w.fix}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stealable Formula */}
          <div style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.08) 0%, rgba(96,165,250,0.08) 100%)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: '14px', padding: '20px 24px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#a78bfa', marginBottom: '10px' }}>🔓 The Stealable Formula</div>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, margin: 0 }}>{analysis.stealableFormula}</p>
          </div>

          {/* Title Suggestions based on same formula */}
          {analysis.titleSuggestions.length > 0 && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#34d399', marginBottom: '12px' }}>✏️ Titles You Could Make Using This Formula</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {analysis.titleSuggestions.map((t, i) => (
                  <div key={i} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <span style={{ fontSize: '14px', color: '#fff', lineHeight: 1.4 }}>{t}</span>
                    <button onClick={() => copyTitle(t, i)} style={{ flexShrink: 0, padding: '5px 12px', borderRadius: '6px', fontSize: '11px', background: copiedIdx === i ? '#22c55e20' : 'rgba(255,255,255,0.07)', color: copiedIdx === i ? '#22c55e' : 'rgba(255,255,255,0.4)', border: `1px solid ${copiedIdx === i ? '#22c55e40' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer' }}>
                      {copiedIdx === i ? '✓' : 'Copy'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw Transcript toggle */}
          {transcript.length > 0 && (
            <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden' }}>
              <button onClick={() => setShowTranscript(s => !s)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                <span>📄 Raw Transcript ({transcript.length} segments)</span>
                <span>{showTranscript ? '▲' : '▼'}</span>
              </button>
              {showTranscript && (
                <div style={{ padding: '0 20px 20px', maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {transcript.map((seg, i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', minWidth: '36px', paddingTop: '2px', fontFamily: 'monospace' }}>{formatTime(seg.offset)}</span>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{seg.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
