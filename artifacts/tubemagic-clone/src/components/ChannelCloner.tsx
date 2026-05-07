import { useState, useRef } from 'react';

interface ChannelData {
  id: string;
  name: string;
  description: string;
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

interface VideoIdea {
  title: string;
  angle: string;
  hook: string;
  why: string;
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

function IdeaCard({ idea, index, isFirst }: { idea: VideoIdea; index: number; isFirst: boolean }) {
  return (
    <div style={{ background: '#111', border: `1px solid ${isFirst ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '12px', padding: '18px 20px', marginBottom: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: isFirst ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.07)', color: isFirst ? '#34d399' : 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>{index + 1}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>{idea.title}</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4, marginBottom: '8px' }}>{idea.angle}</div>
          {isFirst && <div style={{ fontSize: '11px', fontWeight: 600, color: '#34d399', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '4px', padding: '2px 8px', display: 'inline-block', marginBottom: '8px' }}>★ Script generated for this idea</div>}
        </div>
      </div>
      <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', marginBottom: '8px', borderLeft: '2px solid rgba(255,255,255,0.15)' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>Opening Hook</div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', fontStyle: 'italic', lineHeight: 1.5 }}>"{idea.hook}"</div>
      </div>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>{idea.why}</div>
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
  const [ideas, setIdeas] = useState<VideoIdea[]>([]);
  const [script, setScript] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setStatuses([]);
    setChannel(null);
    setVideos([]);
    setDna(null);
    setIdeas([]);
    setScript('');
    setDone(false);
    setError('');
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
            else if (event.type === 'ideas') setIdeas(event.data as VideoIdea[]);
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
        Paste any YouTube channel URL. We'll analyze their top videos, transcripts, and style — then give you a DNA breakdown, 5 original ideas in their voice, and a full script.
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

      {/* Top videos */}
      {videos.length > 0 && (
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px 20px', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Top Videos Analyzed</div>
          {videos.slice(0, 8).map((v, i) => (
            <div key={v.videoId} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', borderBottom: i < Math.min(7, videos.length - 1) ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', minWidth: '16px', textAlign: 'right', fontWeight: 600 }}>{i + 1}</span>
              <a href={`https://youtube.com/watch?v=${v.videoId}`} target="_blank" rel="noreferrer" style={{ flex: 1, fontSize: '13px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</a>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>{formatNum(v.viewCount)} views</span>
            </div>
          ))}
        </div>
      )}

      {/* DNA */}
      {dna && <DNACard dna={dna} />}

      {/* Ideas */}
      {ideas.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>💡</span> 5 Original Video Ideas
          </div>
          {ideas.map((idea, i) => (
            <IdeaCard key={i} idea={idea} index={i} isFirst={i === 0} />
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
