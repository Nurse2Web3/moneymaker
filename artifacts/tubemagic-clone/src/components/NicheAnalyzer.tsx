import { useState } from 'react';

interface VideoResult {
  title: string;
  channel: string;
  publishedAt: string;
  videoId: string;
  thumbnail: string;
  viewCount: string;
  likeCount: string;
  commentCount: string;
}

interface NicheAnalysis {
  summary: string;
  marketSize: string;
  competition: string;
  revenuePotential: string;
  avgTopViews: number;
  opportunities: { title: string; description: string; potential: string }[];
  titlePatterns: string[];
  contentGaps: { gap: string; why: string }[];
  topFormats: { format: string; description: string; examples: string }[];
  avoidMistakes: string[];
  quickWins: string[];
}

interface DiscoveredNiche {
  niche: string;
  searchQuery: string;
  why: string;
  cpmRange: string;
  difficulty: string;
  contentIdeas: string[];
  icon: string;
  avgTopViews?: number;
}

function formatViews(n: number | string): string {
  const num = Number(n);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
  return String(num);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}yr ago`;
}

const MARKET_COLORS: Record<string, string> = { Massive: '#f59e0b', Large: '#22c55e', Medium: '#3b82f6', Small: '#6b7280' };
const COMP_COLORS: Record<string, string> = { 'Very High': '#ef4444', High: '#f59e0b', Medium: '#3b82f6', Low: '#22c55e' };
const REV_COLORS: Record<string, string> = { 'Very High': '#f59e0b', High: '#22c55e', Medium: '#3b82f6', Low: '#6b7280' };
const DIFF_COLORS: Record<string, string> = { Beginner: '#22c55e', Intermediate: '#f59e0b', Advanced: '#ef4444' };
const potentialColors: Record<string, string> = { High: '#f59e0b', Viral: '#ec4899', Medium: '#3b82f6', Low: '#6b7280' };

export default function NicheAnalyzer() {
  const [mode, setMode] = useState<'discover' | 'analyze'>('discover');
  const [niche, setNiche] = useState('');
  const [channelDesc, setChannelDesc] = useState('');
  const [analysis, setAnalysis] = useState<NicheAnalysis | null>(null);
  const [topVideos, setTopVideos] = useState<VideoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [discovered, setDiscovered] = useState<DiscoveredNiche[]>([]);
  const [error, setError] = useState('');

  async function discover() {
    setError('');
    setDiscovered([]);
    setDiscovering(true);
    try {
      const res = await fetch('/api/tools/niche-discovery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDiscovered(data.niches || []);
    } catch {
      setError('Failed to discover niches. Please try again.');
    } finally {
      setDiscovering(false);
    }
  }

  async function analyze(nicheOverride?: string) {
    const target = nicheOverride || niche;
    if (!target.trim()) return;
    setError('');
    setAnalysis(null);
    setTopVideos([]);
    setLoading(true);
    if (nicheOverride) { setNiche(nicheOverride); setMode('analyze'); }
    try {
      const res = await fetch('/api/tools/niche-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: target, channelDescription: channelDesc }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data.analysis);
      setTopVideos(data.topVideos || []);
    } catch {
      setError('Failed to analyze niche. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Niche Analyzer</h1>
      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '24px' }}>Discover profitable niches or analyze any niche using live YouTube data</p>

      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: '4px', background: '#111', borderRadius: '10px', padding: '4px', marginBottom: '24px', width: 'fit-content' }}>
        {(['discover', 'analyze'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: '7px 18px', borderRadius: '7px', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer',
            background: mode === m ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: mode === m ? '#fff' : 'rgba(255,255,255,0.4)',
          }}>
            {m === 'discover' ? '🔭 Discover Niches' : '🔬 Analyze a Niche'}
          </button>
        ))}
      </div>

      {/* DISCOVER MODE */}
      {mode === 'discover' && (
        <div>
          {discovered.length === 0 && !discovering && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px' }}>💰</div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>Find Your Profitable Niche</h2>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', maxWidth: '480px', lineHeight: 1.6 }}>
                AI scans YouTube data to find 8 niches with high advertiser CPM, growing demand, and realistic income potential — specifically for solo creators starting in {new Date().getFullYear()}.
              </p>
              <button onClick={discover} style={{ padding: '14px 32px', borderRadius: '10px', background: '#fff', color: '#000', fontWeight: 700, fontSize: '15px', border: 'none', cursor: 'pointer' }}>
                ✦ Find Profitable Niches
              </button>
            </div>
          )}

          {discovering && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: '16px', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
              <div style={{ fontSize: '36px', animation: 'spin 2s linear infinite' }}>🔭</div>
              <p style={{ fontSize: '14px' }}>Scanning YouTube data for profitable niches...</p>
              <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
            </div>
          )}

          {error && <div style={{ background: '#ff4d4d15', border: '1px solid #ff4d4d30', borderRadius: '8px', padding: '12px 16px', color: '#ff4d4d', fontSize: '14px', marginBottom: '16px' }}>{error}</div>}

          {discovered.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{discovered.length} niches found — click any to get a full YouTube-powered analysis</span>
                <button onClick={discover} style={{ padding: '6px 14px', borderRadius: '7px', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', cursor: 'pointer' }}>↻ Refresh</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                {discovered.map((n, i) => (
                  <div key={i} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                    onClick={() => analyze(n.niche)}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <span style={{ fontSize: '24px', flexShrink: 0 }}>{n.icon}</span>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', lineHeight: 1.3, marginBottom: '4px' }}>{n.niche}</div>
                          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: (DIFF_COLORS[n.difficulty] || '#6b7280') + '20', color: DIFF_COLORS[n.difficulty] || '#6b7280', border: `1px solid ${(DIFF_COLORS[n.difficulty] || '#6b7280')}40` }}>{n.difficulty}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b' }}>{n.cpmRange}</div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>CPM</div>
                      </div>
                    </div>

                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>{n.why}</p>

                    {n.avgTopViews !== undefined && n.avgTopViews > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', padding: '6px 10px' }}>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Avg top video:</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{formatViews(n.avgTopViews)} views</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {n.contentIdeas.slice(0, 2).map((idea, j) => (
                        <span key={j} style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '4px', lineHeight: 1.4 }}>{idea}</span>
                      ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginTop: 'auto', paddingTop: '4px' }}>
                      <span>Analyze this niche →</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ANALYZE MODE */}
      {mode === 'analyze' && (
        <div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <input value={niche} onChange={e => setNiche(e.target.value)} onKeyDown={e => e.key === 'Enter' && analyze()} placeholder="Enter niche (e.g. AI tools for small business owners)"
              style={{ flex: 1, background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }} />
            <button onClick={() => analyze()} disabled={!niche.trim() || loading} style={{
              padding: '12px 22px', borderRadius: '10px', fontWeight: 600, fontSize: '14px', border: 'none', whiteSpace: 'nowrap',
              background: niche.trim() && !loading ? '#fff' : '#1a1a1a',
              color: niche.trim() && !loading ? '#000' : 'rgba(255,255,255,0.3)',
              cursor: niche.trim() && !loading ? 'pointer' : 'not-allowed',
            }}>
              {loading ? 'Analyzing...' : '✦ Analyze'}
            </button>
          </div>
          <textarea value={channelDesc} onChange={e => setChannelDesc(e.target.value)} placeholder="Optional: describe your channel or content style..."
            rows={2} style={{ width: '100%', background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '13px', fontFamily: 'inherit', outline: 'none', resize: 'none', marginBottom: '16px', boxSizing: 'border-box' }} />

          {error && <div style={{ background: '#ff4d4d15', border: '1px solid #ff4d4d30', borderRadius: '8px', padding: '12px 16px', color: '#ff4d4d', fontSize: '14px', marginBottom: '16px' }}>{error}</div>}

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px', gap: '12px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
              <div style={{ fontSize: '32px' }}>📡</div>
              <p style={{ fontSize: '14px' }}>Pulling live YouTube data + running AI analysis...</p>
            </div>
          )}

          {analysis && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Header stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {[
                  { label: 'Market Size', value: analysis.marketSize, colors: MARKET_COLORS },
                  { label: 'Competition', value: analysis.competition, colors: COMP_COLORS },
                  { label: 'Revenue Potential', value: analysis.revenuePotential, colors: REV_COLORS },
                  { label: 'Avg Top Views', value: analysis.avgTopViews ? formatViews(analysis.avgTopViews) : '—', colors: {} },
                ].map((s, i) => (
                  <div key={i} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: (s.colors as Record<string,string>)[s.value] || '#fff' }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '20px 24px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>AI Analysis</div>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, margin: 0 }}>{analysis.summary}</p>
              </div>

              {/* Real YouTube Videos */}
              {topVideos.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#ef4444' }}>▶ Live YouTube Data</span>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '20px' }}>Top {topVideos.length} videos by views</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {topVideos.slice(0, 8).map((v, i) => (
                      <a key={v.videoId} href={`https://youtube.com/watch?v=${v.videoId}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', transition: 'border-color 0.15s', cursor: 'pointer' }}
                          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)')}
                          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
                        >
                          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.2)', fontWeight: 600, minWidth: '20px', textAlign: 'right' }}>#{i + 1}</span>
                          <img src={v.thumbnail} alt="" style={{ width: '72px', height: '40px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '3px' }}>{v.title}</div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{v.channel} · {timeAgo(v.publishedAt)}</div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{formatViews(v.viewCount)}</div>
                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>views</div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Title Patterns */}
              {analysis.titlePatterns && analysis.titlePatterns.length > 0 && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#a78bfa', marginBottom: '10px' }}>📝 Title Patterns That Work</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {analysis.titlePatterns.map((p, i) => (
                      <div key={i} style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>"{p}"</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Opportunities */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#f59e0b', marginBottom: '12px' }}>🚀 Content Opportunities</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                  {analysis.opportunities.map((o, i) => (
                    <div key={i} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{o.title}</div>
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: (potentialColors[o.potential] || '#6b7280') + '20', color: potentialColors[o.potential] || '#6b7280', border: `1px solid ${(potentialColors[o.potential] || '#6b7280')}40` }}>{o.potential}</span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>{o.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content Gaps */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#3b82f6', marginBottom: '12px' }}>🔍 Untapped Gaps</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {analysis.contentGaps.map((g, i) => (
                    <div key={i} style={{ background: '#111', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '10px', padding: '14px 16px', display: 'flex', gap: '12px' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#3b82f620', border: '1px solid #3b82f640', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#3b82f6' }}>{i + 1}</span>
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>{g.gap}</div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{g.why}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Formats */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#22c55e', marginBottom: '12px' }}>🎬 Best Performing Formats</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                  {analysis.topFormats.map((f, i) => (
                    <div key={i} style={{ background: '#111', border: '1px solid rgba(34,197,94,0.1)', borderRadius: '12px', padding: '16px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>{f.format}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: '8px' }}>{f.description}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(34,197,94,0.7)', fontStyle: 'italic' }}>e.g. {f.examples}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Wins + Mistakes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#22c55e', marginBottom: '14px' }}>⚡ Quick Wins</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {analysis.quickWins.map((w, i) => (
                      <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <span style={{ color: '#22c55e', flexShrink: 0, marginTop: '1px' }}>✓</span>
                        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{w}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#ef4444', marginBottom: '14px' }}>⚠️ Avoid These Mistakes</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {analysis.avoidMistakes.map((m, i) => (
                      <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <span style={{ color: '#ef4444', flexShrink: 0, marginTop: '1px' }}>✗</span>
                        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
