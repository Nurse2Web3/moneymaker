/**
 * Rule-based YouTube title scorer.
 *
 * Returns a 0-100 score per title with a per-signal breakdown. Pure function —
 * no network, no AI, no side effects. Heuristics are tuned against patterns
 * known to correlate with high CTR on YouTube (numbers, length sweet spot,
 * curiosity triggers, brackets, fresh year, emotional keywords).
 *
 * Calibration knobs are exported so they can be evolved without touching the
 * scoring logic itself.
 */

export interface TitleScoreBreakdown {
  length: number;       // 0-20
  powerWords: number;   // 0-25
  numbers: number;      // 0-15
  bracket: number;      // 0-10
  freshYear: number;    // 0-10
  emotional: number;    // 0-15
  casing: number;       // 0-5
}

export interface TitleScore {
  title: string;
  score: number;        // 0-100
  breakdown: TitleScoreBreakdown;
  warnings: string[];
}

const POWER_WORDS = [
  "secret", "truth", "exposed", "revealed", "shocking", "warning",
  "ultimate", "best", "worst", "proven", "hidden", "stop", "never",
  "always", "actually", "really", "finally", "instantly", "free",
  "new", "fastest", "easiest", "biggest", "smallest", "only",
  "before", "after", "vs", "versus", "myth", "fact", "lie", "real",
  "honest", "brutal", "insane", "crazy", "weird", "you", "your",
];

const EMOTIONAL_WORDS = [
  "love", "hate", "fear", "shock", "stunned", "amazed", "broke",
  "failed", "saved", "lost", "rich", "poor", "struggle", "win",
  "lose", "betrayed", "fooled", "tricked", "scammed", "ripped",
  "freedom", "trapped", "easy", "hard", "painful", "regret",
  "wish", "wrong", "right", "die", "kill", "death", "alive",
];

/** Words and markers a top-1% YouTube title typically contains. */
function countMatches(s: string, dict: string[]): number {
  const lower = s.toLowerCase();
  return dict.reduce(
    (n, w) => (new RegExp(`\\b${w}\\b`, "i").test(lower) ? n + 1 : n),
    0,
  );
}

function hasNumber(s: string): boolean {
  return /\d/.test(s);
}

function hasBracket(s: string): boolean {
  return /[\[(]/.test(s);
}

function isCurrentYear(s: string, year: number): boolean {
  return new RegExp(`\\b${year}\\b`).test(s);
}

export function scoreTitle(title: string, currentYear = new Date().getFullYear()): TitleScore {
  const warnings: string[] = [];
  const breakdown: TitleScoreBreakdown = {
    length: 0,
    powerWords: 0,
    numbers: 0,
    bracket: 0,
    freshYear: 0,
    emotional: 0,
    casing: 0,
  };

  // ── Length (50-60 chars is YouTube's SERP sweet spot) ────────────────────
  const len = title.length;
  if (len >= 50 && len <= 60) breakdown.length = 20;
  else if (len >= 45 && len <= 70) breakdown.length = 15;
  else if (len >= 35 && len <= 80) breakdown.length = 10;
  else if (len >= 20) breakdown.length = 5;
  if (len > 70) warnings.push("title exceeds 70 chars — risks truncation in search");
  if (len < 30) warnings.push("title under 30 chars — leaves CTR signal on the table");

  // ── Power words (curiosity, urgency, authority) ──────────────────────────
  const powerHits = countMatches(title, POWER_WORDS);
  breakdown.powerWords = Math.min(25, powerHits * 8);
  if (powerHits === 0) warnings.push("no curiosity/power words detected");

  // ── Numbers (listicles, specificity) ─────────────────────────────────────
  breakdown.numbers = hasNumber(title) ? 15 : 0;

  // ── Brackets / parens (cited as CTR boosters in HubSpot + BuzzSumo studies) ─
  breakdown.bracket = hasBracket(title) ? 10 : 0;

  // ── Year currency ────────────────────────────────────────────────────────
  if (isCurrentYear(title, currentYear)) {
    breakdown.freshYear = 10;
  } else if (/\b(20\d{2})\b/.test(title)) {
    const oldYear = Number(RegExp.$1);
    if (oldYear < currentYear) warnings.push(`title references stale year ${oldYear}`);
  }

  // ── Emotional valence ────────────────────────────────────────────────────
  const emoHits = countMatches(title, EMOTIONAL_WORDS);
  breakdown.emotional = Math.min(15, emoHits * 6);

  // ── Casing — a small bonus for "Title Case" or strategic CAPS ────────────
  const upperWordCount = title.split(/\s+/).filter(w => /^[A-Z][A-Z]+$/.test(w)).length;
  if (upperWordCount >= 1 && upperWordCount <= 2) breakdown.casing = 5;
  else if (upperWordCount > 2) warnings.push("too many ALL CAPS words — looks spammy");

  const score = Math.min(
    100,
    Object.values(breakdown).reduce((a, b) => a + b, 0),
  );

  return { title, score, breakdown, warnings };
}

export function scoreTitles(titles: string[], currentYear?: number): TitleScore[] {
  return titles.map(t => scoreTitle(t, currentYear));
}
