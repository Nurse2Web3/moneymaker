import { useState } from 'react';
import SaveButton from './SaveButton';

type KeywordScore = {
  keyword: string;
  score: number;
  demand: number;
  competition: number;
  freshness: number;
  medianViews: number;
  medianSubscribers: number;
  freshPct: number;
  resultCount: number;
  warnings: string[];
};

type Result = {
  seedKeyword: string;
  keywords: KeywordScore[];
  dataSource: string | null;
};

function scoreColor(score: number): string {
  if (score >= 75) return '#22c55e';
  if (score >= 55) return '#eab308';
  if (score >= 35) return '#f97316';
  return '#ef4444';
}

function ScoreBadge({ score }: { score: number }) {
  const color = scoreColor(score);
  return (
    <span
      title="0-100 opportunity score (demand × freshness ÷ competition)"
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        minWidth: 44, height: 28, padding: '0 8px', borderRadius: 6,
        background: `${color}1f`, border: `1px solid ${color}55`, color,
        fontSize: 13, fontWeight: 700, flexShrink: 0,
      }}
    >
      {score}
    </span>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

export default function KeywordAnalyzer() {
  const [seedKeyword, setSeedKeyword] = useState('');
  const [niche, setNiche] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  async function analyze() {
    if (!seedKeyword.trim()) return;
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch('/api/tools/keyword-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seedKeyword, channelNiche: niche }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch {
      setError('Keyword analysis failed. Check your YouTube API key and try again.');
    } finally {
      setLoading(false);
    }
  }

  function copyKeyword(k: string, i: number) {
    navigator.clipboard.writeText(k).catch(() => {});
    setCopiedIdx(i);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  const sectionTitle: React.CSSProperties = {
    fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12,
  };

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px 24px' }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Keyword Analyzer</h2>
      <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.45)', marginBottom: 24 }}>
        Enter a seed keyword. We pull YouTube autocomplete + related variants, fetch the top 10 results for each, and score the opportunity 0-100 based on real demand, competition, and freshness.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        <input
          value={seedKeyword}
          onChange={e => setSeedKeyword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && analyze()}
          placeholder="Seed keyword (e.g. how to start a podcast)"
          style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', color: '#fff', fontSize: 18, outline: 'none' }}
        />
        <input
          value={niche}
          onChange={e => setNiche(e.target.value)}
          placeholder="Channel niche (optional)"
          style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', color: '#fff', fontSize: 18, outline: 'none' }}
        />
        <button
          onClick={analyze}
          disabled={!seedKeyword.trim() || loading}
          style={{ padding: 12, borderRadius: 10, background: '#fff', color: '#000', fontWeight: 600, fontSize: 17, cursor: seedKeyword.trim() && !loading ? 'pointer' : 'not-allowed', opacity: (!seedKeyword.trim() || loading) ? 0.5 : 1, border: 'none' }}
        >
          {loading ? 'Analyzing keywords (this can take 30-60s)...' : '🔍 Analyze Keyword'}
        </button>
      </div>

      {error && (
        <div style={{ background: '#ff4d4d15', border: '1px solid #ff4d4d30', borderRadius: 8, padding: '12px 16px', color: '#ff4d4d', fontSize: 15, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {result?.dataSource && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16, padding: '7px 12px', borderRadius: 8, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <span style={{ fontSize: 13 }}>📊</span>
          <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 500 }}>{result.dataSource}</span>
        </div>
      )}

      {result && (
        <div style={{ padding: 0, background: 'transparent', border: 'none' }}>
          <div style={sectionTitle}>Keywords (ranked by opportunity)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {result.keywords.map((k, i) => (
              <div key={i} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <ScoreBadge score={k.score} />
                    <span style={{ fontSize: 20, color: '#fff', lineHeight: 1.4 }}>{k.keyword}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <SaveButton type="tags" label={`Keyword: ${k.keyword}`} content={k.keyword} meta={`Score: ${k.score} • ${formatNumber(k.medianViews)} median views`} />
                    <button onClick={() => copyKeyword(k.keyword, i)} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 14, background: copiedIdx === i ? '#22c55e20' : 'rgba(255,255,255,0.08)', color: copiedIdx === i ? '#22c55e' : 'rgba(255,255,255,0.5)', border: `1px solid ${copiedIdx === i ? '#22c55e40' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer' }}>
                      {copiedIdx === i ? '✓' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
                  <span title="Median view count of top 10 results">
                    👁 <strong style={{ color: '#fff' }}>{formatNumber(k.medianViews)}</strong> median views
                  </span>
                  <span title="Median subscriber count of those channels — lower = easier to outrank">
                    👥 <strong style={{ color: '#fff' }}>{formatNumber(k.medianSubscribers)}</strong> median subs
                  </span>
                  <span title="% of top 10 uploaded in last 90 days">
                    🆕 <strong style={{ color: '#fff' }}>{Math.round(k.freshPct * 100)}%</strong> fresh
                  </span>
                  <span title="Sub-scores: demand / competition / freshness">
                    D{k.demand} · C{k.competition} · F{k.freshness}
                  </span>
                </div>

                {k.warnings.length > 0 && (
                  <ul style={{ margin: 0, paddingLeft: 18, color: 'rgba(255,255,255,0.45)', fontSize: 12, lineHeight: 1.5 }}>
                    {k.warnings.map((w, wi) => <li key={wi}>{w}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
