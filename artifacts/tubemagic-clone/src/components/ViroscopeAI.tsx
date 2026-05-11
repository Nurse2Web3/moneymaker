import { useState, useRef } from 'react';

interface ViroscopeVideo {
  videoId: string;
  title: string;
  channel: string;
  channelId: string;
  publishedAt: string;
  thumbnail: string;
  viewCount: number;
  likeCount: number;
  channelAvg: number;
  channelSubs: number;
  channelVideoCount: number;
  ratio: number;
  isOutlier: boolean;
}

interface TitlePatternItem {
  pattern: string;
  description: string;
  avgRatio: number;
  examples: string[];
  template: string;
}

interface PatternAnalysis {
  patterns?: TitlePatternItem[];
  insights?: string[];
  avoidPatterns?: string[];
  suggestedTitles?: string[];
}

interface CompareChannel {
  name: string;
  avg: number;
  videos: { videoId: string; title: string; publishedAt: string; viewCount: string; likeCount: string; ratio: number }[];
}

interface Comparison {
  winner?: string;
  titleComparison?: { channel1Style: string; channel2Style: string; verdict: string };
  contentComparison?: { channel1Strengths: string[]; channel1Weaknesses: string[]; channel2Strengths: string[]; channel2Weaknesses: string[] };
  trendDirection?: { channel1: string; channel2: string };
  stealFromEach?: { fromChannel1: string; fromChannel2: string };
  recommendation?: string;
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function RatioBadge({ ratio, isOutlier, multiplier }: { ratio: number; isOutlier: boolean; multiplier: number }) {
  const color = isOutlier ? '#f59e0b' : ratio >= multiplier / 2 ? '#22c55e' : ratio >= 1 ? '#3b82f6' : '#6b7280';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 700,
      background: `${color}22`, color, border: `1px solid ${color}44`,
    }}>
      {isOutlier && '🔥 '}{ratio}x
    </span>
  );
}

export default function ViroscopeAI() {
  const [mode, setMode] = useState<'scan' | 'compare'>('scan');

  // Scan state
  const [keywords, setKeywords] = useState('');
  const [days, setDays] = useState(30);
  const [multiplier, setMultiplier] = useState(5);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState('');
  const [videos, setVideos] = useState<ViroscopeVideo[]>([]);
  const [outlierCount, setOutlierCount] = useState(0);
  const [analysis, setAnalysis] = useState<PatternAnalysis | null>(null);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  // Compare state
  const [ch1Url, setCh1Url] = useState('');
  const [ch2Url, setCh2Url] = useState('');
  const [comparing, setComparing] = useState(false);
  const [compareStatus, setCompareStatus] = useState('');
  const [compareChannels, setCompareChannels] = useState<{ channel1: any; channel2: any } | null>(null);
  const [compareVideos, setCompareVideos] = useState<{ channel1: CompareChannel; channel2: CompareChannel } | null>(null);
  const [comparison, setComparison] = useState<Comparison | null>(null);

  async function scan() {
    setError('');
    setVideos([]);
    setAnalysis(null);
    setOutlierCount(0);
    setScanning(true);
    setStatus('Starting scan…');

    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/tools/viroscope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords, days, multiplier }),
        signal: abortRef.current.signal,
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'status') setStatus(data.message);
            else if (data.type === 'videos') { setVideos(data.data); setOutlierCount(data.outlierCount); }
            else if (data.type === 'analysis') setAnalysis(data.data);
            else if (data.type === 'error') setError(data.message);
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') setError(err.message || 'Scan failed');
    } finally {
      setScanning(false);
      setStatus('');
    }
  }

  async function compare() {
    setCompareChannels(null);
    setCompareVideos(null);
    setComparison(null);
    setComparing(true);
    setCompareStatus('Starting comparison…');

    try {
      const res = await fetch('/api/tools/viroscope-compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelUrl1: ch1Url, channelUrl2: ch2Url }),
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'status') setCompareStatus(data.message);
            else if (data.type === 'channels') setCompareChannels(data.data);
            else if (data.type === 'videos') setCompareVideos(data.data);
            else if (data.type === 'comparison') setComparison(data.data);
            else if (data.type === 'error') setError(data.message);
          } catch {}
        }
      }
    } catch (err: any) {
      setError(err.message || 'Compare failed');
    } finally {
      setComparing(false);
      setCompareStatus('');
    }
  }

  const cardStyle: React.CSSProperties = {
    background: '#141414', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14, padding: 20, marginBottom: 16,
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)',
    letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 6,
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 15,
    background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.12)',
    color: '#fff', outline: 'none',
  };
  const btnPrimary: React.CSSProperties = {
    padding: '12px 28px', borderRadius: 10, fontSize: 15, fontWeight: 700,
    background: '#f59e0b', color: '#000', border: 'none', cursor: 'pointer',
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: 0 }}>
          🔬 ViroscopeAI
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, marginTop: 4 }}>
          Find viral outliers in any YouTube niche. See what's actually working — with data, not guesses.
        </p>
      </div>

      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#111', borderRadius: 10, padding: 3 }}>
        {(['scan', 'compare'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 14, fontWeight: 600,
            background: mode === m ? '#f59e0b22' : 'transparent',
            color: mode === m ? '#f59e0b' : 'rgba(255,255,255,0.5)',
            border: mode === m ? '1px solid #f59e0b44' : '1px solid transparent',
            cursor: 'pointer',
          }}>
            {m === 'scan' ? '🔍 Niche Scanner' : '⚔️ Channel Compare'}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ ...cardStyle, background: '#1a0000', borderColor: '#ef444466', color: '#ef4444', fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* ─── SCAN MODE ─── */}
      {mode === 'scan' && (
        <>
          <div style={cardStyle}>
            <div style={{ marginBottom: 14 }}>
              <div style={labelStyle}>Niche Keywords</div>
              <input
                style={inputStyle}
                placeholder="e.g., dark psychology machiavelli, crypto trading, fitness motivation"
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !scanning && keywords.trim() && scan()}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Timeframe</div>
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={days} onChange={e => setDays(Number(e.target.value))}>
                  <option value={7}>Last 7 days</option>
                  <option value={14}>Last 14 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 90 days</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Viral Threshold</div>
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={multiplier} onChange={e => setMultiplier(Number(e.target.value))}>
                  <option value={3}>3x channel avg</option>
                  <option value={5}>5x channel avg</option>
                  <option value={10}>10x channel avg</option>
                </select>
              </div>
            </div>
            <button
              onClick={scan}
              disabled={scanning || !keywords.trim()}
              style={{ ...btnPrimary, opacity: scanning || !keywords.trim() ? 0.5 : 1, width: '100%' }}
            >
              {scanning ? status || 'Scanning…' : '🔬 Scan Niche'}
            </button>
          </div>

          {/* Results */}
          {videos.length > 0 && (
            <>
              {/* Summary bar */}
              <div style={{ ...cardStyle, display: 'flex', gap: 24, padding: '14px 20px' }}>
                <div>
                  <div style={labelStyle}>Videos Found</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{videos.length}</div>
                </div>
                <div>
                  <div style={labelStyle}>Viral Outliers ({multiplier}x+)</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: outlierCount > 0 ? '#f59e0b' : '#6b7280' }}>
                    {outlierCount}
                  </div>
                </div>
                <div>
                  <div style={labelStyle}>Avg Ratio</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#3b82f6' }}>
                    {(videos.reduce((s, v) => s + v.ratio, 0) / videos.length).toFixed(1)}x
                  </div>
                </div>
              </div>

              {/* Video table */}
              <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>All Videos</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginLeft: 8 }}>sorted by ratio (highest first)</span>
                </div>
                <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                  {videos.map((v, i) => (
                    <div key={v.videoId} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: v.isOutlier ? 'rgba(245,158,11,0.05)' : 'transparent',
                    }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', width: 24, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                      <img src={v.thumbnail} alt="" style={{ width: 80, height: 45, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <a
                          href={`https://youtube.com/watch?v=${v.videoId}`}
                          target="_blank"
                          rel="noopener"
                          style={{ fontSize: 13, fontWeight: 600, color: '#fff', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {v.title}
                        </a>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                          {v.channel} · {formatNum(v.channelSubs)} subs · avg {formatNum(v.channelAvg)}/video
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{formatNum(v.viewCount)}</div>
                        <div style={{ marginTop: 2 }}><RatioBadge ratio={v.ratio} isOutlier={v.isOutlier} multiplier={multiplier} /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Pattern Analysis */}
          {analysis && (
            <>
              {analysis.patterns && analysis.patterns.length > 0 && (
                <div style={cardStyle}>
                  <div style={{ ...labelStyle, marginBottom: 14, color: '#f59e0b' }}>Title Patterns That Work</div>
                  {analysis.patterns.map((p, i) => (
                    <div key={i} style={{
                      padding: '14px 16px', borderRadius: 10, marginBottom: 8,
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{p.pattern}</span>
                        {p.avgRatio > 0 && <RatioBadge ratio={p.avgRatio} isOutlier={p.avgRatio >= multiplier} multiplier={multiplier} />}
                      </div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>{p.description}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>Template:</div>
                      <div style={{ fontSize: 13, color: '#f59e0b', fontStyle: 'italic', marginBottom: 6 }}>{p.template}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                        Examples: {p.examples.map((e, j) => <span key={j} style={{ color: 'rgba(255,255,255,0.5)' }}>{j > 0 ? ' · ' : ''}{e}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {analysis.insights && analysis.insights.length > 0 && (
                <div style={cardStyle}>
                  <div style={{ ...labelStyle, marginBottom: 10, color: '#22c55e' }}>Key Insights</div>
                  {analysis.insights.map((ins, i) => (
                    <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 6, paddingLeft: 12, borderLeft: '2px solid #22c55e44' }}>{ins}</div>
                  ))}
                </div>
              )}

              {analysis.suggestedTitles && analysis.suggestedTitles.length > 0 && (
                <div style={cardStyle}>
                  <div style={{ ...labelStyle, marginBottom: 10, color: '#a78bfa' }}>Suggested Titles (based on what's working)</div>
                  {analysis.suggestedTitles.map((t, i) => (
                    <div key={i} style={{
                      fontSize: 14, fontWeight: 600, color: '#fff', padding: '8px 12px', marginBottom: 4,
                      background: 'rgba(167,139,250,0.06)', borderRadius: 8,
                    }}>
                      {i + 1}. {t}
                    </div>
                  ))}
                </div>
              )}

              {analysis.avoidPatterns && analysis.avoidPatterns.length > 0 && (
                <div style={cardStyle}>
                  <div style={{ ...labelStyle, marginBottom: 10, color: '#ef4444' }}>Patterns to Avoid</div>
                  {analysis.avoidPatterns.map((a, i) => (
                    <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 6, paddingLeft: 12, borderLeft: '2px solid #ef444444' }}>{a}</div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ─── COMPARE MODE ─── */}
      {mode === 'compare' && (
        <>
          <div style={cardStyle}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Channel 1</div>
                <input style={inputStyle} placeholder="@DarkPsychologyCoded or full URL" value={ch1Url} onChange={e => setCh1Url(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Channel 2</div>
                <input style={inputStyle} placeholder="@Mindplicit or full URL" value={ch2Url} onChange={e => setCh2Url(e.target.value)} />
              </div>
            </div>
            <button
              onClick={compare}
              disabled={comparing || !ch1Url.trim() || !ch2Url.trim()}
              style={{ ...btnPrimary, opacity: comparing || !ch1Url.trim() || !ch2Url.trim() ? 0.5 : 1, width: '100%' }}
            >
              {comparing ? compareStatus || 'Comparing…' : '⚔️ Compare Channels'}
            </button>
          </div>

          {/* Channel headers */}
          {compareChannels && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              {[compareChannels.channel1, compareChannels.channel2].map((ch: any, i: number) => (
                <div key={i} style={{ ...cardStyle, flex: 1, marginBottom: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img src={ch.thumbnail} alt="" style={{ width: 40, height: 40, borderRadius: 20 }} />
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{ch.name}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                        {formatNum(Number(ch.subscribers))} subs · {ch.videoCount} videos · {formatNum(Math.round(Number(ch.totalViews) / Math.max(Number(ch.videoCount), 1)))} avg
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Side-by-side videos */}
          {compareVideos && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              {[compareVideos.channel1, compareVideos.channel2].map((ch, ci) => (
                <div key={ci} style={{ ...cardStyle, flex: 1, marginBottom: 0, padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 13, fontWeight: 700, color: '#fff' }}>
                    {ch.name} <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.35)' }}>avg {formatNum(ch.avg)}/video</span>
                  </div>
                  <div style={{ maxHeight: 350, overflowY: 'auto' }}>
                    {ch.videos.map((v, i) => (
                      <div key={v.videoId} style={{
                        padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.03)',
                        background: v.ratio >= 2 ? 'rgba(245,158,11,0.04)' : 'transparent',
                      }}>
                        <a href={`https://youtube.com/watch?v=${v.videoId}`} target="_blank" rel="noopener"
                          style={{ fontSize: 12, fontWeight: 600, color: '#fff', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {v.title}
                        </a>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{formatNum(Number(v.viewCount))} views</span>
                          <RatioBadge ratio={v.ratio} isOutlier={v.ratio >= 5} multiplier={5} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI Comparison */}
          {comparison && (
            <>
              {comparison.winner && (
                <div style={{ ...cardStyle, background: 'rgba(245,158,11,0.06)', borderColor: '#f59e0b33' }}>
                  <div style={{ ...labelStyle, color: '#f59e0b' }}>Winner</div>
                  <div style={{ fontSize: 14, color: '#fff' }}>{comparison.winner}</div>
                </div>
              )}

              {comparison.titleComparison && (
                <div style={cardStyle}>
                  <div style={{ ...labelStyle, color: '#a78bfa', marginBottom: 12 }}>Title Strategy</div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                    <div style={{ flex: 1, padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Channel 1</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{comparison.titleComparison.channel1Style}</div>
                    </div>
                    <div style={{ flex: 1, padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Channel 2</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{comparison.titleComparison.channel2Style}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: '#a78bfa', fontWeight: 600 }}>{comparison.titleComparison.verdict}</div>
                </div>
              )}

              {comparison.stealFromEach && (
                <div style={cardStyle}>
                  <div style={{ ...labelStyle, color: '#22c55e', marginBottom: 12 }}>What to Steal</div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1, padding: 12, background: 'rgba(34,197,94,0.05)', borderRadius: 8, border: '1px solid rgba(34,197,94,0.15)' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', marginBottom: 4 }}>From Channel 1</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{comparison.stealFromEach.fromChannel1}</div>
                    </div>
                    <div style={{ flex: 1, padding: 12, background: 'rgba(34,197,94,0.05)', borderRadius: 8, border: '1px solid rgba(34,197,94,0.15)' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', marginBottom: 4 }}>From Channel 2</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{comparison.stealFromEach.fromChannel2}</div>
                    </div>
                  </div>
                </div>
              )}

              {comparison.recommendation && (
                <div style={{ ...cardStyle, background: 'rgba(59,130,246,0.06)', borderColor: '#3b82f644' }}>
                  <div style={{ ...labelStyle, color: '#3b82f6' }}>Recommendation</div>
                  <div style={{ fontSize: 14, color: '#fff', lineHeight: 1.6 }}>{comparison.recommendation}</div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
