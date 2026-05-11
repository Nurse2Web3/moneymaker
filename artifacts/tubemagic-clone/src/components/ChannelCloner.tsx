import { useState, useRef } from 'react';
import { useSavedItems } from '../lib/savedItems';

interface ChannelData {
  id: string;
  name: string;
  description: string;
  publishedAt: string;
  thumbnail: string;
  subscribers: string;
  videoCount: string;
  totalViews: string;
}

interface TopVideo {
  videoId: string;
  title: string;
  publishedAt: string;
  viewCount: string;
  likeCount: string;
}

interface ChannelDNA {
  hookStyle: string;
  tone: string;
  pacing: string;
  contentStructure: string;
  recurringPhrases: string[];
  emotionalTriggers: string[];
  uniquePatterns: string[];
  audienceRelationship: string;
  summary: string;
}

interface NicheSuggestion {
  niche: string;
  whyItWorks: string;
  gap: string;
  exampleTitle: string;
  hook: string;
  cpmRange: string;
}

interface DeepAnalysis {
  titleStrategy?: {
    patterns?: string;
    lengthAvg?: string;
    emotionalTriggers?: string;
    topTechniques?: string[];
  };
  thumbnailStrategy?: {
    style?: string;
    textUsage?: string;
    consistencyScore?: string;
    whatWorks?: string;
  };
  contentStructure?: {
    hookStyle?: string;
    bodyFormat?: string;
    pacingNotes?: string;
    retentionTechniques?: string[];
    ctaStyle?: string;
  };
  uploadFrequency?: {
    schedule?: string;
    consistency?: string;
    bestDays?: string;
  };
  top5Titles?: { title: string; views: string; whyItWorks: string }[];
  weakest5?: { title: string; views: string; whyItFlopped: string }[];
}

interface CloneIdea {
  title: string;
  thumbnailText: string;
  concept: string;
  format: string;
}

interface Screenshot {
  data: string;
  mediaType: string;
  preview: string;
}

function formatNum(n: string | number) {
  const v = Number(n);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

function StatusLine({ message }: { message: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', marginBottom: '8px' }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a78bfa', boxShadow: '0 0 6px #a78bfa', flexShrink: 0, animation: 'pulse 1s ease-in-out infinite' }} />
      <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>{message}</span>
    </div>
  );
}

function channelAge(publishedAt: string): string {
  const days = Math.floor((Date.now() - new Date(publishedAt).getTime()) / 86400000);
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} old`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} old`;
  const years = Math.floor(days / 365);
  return `${years} year${years !== 1 ? 's' : ''} old`;
}

function ChannelCard({ channel }: { channel: ChannelData }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', marginBottom: '16px' }}>
      <img src={channel.thumbnail} alt={channel.name} style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{channel.name}</div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{formatNum(channel.subscribers)} subscribers</span>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{formatNum(channel.videoCount)} videos</span>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{formatNum(channel.totalViews)} total views</span>
          {channel.publishedAt && (
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>📅 {channelAge(channel.publishedAt)}</span>
          )}
        </div>
      </div>
      <a href={`https://youtube.com/channel/${channel.id}`} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>↗ View</a>
    </div>
  );
}

function DNACard({ dna }: { dna: ChannelDNA }) {
  const tags = (items: string[]) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
      {items.map((item, i) => (
        <span key={i} style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, background: 'rgba(167,139,250,0.12)', color: '#c4b5fd', border: '1px solid rgba(167,139,250,0.2)' }}>{item}</span>
      ))}
    </div>
  );

  const row = (label: string, value: string) => (
    <div style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{value}</div>
    </div>
  );

  return (
    <div style={{ background: '#111', border: '1px solid rgba(167,139,250,0.2)', borderRadius: '14px', padding: '20px 24px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <span style={{ fontSize: '18px' }}>🧬</span>
        <span style={{ fontSize: '16px', fontWeight: 700, color: '#c4b5fd' }}>Channel DNA</span>
      </div>
      <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: '16px', padding: '12px 16px', background: 'rgba(167,139,250,0.07)', borderRadius: '8px', borderLeft: '3px solid #a78bfa' }}>
        {dna.summary}
      </div>
      {row('Hook Style', dna.hookStyle)}
      {row('Tone & Voice', dna.tone)}
      {row('Pacing', dna.pacing)}
      {row('Content Structure', dna.contentStructure)}
      {row('Audience Relationship', dna.audienceRelationship)}
      <div style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Recurring Phrases</div>
        {tags(dna.recurringPhrases || [])}
      </div>
      <div style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Emotional Triggers</div>
        {tags(dna.emotionalTriggers || [])}
      </div>
      <div style={{ padding: '12px 0' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Unique Patterns</div>
        {tags(dna.uniquePatterns || [])}
      </div>
    </div>
  );
}

function NicheCard({ niche, index, isFirst }: { niche: NicheSuggestion; index: number; isFirst: boolean }) {
  const color = isFirst ? '#34d399' : '#60a5fa';
  const colorAlpha = isFirst ? 'rgba(52,211,153,' : 'rgba(96,165,250,';
  return (
    <div style={{ background: '#111', border: `1px solid ${colorAlpha}0.2)`, borderRadius: '12px', overflow: 'hidden', marginBottom: '10px' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', background: `${colorAlpha}0.06)`, borderBottom: `1px solid ${colorAlpha}0.1)`, display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: `${colorAlpha}0.15)`, color, fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{index + 1}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color, marginBottom: '1px' }}>{niche.niche}</div>
          <div style={{ fontSize: '12px', color: `${colorAlpha}0.6)`, fontWeight: 600 }}>CPM {niche.cpmRange}</div>
        </div>
        {isFirst && <div style={{ fontSize: '11px', fontWeight: 600, color, background: `${colorAlpha}0.08)`, border: `1px solid ${colorAlpha}0.25)`, borderRadius: '4px', padding: '2px 8px' }}>★ Script written for this niche</div>}
      </div>

      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Why it works */}
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>Why this style wins here</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{niche.whyItWorks}</div>
        </div>
        {/* Gap */}
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>Gap to fill</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{niche.gap}</div>
        </div>
        {/* Example title */}
        <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', borderLeft: `2px solid ${colorAlpha}0.4)` }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Example title (in their style)</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', lineHeight: 1.4 }}>{niche.exampleTitle}</div>
        </div>
        {/* Hook */}
        <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Opening hook</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', fontStyle: 'italic', lineHeight: 1.5 }}>"{niche.hook}"</div>
        </div>
      </div>
    </div>
  );
}

function DeepAnalysisCard({ analysis }: { analysis: DeepAnalysis }) {
  const section = (icon: string, title: string, children: React.ReactNode) => (
    <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px 20px', marginBottom: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '16px' }}>{icon}</span>
        <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>{title}</span>
      </div>
      {children}
    </div>
  );

  const row = (label: string, value?: string) => value ? (
    <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>{label}</div>
      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{value}</div>
    </div>
  ) : null;

  const tags = (items?: string[]) => items?.length ? (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
      {items.map((item, i) => (
        <span key={i} style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, background: 'rgba(96,165,250,0.12)', color: '#93c5fd', border: '1px solid rgba(96,165,250,0.2)' }}>{item}</span>
      ))}
    </div>
  ) : null;

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>🔬</span> Deep Channel Analysis
      </div>

      {analysis.titleStrategy && section('✏️', 'Title Strategy', <>
        {row('Patterns', analysis.titleStrategy.patterns)}
        {row('Average Length & Style', analysis.titleStrategy.lengthAvg)}
        {row('Emotional Triggers', analysis.titleStrategy.emotionalTriggers)}
        {analysis.titleStrategy.topTechniques && <>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '8px', marginBottom: '4px' }}>Top Techniques</div>
          {tags(analysis.titleStrategy.topTechniques)}
        </>}
      </>)}

      {analysis.thumbnailStrategy && section('🖼️', 'Thumbnail Strategy', <>
        {row('Visual Style', analysis.thumbnailStrategy.style)}
        {row('Text Usage', analysis.thumbnailStrategy.textUsage)}
        {row('Consistency', analysis.thumbnailStrategy.consistencyScore ? `${analysis.thumbnailStrategy.consistencyScore}/10` : undefined)}
        {row('What Makes Them Click', analysis.thumbnailStrategy.whatWorks)}
      </>)}

      {analysis.contentStructure && section('🎬', 'Content Structure & Retention', <>
        {row('Hook Style', analysis.contentStructure.hookStyle)}
        {row('Body Format', analysis.contentStructure.bodyFormat)}
        {row('Pacing', analysis.contentStructure.pacingNotes)}
        {row('CTA Style', analysis.contentStructure.ctaStyle)}
        {analysis.contentStructure.retentionTechniques && <>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '8px', marginBottom: '4px' }}>Retention Techniques</div>
          {tags(analysis.contentStructure.retentionTechniques)}
        </>}
      </>)}

      {analysis.uploadFrequency && section('📅', 'Upload Frequency', <>
        {row('Schedule', analysis.uploadFrequency.schedule)}
        {row('Consistency', analysis.uploadFrequency.consistency)}
        {row('Best Days', analysis.uploadFrequency.bestDays)}
      </>)}

      {analysis.top5Titles && analysis.top5Titles.length > 0 && section('🏆', 'Top 5 Best Performing Titles', <>
        {analysis.top5Titles.map((v, i) => (
          <div key={i} style={{ padding: '10px 0', borderBottom: i < analysis.top5Titles!.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#34d399', marginBottom: '2px' }}>{i + 1}. {v.title}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{v.views} views — {v.whyItWorks}</div>
          </div>
        ))}
      </>)}

      {analysis.weakest5 && analysis.weakest5.length > 0 && section('📉', 'Weakest 5 Titles (Learn What to Avoid)', <>
        {analysis.weakest5.map((v, i) => (
          <div key={i} style={{ padding: '10px 0', borderBottom: i < analysis.weakest5!.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#f87171', marginBottom: '2px' }}>{i + 1}. {v.title}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{v.views} views — {v.whyItFlopped}</div>
          </div>
        ))}
      </>)}
    </div>
  );
}

function CloneIdeasCard({ ideas, dna, channelName, onGenerateScript }: {
  ideas: CloneIdea[];
  dna: ChannelDNA | null;
  channelName: string;
  onGenerateScript: (idea: CloneIdea) => void;
}) {
  const { saveItem, isSaved } = useSavedItems();
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const formatColors: Record<string, string> = {
    storytelling: '#a78bfa', listicle: '#34d399', tutorial: '#60a5fa',
    'case study': '#f59e0b', reaction: '#f87171', comparison: '#ec4899',
  };

  function copyIdea(idea: CloneIdea, i: number) {
    const text = `Title: ${idea.title}\nThumbnail Text: ${idea.thumbnailText}\nFormat: ${idea.format}\nConcept: ${idea.concept}`;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedIdx(i);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  function saveIdea(idea: CloneIdea) {
    const content = `Title: ${idea.title}\nThumbnail Text: ${idea.thumbnailText}\nFormat: ${idea.format}\nConcept: ${idea.concept}`;
    saveItem({
      type: 'clone-idea',
      label: idea.title,
      content,
      meta: `Cloned from ${channelName} | ${idea.format}`,
    });
  }

  const btnSmall: React.CSSProperties = {
    padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
    border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>💡</span> 10 Clone-Ready Video Ideas
      </div>
      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '14px' }}>
        Based on gaps, patterns, and winning formulas — save ideas or generate scripts + thumbnails
      </div>
      {ideas.map((idea, i) => {
        const fmtColor = formatColors[idea.format?.toLowerCase()] || '#60a5fa';
        const ideaContent = `Title: ${idea.title}\nThumbnail Text: ${idea.thumbnailText}\nFormat: ${idea.format}\nConcept: ${idea.concept}`;
        const saved = isSaved(ideaContent, 'clone-idea');
        return (
          <div key={i} style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px 20px', marginBottom: '8px' }}>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.2)', minWidth: '20px' }}>{i + 1}</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: fmtColor, background: `${fmtColor}15`, padding: '2px 8px', borderRadius: '4px', border: `1px solid ${fmtColor}30` }}>{idea.format}</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>{idea.title}</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>{idea.concept}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                Thumbnail text: <strong style={{ color: 'rgba(255,255,255,0.6)' }}>{idea.thumbnailText}</strong>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                onClick={() => onGenerateScript(idea)}
                style={{ ...btnSmall, background: 'rgba(167,139,250,0.1)', color: '#a78bfa', borderColor: 'rgba(167,139,250,0.3)' }}
              >
                Generate Script
              </button>
              <button
                onClick={() => saveIdea(idea)}
                style={{ ...btnSmall, background: saved ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.05)', color: saved ? '#fbbf24' : 'rgba(255,255,255,0.4)', borderColor: saved ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.1)' }}
              >
                {saved ? 'Saved' : 'Save Idea'}
              </button>
              <button
                onClick={() => copyIdea(idea, i)}
                style={{ ...btnSmall, background: copiedIdx === i ? '#22c55e20' : 'rgba(255,255,255,0.05)', color: copiedIdx === i ? '#22c55e' : 'rgba(255,255,255,0.4)', borderColor: copiedIdx === i ? '#22c55e40' : 'rgba(255,255,255,0.1)' }}
              >
                {copiedIdx === i ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ScriptDisplay({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', overflow: 'hidden', marginBottom: '20px' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>📝</span>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>Generated Script</span>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginLeft: '4px' }}>(styled after the channel)</span>
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(text)}
          style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
        >
          Copy
        </button>
      </div>
      <div style={{ padding: '20px 24px', fontFamily: 'monospace', fontSize: '14px', lineHeight: 1.8, color: 'rgba(255,255,255,0.8)', whiteSpace: 'pre-wrap', maxHeight: '600px', overflowY: 'auto' }}>
        {lines.map((line, i) => {
          const isSection = line.match(/^\[.+\]$/);
          return (
            <div key={i} style={{ color: isSection ? '#a78bfa' : 'rgba(255,255,255,0.8)', fontWeight: isSection ? 700 : 400, marginTop: isSection && i > 0 ? '20px' : 0 }}>
              {line}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ChannelCloner() {
  const [channelUrl, setChannelUrl] = useState('');
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [channel, setChannel] = useState<ChannelData | null>(null);
  const [videos, setVideos] = useState<TopVideo[]>([]);
  const [dna, setDna] = useState<ChannelDNA | null>(null);
  const [deepAnalysis, setDeepAnalysis] = useState<DeepAnalysis | null>(null);
  const [cloneIdeas, setCloneIdeas] = useState<CloneIdea[]>([]);
  const [ideas, setIdeas] = useState<NicheSuggestion[]>([]);
  const [script, setScript] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [ideaScript, setIdeaScript] = useState('');
  const [ideaScriptLoading, setIdeaScriptLoading] = useState(false);
  const [ideaScriptTitle, setIdeaScriptTitle] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStatuses([]);
    setChannel(null);
    setVideos([]);
    setDna(null);
    setDeepAnalysis(null);
    setCloneIdeas([]);
    setIdeas([]);
    setScript('');
    setDone(false);
    setError('');
  }

  async function generateIdeaScript(idea: CloneIdea) {
    if (!dna) return;
    setIdeaScript('');
    setIdeaScriptLoading(true);
    setIdeaScriptTitle(idea.title);
    try {
      const res = await fetch('/api/scripts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: `${idea.title} — ${idea.concept}`,
          videoLength: 1500,
          tensionLevel: 'medium',
          channelStyle: `Write in this channel's exact style:
Hook Style: ${dna.hookStyle}
Tone: ${dna.tone}
Pacing: ${dna.pacing}
Content Structure: ${dna.contentStructure}
Audience Relationship: ${dna.audienceRelationship}`,
        }),
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let scriptAccum = '';
      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6)) as { content?: string; done?: boolean; error?: string };
            if (event.content) {
              scriptAccum += event.content;
              setIdeaScript(scriptAccum);
            }
            if (event.error) {
              setIdeaScript(`Error: ${event.error}`);
            }
          } catch { /* skip */ }
        }
      }
    } catch {
      setIdeaScript('Script generation failed. Try again.');
    } finally {
      setIdeaScriptLoading(false);
    }
  }

  function addStatus(msg: string) {
    setStatuses(prev => [...prev.slice(-2), msg]);
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const newScreenshots: Screenshot[] = [];
    for (const file of Array.from(files).slice(0, 4)) {
      if (!file.type.startsWith('image/')) continue;
      const reader = new FileReader();
      await new Promise<void>(resolve => {
        reader.onload = () => {
          const dataUrl = reader.result as string;
          const [header, data] = dataUrl.split(',');
          const mediaType = header.replace('data:', '').replace(';base64', '');
          newScreenshots.push({ data, mediaType, preview: dataUrl });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    setScreenshots(prev => [...prev, ...newScreenshots].slice(0, 4));
  }

  async function analyze() {
    if (!channelUrl.trim()) return;
    reset();
    setLoading(true);
    try {
      const res = await fetch('/api/tools/channel-dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelUrl: channelUrl.trim(),
          screenshots: screenshots.map(s => ({ data: s.data, mediaType: s.mediaType })),
        }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let scriptAccum = '';

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6)) as {
              type: string;
              message?: string;
              data?: unknown;
              text?: string;
            };
            if (event.type === 'status') addStatus(event.message!);
            else if (event.type === 'channel') setChannel(event.data as ChannelData);
            else if (event.type === 'videos') setVideos(event.data as TopVideo[]);
            else if (event.type === 'dna') setDna(event.data as ChannelDNA);
            else if (event.type === 'deep_analysis') setDeepAnalysis(event.data as DeepAnalysis);
            else if (event.type === 'clone_ideas') setCloneIdeas(event.data as CloneIdea[]);
            else if (event.type === 'ideas') setIdeas(event.data as NicheSuggestion[]);
            else if (event.type === 'script_delta') {
              scriptAccum += event.text!;
              setScript(scriptAccum);
            }
            else if (event.type === 'done') setDone(true);
            else if (event.type === 'error') setError(event.message!);
          } catch { /* skip malformed */ }
        }
      }
    } catch {
      setError('Analysis failed. Please check the channel URL and try again.');
    } finally {
      setLoading(false);
    }
  }

  const canAnalyze = channelUrl.trim() && !loading;

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '40px 24px' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>

      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Channel DNA</h1>
      <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.4)', marginBottom: '28px', lineHeight: 1.6 }}>
        Paste any YouTube channel URL. We'll deep-analyze their title strategy, thumbnails, content structure, retention techniques, top/weakest videos — then generate 10 clone-ready video ideas with proven formats.
      </p>

      {/* Input */}
      <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
        <input
          value={channelUrl}
          onChange={e => setChannelUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && canAnalyze && analyze()}
          placeholder="https://youtube.com/@channelname"
          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '11px 14px', color: '#fff', fontSize: '15px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: '14px' }}
        />

        {/* Screenshot upload */}
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          style={{ border: '1px dashed rgba(255,255,255,0.15)', borderRadius: '8px', padding: screenshots.length ? '12px' : '20px 14px', cursor: 'pointer', textAlign: screenshots.length ? 'left' : 'center', marginBottom: '14px', background: 'rgba(255,255,255,0.02)', transition: 'border-color 0.2s' }}
        >
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
          {screenshots.length === 0 ? (
            <div>
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>📸</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Drop channel screenshots here <span style={{ color: 'rgba(255,255,255,0.25)' }}>(optional — thumbnails, homepage, etc.)</span></div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {screenshots.map((s, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={s.preview} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <button
                    onClick={ev => { ev.stopPropagation(); setScreenshots(prev => prev.filter((_, j) => j !== i)); }}
                    style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', borderRadius: '50%', background: '#111', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                  >✕</button>
                </div>
              ))}
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginLeft: '4px' }}>+ add more</div>
            </div>
          )}
        </div>

        <button
          onClick={analyze}
          disabled={!canAnalyze}
          style={{ width: '100%', padding: '12px', borderRadius: '10px', fontWeight: 700, fontSize: '16px', border: 'none', background: canAnalyze ? '#fff' : '#1a1a1a', color: canAnalyze ? '#000' : 'rgba(255,255,255,0.25)', cursor: canAnalyze ? 'pointer' : 'not-allowed' }}
        >
          {loading
            ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><span style={{ width: '14px', height: '14px', border: '2px solid rgba(0,0,0,0.2)', borderTop: '2px solid #000', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Analyzing…</span>
            : '🧬 Analyze Channel DNA'
          }
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#ff4d4d15', border: '1px solid #ff4d4d30', borderRadius: '8px', padding: '12px 16px', color: '#ff4d4d', fontSize: '14px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Live status */}
      {loading && statuses.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          {statuses.map((s, i) => <StatusLine key={i} message={s} />)}
        </div>
      )}

      {/* Channel card */}
      {channel && <ChannelCard channel={channel} />}

      {/* Top videos with ratio */}
      {videos.length > 0 && (
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Top Videos Analyzed</div>
          {channel && (
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginBottom: '12px' }}>
              Channel avg: {formatNum(Math.round(Number(channel.totalViews) / Math.max(Number(channel.videoCount), 1)))}/video
            </div>
          )}
          {videos.slice(0, 8).map((v, i) => {
            const avg = channel ? Math.round(Number(channel.totalViews) / Math.max(Number(channel.videoCount), 1)) : 0;
            const ratio = avg > 0 ? Math.round((Number(v.viewCount) / avg) * 10) / 10 : 0;
            const isHot = ratio >= 5;
            const isStrong = ratio >= 2;
            return (
              <div key={v.videoId} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', borderBottom: i < Math.min(7, videos.length - 1) ? '1px solid rgba(255,255,255,0.05)' : 'none', background: isHot ? 'rgba(245,158,11,0.04)' : 'transparent' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', minWidth: '16px', textAlign: 'right', fontWeight: 600 }}>{i + 1}</span>
                <a href={`https://youtube.com/watch?v=${v.videoId}`} target="_blank" rel="noreferrer" style={{ flex: 1, fontSize: '13px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</a>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{formatNum(v.viewCount)}</span>
                {ratio > 0 && (
                  <span style={{
                    fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: 10, flexShrink: 0,
                    background: isHot ? 'rgba(245,158,11,0.15)' : isStrong ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)',
                    color: isHot ? '#f59e0b' : isStrong ? '#22c55e' : 'rgba(255,255,255,0.4)',
                  }}>
                    {isHot && '🔥'}{ratio}x
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* DNA */}
      {dna && <DNACard dna={dna} />}

      {/* Deep Analysis */}
      {deepAnalysis && <DeepAnalysisCard analysis={deepAnalysis} />}

      {/* Clone Ideas */}
      {cloneIdeas.length > 0 && (
        <CloneIdeasCard
          ideas={cloneIdeas}
          dna={dna}
          channelName={channel?.name || ''}
          onGenerateScript={generateIdeaScript}
        />
      )}

      {/* Idea Script */}
      {(ideaScriptLoading || ideaScript) && (
        <div style={{ marginBottom: '20px' }}>
          {ideaScriptLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', background: '#111', borderRadius: '12px', border: '1px solid rgba(167,139,250,0.2)', marginBottom: '10px' }}>
              <div style={{ width: '14px', height: '14px', border: '2px solid rgba(167,139,250,0.2)', borderTop: '2px solid #a78bfa', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>Writing script for "{ideaScriptTitle}"...</span>
            </div>
          )}
          {ideaScript && <ScriptDisplay text={ideaScript} />}
        </div>
      )}

      {/* Niche suggestions */}
      {ideas.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🚀</span> 5 Niches Where This Style Would Win
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '14px' }}>
            Different niches you could enter using the exact same content approach — first niche gets a full script
          </div>
          {ideas.map((niche, i) => (
            <NicheCard key={i} niche={niche} index={i} isFirst={i === 0} />
          ))}
        </div>
      )}

      {/* Script */}
      {script && <ScriptDisplay text={script} />}

      {done && (
        <div style={{ textAlign: 'center', padding: '16px', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
          Analysis complete — paste a different channel URL to analyze another one
        </div>
      )}
    </div>
  );
}
