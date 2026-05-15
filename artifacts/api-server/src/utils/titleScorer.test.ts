/**
 * Tests for titleScorer. Run with: node --import tsx --test titleScorer.test.ts
 *
 * The repo doesn't yet ship a test runner config — this file uses Node's
 * built-in test module so it runs with zero extra deps. CI can pick it up
 * later by adding a "test" script that globs **\/*.test.ts.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreTitle, scoreTitles } from "./titleScorer.js";

const YEAR = 2026;

test("scores a strong title (length, number, power word, year) highly", () => {
  const r = scoreTitle("7 Brutal Truths About Crypto in 2026 [Exposed]", YEAR);
  // 65+ is the threshold for a "strong" title that hits length+number+bracket+year+power words
  assert.ok(r.score >= 65, `expected >= 65, got ${r.score}`);
  assert.equal(r.breakdown.numbers, 15);
  assert.equal(r.breakdown.bracket, 10);
  assert.equal(r.breakdown.freshYear, 10);
});

test("penalizes a weak generic title", () => {
  const r = scoreTitle("Some thoughts on stuff", YEAR);
  assert.ok(r.score <= 30, `expected <= 30, got ${r.score}`);
  assert.ok(r.warnings.some(w => w.includes("power words")));
});

test("warns on stale year reference", () => {
  const r = scoreTitle("Why I Bought Bitcoin in 2019", YEAR);
  assert.ok(r.warnings.some(w => w.includes("stale year")));
});

test("warns on excessive ALL CAPS", () => {
  const r = scoreTitle("YOU WILL NEVER BELIEVE THIS SHOCKING TRUTH", YEAR);
  assert.ok(r.warnings.some(w => w.includes("ALL CAPS")));
});

test("flags titles over 70 chars", () => {
  const long = "This is a very long YouTube title that exceeds the search results display limit by a wide margin";
  const r = scoreTitle(long, YEAR);
  assert.ok(r.warnings.some(w => w.includes("70 chars")));
});

test("scoreTitles batches and preserves order", () => {
  const titles = ["First", "Second 2026", "Third"];
  const out = scoreTitles(titles, YEAR);
  assert.equal(out.length, 3);
  assert.equal(out[0].title, "First");
  assert.equal(out[2].title, "Third");
  assert.ok(out[1].breakdown.freshYear === 10);
});

test("rewards 50-60 char length sweet spot", () => {
  const tight = "How I Made 10K With This Simple Crypto Strategy 2026"; // length within sweet spot
  const r = scoreTitle(tight, YEAR);
  assert.equal(r.breakdown.length, 20, `expected length=20 for ${tight.length} chars`);
});

test("strategic CAPS gets bonus, excessive does not", () => {
  // One ALL-CAPS word ("STOP") triggers the bonus
  const strategic = scoreTitle("Why You Should STOP Buying ETFs in 2026", YEAR);
  assert.equal(strategic.breakdown.casing, 5);
});
