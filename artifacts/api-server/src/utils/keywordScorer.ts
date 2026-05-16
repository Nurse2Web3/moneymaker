/**
 * Rule-based keyword opportunity scorer.
 *
 * Score combines three signals derived from the top 10 YouTube results:
 *  - demand     (median view count of those results — proxy for search interest)
 *  - competition (median subscriber count of the channels — bigger = harder to outrank)
 *  - freshness  (% of top results uploaded in the last 90 days — recent uploads
 *                ranking high means YouTube is still rewarding new entrants)
 *
 * Returns a 0-100 score. Pure function — no network, no AI.
 */

export interface KeywordSignal {
  keyword: string;
  resultCount: number;
  medianViews: number;
  medianSubscribers: number;
  freshPct: number;       // 0-1
}

export interface KeywordScore {
  keyword: string;
  score: number;          // 0-100
  demand: number;         // 0-50
  competition: number;    // 0-30 (inverted — high score == low competition)
  freshness: number;      // 0-20
  medianViews: number;
  medianSubscribers: number;
  freshPct: number;
  resultCount: number;
  warnings: string[];
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function scoreKeyword(sig: KeywordSignal): KeywordScore {
  const warnings: string[] = [];

  // ── Demand (0-50): log-scale median views ───────────────────────────────
  // 1K views => ~7, 10K => ~17, 100K => ~28, 1M => ~38, 10M+ => 50
  const demand =
    sig.medianViews <= 0
      ? 0
      : Math.min(50, Math.round((Math.log10(sig.medianViews) / Math.log10(10_000_000)) * 50));
  if (sig.medianViews < 5_000) warnings.push("low view ceiling — top results barely break 5K");

  // ── Competition (0-30, inverted): smaller channels = easier to outrank ──
  // <10K subs => 30, 10K-100K => 22, 100K-1M => 14, 1M-10M => 6, 10M+ => 0
  let competition: number;
  if (sig.medianSubscribers < 10_000) competition = 30;
  else if (sig.medianSubscribers < 100_000) competition = 22;
  else if (sig.medianSubscribers < 1_000_000) competition = 14;
  else if (sig.medianSubscribers < 10_000_000) competition = 6;
  else competition = 0;
  if (sig.medianSubscribers > 1_000_000) warnings.push("dominated by million-sub channels — hard to rank");

  // ── Freshness (0-20): % of top 10 uploaded in last 90 days ──────────────
  const freshness = Math.round(sig.freshPct * 20);
  if (sig.freshPct < 0.2) warnings.push("top results are mostly old — algorithm may be locked");

  if (sig.resultCount < 10) warnings.push("very thin search depth — niche may be too narrow");

  const score = Math.min(100, demand + competition + freshness);

  return {
    keyword: sig.keyword,
    score,
    demand,
    competition,
    freshness,
    medianViews: sig.medianViews,
    medianSubscribers: sig.medianSubscribers,
    freshPct: sig.freshPct,
    resultCount: sig.resultCount,
    warnings,
  };
}

/** Helper to build a KeywordSignal from raw YouTube data. */
export function buildSignal(
  keyword: string,
  videos: { viewCount: string; publishedAt: string; channelId: string }[],
  subscribersByChannel: Record<string, number>,
): KeywordSignal {
  const top = videos.slice(0, 10);
  const views = top.map(v => Number(v.viewCount) || 0);
  const subs = top.map(v => subscribersByChannel[v.channelId] ?? 0);
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const freshCount = top.filter(v => new Date(v.publishedAt).getTime() >= ninetyDaysAgo).length;

  return {
    keyword,
    resultCount: videos.length,
    medianViews: median(views),
    medianSubscribers: median(subs),
    freshPct: top.length > 0 ? freshCount / top.length : 0,
  };
}
