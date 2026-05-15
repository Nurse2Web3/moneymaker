import { Router, type IRouter } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { generateImageBuffer, editImages } from "@workspace/integrations-openai-ai-server/image";
import { writeFileSync, unlinkSync, mkdtempSync } from "fs";
import { tmpdir } from "os";
import { fetchTopYouTubeVideos } from "../../utils/youtube.js";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import {
  GenerateTitlesBody,
  GenerateIdeasBody,
  GenerateDescriptionBody,
  GenerateTagsBody,
  GenerateSeoBundleBody,
} from "@workspace/api-zod";
import { scoreTitles } from "../../utils/titleScorer.js";

const execFileAsync = promisify(execFile);

// Calls fetch_transcript.py which uses youtube-transcript-api (Python) — bypasses YouTube's server-side blocks
async function fetchYouTubeTranscript(videoId: string): Promise<{ text: string; start: number; duration: number }[]> {
  const scriptPath = path.resolve(process.cwd(), "src/fetch_transcript.py");
  let stdout: string;
  try {
    const result = await execFileAsync("python3", [scriptPath, videoId], { timeout: 30000 });
    stdout = result.stdout;
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; message?: string };
    // execFile rejects on non-zero exit but stdout may still contain our JSON error
    stdout = e.stdout ?? "";
    if (!stdout) throw new Error(e.stderr ?? e.message ?? "Transcript fetch failed");
  }

  const data = JSON.parse(stdout.trim()) as { items?: { text: string; start: number; duration: number }[]; error?: string };
  if (data.error) throw new Error(data.error);
  if (!data.items || data.items.length === 0) throw new Error("No caption tracks found for this video.");
  return data.items;
}

function extractVideoId(input: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = input.match(p);
    if (m) return m[1];
  }
  return null;
}

const router: IRouter = Router();

const CURRENT_YEAR = new Date().getFullYear();


router.post("/tools/titles", async (req, res): Promise<void> => {
  const parsed = GenerateTitlesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { topic, channelNiche } = parsed.data;

  try {
    const query = channelNiche ? `${topic} ${channelNiche}` : topic;
    const topVideos = await fetchTopYouTubeVideos(query, 12);

    const ytContext = topVideos.length > 0
      ? `\n\nREAL YouTube data — top performing videos for "${query}" right now:\n${topVideos.map((v, i) =>
          `${i + 1}. "${v.title}" — ${Number(v.viewCount).toLocaleString()} views (${v.channel})`
        ).join("\n")}\n\nStudy the patterns in these real titles: word choice, structure, length, numbers used, emotional triggers. Your 5 titles must be grounded in what actually performs here.`
      : "";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      messages: [{
        role: "user",
        content: `Generate exactly 5 viral YouTube titles for the topic: "${topic}"${channelNiche ? ` in the ${channelNiche} niche` : ""}.
${ytContext}

The current year is ${CURRENT_YEAR}. If the topic is time-sensitive, use ${CURRENT_YEAR} — never a past year.

Rules:
- ALL 5 titles MUST be written in US English, regardless of the topic's language or what language the top videos above are in
- Max 70 characters each
- Inspired by what's actually working in the real data above — borrow the patterns, not the words
- Mix different angles: how-to, listicle, personal story, controversy, secret reveal
- Each title must feel dramatically different from the others
- Base view potential estimates on the real data you see above

Return ONLY a JSON array of 5 title strings. Example: ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"]`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const titles: string[] = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    const scoredTitles = scoreTitles(titles, CURRENT_YEAR);

    res.json({
      titles,
      scoredTitles,
      dataSource: topVideos.length > 0 ? `Analyzed ${topVideos.length} top YouTube videos` : null,
    });
  } catch (err) {
    req.log.error({ err }, "Title generation failed");
    res.status(500).json({ error: "Title generation failed" });
  }
});

router.post("/tools/seo-bundle", async (req, res): Promise<void> => {
  const parsed = GenerateSeoBundleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { topic, channelNiche } = parsed.data;

  try {
    const query = channelNiche ? `${topic} ${channelNiche}` : topic;
    const topVideos = await fetchTopYouTubeVideos(query, 12);
    const ytContext = topVideos.length > 0
      ? `\n\nREAL YouTube data — top performing videos for "${query}":\n${topVideos.map((v, i) =>
          `${i + 1}. "${v.title}" — ${Number(v.viewCount).toLocaleString()} views (${v.channel})`
        ).join("\n")}`
      : "";

    // Single Claude call returns the full bundle as one JSON object — avoids
    // 4 round-trips and keeps every output anchored to the same topic.
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: `You are creating a complete SEO bundle for a YouTube video on the topic: "${topic}"${channelNiche ? ` in the ${channelNiche} niche` : ""}.${ytContext}

Current year: ${CURRENT_YEAR} — never use a past year for time-sensitive references.

Return a JSON object with these exact fields:
{
  "titles": [5 candidate titles, each <= 70 chars, ranked best to worst],
  "description": "200-300 word YouTube description with a strong hook, what the viewer learns, 3-5 timestamps in mm:ss format, subscribe CTA, and 5-8 hashtags at the end",
  "tags": [15 SEO tags mixing broad and long-tail, ordered by search-volume potential],
  "hashtags": [5 hashtags including the # symbol]
}

Rules:
- ALL output (titles, description, tags, hashtags) MUST be written in US English, regardless of the topic's language or what language the top videos above are in
- Titles must mirror the patterns of the top videos in the data above
- **Description: the first 30-45 seconds of reading (roughly the first 75-110 words, BEFORE any timestamps) MUST naturally embed the top 5 keywords from your tags array.** Weave them into the hook conversationally — never keyword-stuff. YouTube's algorithm weights the description's opening heaviest, and front-loaded keywords are how the video ranks.
- Description must mention the main keyword in the first 2 sentences
- Tags must include singular + plural + qualified forms of the main keyword
- Hashtags must include #${topic.split(" ").join("")} variant where it reads naturally

Return ONLY the JSON object, no commentary, no markdown fence.`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "{}";
    const objMatch = text.match(/\{[\s\S]*\}/);
    const bundle = objMatch ? JSON.parse(objMatch[0]) : {};

    const titles = Array.isArray(bundle.titles) ? bundle.titles : [];
    res.json({
      titles: scoreTitles(titles, CURRENT_YEAR),
      description: bundle.description ?? "",
      tags: Array.isArray(bundle.tags) ? bundle.tags : [],
      hashtags: Array.isArray(bundle.hashtags) ? bundle.hashtags : [],
      dataSource: topVideos.length > 0 ? `Analyzed ${topVideos.length} top YouTube videos` : null,
    });
  } catch (err) {
    req.log.error({ err }, "SEO bundle generation failed");
    res.status(500).json({ error: "SEO bundle generation failed" });
  }
});

router.post("/tools/ideas", async (req, res): Promise<void> => {
  const parsed = GenerateIdeasBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { channelNiche, count = 8 } = parsed.data;

  try {
    const topVideos = await fetchTopYouTubeVideos(channelNiche, 15);

    const ytContext = topVideos.length > 0
      ? `\n\nREAL YouTube data — top performing videos in the "${channelNiche}" niche right now:\n${topVideos.map((v, i) =>
          `${i + 1}. "${v.title}" — ${Number(v.viewCount).toLocaleString()} views, ${Number(v.likeCount).toLocaleString()} likes (${v.channel}, ${v.publishedAt.slice(0,10)})`
        ).join("\n")}\n\nThis is what's actually getting views. Use this to:
- Identify content angles that are clearly working
- Spot gaps where demand exists but no one is covering it well
- Assign realistic view potential (Viral = 1M+, High = 100K+, Medium = 10K+, Low = under 10K) based on what you see`
      : "";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      messages: [{
        role: "user",
        content: `Generate ${count} high-potential YouTube video ideas for a channel in the "${channelNiche}" niche.
${ytContext}

Current year: ${CURRENT_YEAR}. Use ${CURRENT_YEAR} in titles where relevant — never a past year.

For each idea:
- Write a compelling, specific video title (not generic)
- 1-2 sentence description of what it covers and why viewers will want it
- Estimated view potential calibrated to the real data above

Return ONLY valid JSON array:
[
  {
    "title": "Specific Video Title Here",
    "description": "What this covers and why it will perform well based on the data.",
    "estimatedViews": "High"
  }
]`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const ideas = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    res.json({ ideas, dataSource: topVideos.length > 0 ? `Analyzed ${topVideos.length} top YouTube videos in this niche` : null });
  } catch (err) {
    req.log.error({ err }, "Idea generation failed");
    res.status(500).json({ error: "Idea generation failed" });
  }
});

router.post("/tools/description", async (req, res): Promise<void> => {
  const parsed = GenerateDescriptionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, script } = parsed.data;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      messages: [{
        role: "user",
        content: `Write a YouTube video description for a video titled: "${title}"
${script ? `\nScript (use this to generate accurate timestamps and content overview):\n${script.slice(0, 10000)}` : ""}

The current year is ${CURRENT_YEAR}. Use ${CURRENT_YEAR} for any date references — never use a past year.

The description should:
- Start with a compelling 2-3 sentence hook (this shows in search results)
- Include what the viewer will learn
- Have 3-5 relevant timestamps in format (e.g., 0:00 Intro, 1:30 Main Point)
- Include a subscribe CTA
- End with 5-8 relevant hashtags
- Be 200-300 words total

Return only the description text, no extra commentary.`,
      }],
    });

    const description = message.content[0].type === "text" ? message.content[0].text : "";
    res.json({ description });
  } catch (err) {
    req.log.error({ err }, "Description generation failed");
    res.status(500).json({ error: "Description generation failed" });
  }
});

router.post("/tools/tags", async (req, res): Promise<void> => {
  const parsed = GenerateTagsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, topic } = parsed.data;

  try {
    const query = topic ? `${title} ${topic}` : title;
    const topVideos = await fetchTopYouTubeVideos(query, 10);

    const ytContext = topVideos.length > 0
      ? `\n\nREAL YouTube data — top performing videos for this topic:\n${topVideos.map((v, i) =>
          `${i + 1}. "${v.title}" — ${Number(v.viewCount).toLocaleString()} views (${v.channel})`
        ).join("\n")}\n\nExtract the keyword patterns, phrases, and terminology that top videos in this space use. Your tags should mirror real search behavior.`
      : "";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      messages: [{
        role: "user",
        content: `Generate 20 high-SEO YouTube tags for a video titled: "${title}"${topic ? ` about: ${topic}` : ""}.
${ytContext}

Rules:
- Pull keyword terms and phrases that reflect what top videos in this space actually rank for
- Mix broad (1-2 words) and specific (3-5 words) tags
- Include the main keyword in multiple forms (singular, plural, with qualifiers)
- Include niche-specific terminology that real searchers use
- Order by search volume potential (highest first)

Return ONLY a JSON array of 20 tag strings: ["tag1", "tag2", ...]`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const tags = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    res.json({ tags, dataSource: topVideos.length > 0 ? `Analyzed ${topVideos.length} top YouTube videos` : null });
  } catch (err) {
    req.log.error({ err }, "Tag generation failed");
    res.status(500).json({ error: "Tag generation failed" });
  }
});

router.post("/tools/improve-script", async (req, res): Promise<void> => {
  const { script, focusAreas } = req.body as { script: string; focusAreas?: string[] };
  if (!script?.trim()) {
    res.status(400).json({ error: "script is required" });
    return;
  }

  const areas = (focusAreas || []).join(", ") || "hooks, open loops, pacing, pattern interrupts, CTA";

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: `You are an elite YouTube script editor trained on the highest-retention videos ever made. Your job is to rewrite scripts using the TENSION ENGINE — making them dramatically more engaging without changing the core topic or information.

REWRITING RULES:
- Keep all the same information and key points
- Transform weak openers into powerful hooks
- Add open loops that keep viewers watching
- Insert pattern interrupts every 60-90 seconds
- Escalate stakes throughout
- End every section with a micro-hook to the next
- Rewrite the CTA to feel urgent and personal
- The rewritten script should feel like a completely different, dramatically more engaging version

Current year: ${CURRENT_YEAR}`,
      messages: [{
        role: "user",
        content: `Rewrite this YouTube script with a focus on: ${areas}

ORIGINAL SCRIPT:
${script}

Rewrite the entire script from top to bottom, applying the tension engine throughout. Mark significantly improved sections with [IMPROVED] at the start of that section. Keep the same structure and information but make every sentence earn its place.`,
      }],
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
      }
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Script improvement failed");
    res.write(`data: ${JSON.stringify({ error: "Script improvement failed. Please try again." })}\n\n`);
    res.end();
  }
});

router.post("/tools/hooks", async (req, res): Promise<void> => {
  const { topic } = req.body as { topic: string };
  if (!topic?.trim()) {
    res.status(400).json({ error: "topic is required" });
    return;
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      messages: [{
        role: "user",
        content: `Generate exactly 6 viral YouTube video hooks for the topic: "${topic}"

Current year: ${CURRENT_YEAR}

Generate one hook for each of these styles:
1. Bold Claim
2. Shocking Stat
3. Question
4. Personal Story
5. Controversy
6. Pattern Interrupt

For each hook provide:
- The hook text (2-4 sentences max, spoken naturally as if starting a video)
- The style name (exactly as listed above)
- A brief "why it works" explanation (1 sentence)

Return ONLY valid JSON array:
[
  {
    "style": "Bold Claim",
    "hook": "The hook text here...",
    "why": "Why this hook works in one sentence."
  }
]`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const hooks = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    res.json({ hooks });
  } catch (err) {
    req.log.error({ err }, "Hook generation failed");
    res.status(500).json({ error: "Hook generation failed" });
  }
});

router.post("/tools/thumbnail-text", async (req, res): Promise<void> => {
  const { title, niche } = req.body as { title: string; niche?: string };
  if (!title?.trim()) {
    res.status(400).json({ error: "title is required" });
    return;
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      messages: [{
        role: "user",
        content: `Generate 5 high-CTR thumbnail text overlay suggestions for a YouTube video titled: "${title}"${niche ? ` in the ${niche} niche` : ""}.

Current year: ${CURRENT_YEAR}

Thumbnail text must:
- Be SHORT (main text: 1-5 words max, sub text: 2-6 words max)
- Create curiosity or urgency at a glance
- Work visually on a thumbnail (all caps is common)
- Not repeat the full title

For each suggestion provide:
- mainText: The primary large text (1-5 words, usually all caps)
- subText: Secondary smaller text or empty string if not needed (2-6 words)
- style: One of "Number/List", "Shock/Curiosity", "Personal Result", "Versus/Comparison", "Question", "Bold Statement"
- colorScheme: Brief color suggestion (e.g. "Red + White", "Yellow + Black")
- why: One sentence explaining why it drives clicks

Return ONLY valid JSON array:
[
  {
    "mainText": "I TRIED THIS",
    "subText": "for 30 days straight",
    "style": "Personal Result",
    "colorScheme": "Yellow + Black",
    "why": "First-person framing creates curiosity about the result."
  }
]`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    res.json({ suggestions });
  } catch (err) {
    req.log.error({ err }, "Thumbnail text generation failed");
    res.status(500).json({ error: "Thumbnail text generation failed" });
  }
});

router.post("/tools/thumbnail-generate", async (req, res): Promise<void> => {
  const { title, niche, mainText, subText, style, colorScheme, aspectRatio = "16:9" } = req.body as {
    title: string; niche?: string; mainText: string; subText?: string;
    style: string; colorScheme: string; aspectRatio?: "16:9" | "9:16";
  };
  if (!mainText?.trim()) {
    res.status(400).json({ error: "mainText is required" });
    return;
  }

  const colorMap: Record<string, string> = {
    "Red + White": "bold red background with white text",
    "Yellow + Black": "bright yellow background with black text",
    "Black + Gold": "deep black background with gold/yellow text",
    "Blue + White": "deep blue background with white text",
    "Orange + Black": "vivid orange background with black text",
    "Green + White": "dark green background with white text",
    "Purple + Yellow": "rich purple background with yellow text",
    "White + Black": "clean white background with black text",
  };

  const bgDesc = colorMap[colorScheme] || `${colorScheme.toLowerCase()} color scheme`;

  const styleDesc: Record<string, string> = {
    "Number/List": "bold numbered list style, eye-catching typography",
    "Shock/Curiosity": "dramatic, shocking composition that demands attention",
    "Personal Result": "personal achievement style with result-focused layout",
    "Versus/Comparison": "split comparison layout, before and after",
    "Question": "curiosity-driven layout with question mark emphasis",
    "Bold Statement": "powerful bold statement typography, high contrast",
  };

  const isPortrait = aspectRatio === "9:16";
  const ratioDesc = isPortrait
    ? "9:16 vertical portrait, TikTok / YouTube Shorts style, 1080x1920 pixels, tall composition"
    : "16:9 horizontal landscape, standard YouTube thumbnail, 1280x720 pixels, wide composition";
  const imageSize = isPortrait ? "1024x1536" : "1536x1024";

  const prompt = `YouTube ${isPortrait ? "Shorts cover" : "thumbnail"}, ${bgDesc}, ${styleDesc[style] || "high contrast design"}.
Large bold text "${mainText}"${subText ? `, smaller text below "${subText}"` : ""}.
${niche ? `Topic: ${niche}.` : ""}${title ? ` Video: "${title}".` : ""}
Professional design, ${ratioDesc}, high contrast, easy to read at small size.
Clean composition, no watermarks, no borders. Text must be perfectly legible, large and centered. Modern graphic design style.`;

  try {
    const buffer = await generateImageBuffer(prompt, imageSize);
    res.json({ image: buffer.toString("base64") });
  } catch (err) {
    req.log.error({ err }, "Thumbnail image generation failed");
    res.status(500).json({ error: "Thumbnail image generation failed" });
  }
});

// Claude prompt enhancer — takes a rough idea and writes a pro image gen prompt
async function enhancePromptWithClaude(rawPrompt: string, aspectRatio: string): Promise<string> {
  const isPortrait = aspectRatio === "9:16";
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    messages: [{
      role: "user",
      content: `You are a YouTube thumbnail prompt engineer. Take this rough idea and write a detailed, vivid image generation prompt that will produce a viral MrBeast-level thumbnail.

Rough idea: "${rawPrompt}"
Aspect ratio: ${isPortrait ? "9:16 portrait (Shorts)" : "16:9 landscape (YouTube)"}

Rules:
- Be extremely specific about composition, colors, lighting, expressions
- Include dramatic lighting, high contrast, bold colors
- If the user mentions text, describe it as HUGE bold text with thick outlines
- Describe the scene like a movie director — camera angle, depth of field, emotion
- Keep it under 200 words
- Output ONLY the prompt, nothing else`,
    }],
  });
  const block = msg.content[0];
  return block.type === "text" ? block.text : rawPrompt;
}

router.post("/tools/thumbnail-ai", async (req, res): Promise<void> => {
  const { prompt, referenceImage, aspectRatio = "16:9", claudeEnhance = false } = req.body as {
    prompt: string;
    referenceImage?: string;
    aspectRatio?: "16:9" | "9:16";
    claudeEnhance?: boolean;
  };
  if (!prompt?.trim()) {
    res.status(400).json({ error: "prompt is required" });
    return;
  }

  const isPortrait = aspectRatio === "9:16";
  const imageSize = isPortrait ? "1024x1536" : "1536x1024";

  try {
    // Step 1: Optionally enhance prompt with Claude
    let finalPrompt: string;
    if (claudeEnhance) {
      finalPrompt = await enhancePromptWithClaude(prompt, aspectRatio);
    } else {
      finalPrompt = `Create a viral YouTube ${isPortrait ? "Shorts cover" : "thumbnail"} image.
${prompt}
Style: MrBeast-level production quality. Bold, high contrast, eye-catching at small size.
Requirements:
- Professional YouTube thumbnail composition
- ${isPortrait ? "9:16 vertical portrait, 1080x1920" : "16:9 horizontal landscape, 1280x720"}
- Dramatic lighting and vivid colors
- If text is included, make it HUGE, bold, with thick outlines
- Clean composition, no watermarks, no borders
- Designed to maximize click-through rate`;
    }

    // Step 2: Generate with OpenAI GPT Image-1
    let buffer: Buffer;

    if (referenceImage) {
      const tmpDir = mkdtempSync(path.join(tmpdir(), "thumb-"));
      const tmpFile = path.join(tmpDir, "ref.png");
      try {
        const imgBuffer = Buffer.from(referenceImage, "base64");
        writeFileSync(tmpFile, imgBuffer);
        buffer = await editImages([tmpFile], finalPrompt);
      } finally {
        try { unlinkSync(tmpFile); } catch {}
      }
    } else {
      buffer = await generateImageBuffer(finalPrompt, imageSize);
    }

    res.json({ image: buffer.toString("base64") });
  } catch (err) {
    req.log.error({ err }, "AI thumbnail generation failed");
    const message = err instanceof Error ? err.message : "AI thumbnail generation failed";
    res.status(500).json({ error: message });
  }
});

router.post("/tools/niche-analysis", async (req, res): Promise<void> => {
  const { niche, channelDescription } = req.body as { niche: string; channelDescription?: string };
  if (!niche?.trim()) {
    res.status(400).json({ error: "niche is required" });
    return;
  }

  try {
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    let topVideos: {
      title: string; channel: string; publishedAt: string;
      videoId: string; thumbnail: string;
      viewCount: string; likeCount: string; commentCount: string;
    }[] = [];

    if (YOUTUBE_API_KEY) {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&order=viewCount&q=${encodeURIComponent(niche)}&maxResults=15&key=${YOUTUBE_API_KEY}`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json() as {
        items?: { id: { videoId: string }; snippet: { title: string; channelTitle: string; publishedAt: string; thumbnails: { medium: { url: string } } } }[]
      };

      if (searchData.items && searchData.items.length > 0) {
        const videoIds = searchData.items.map(v => v.id.videoId).join(",");
        const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
        const statsRes = await fetch(statsUrl);
        const statsData = await statsRes.json() as {
          items?: { id: string; statistics: { viewCount?: string; likeCount?: string; commentCount?: string } }[]
        };

        const statsMap: Record<string, { viewCount?: string; likeCount?: string; commentCount?: string }> = {};
        if (statsData.items) {
          for (const v of statsData.items) statsMap[v.id] = v.statistics;
        }

        topVideos = searchData.items.map(v => ({
          title: v.snippet.title,
          channel: v.snippet.channelTitle,
          publishedAt: v.snippet.publishedAt,
          videoId: v.id.videoId,
          thumbnail: v.snippet.thumbnails.medium.url,
          viewCount: statsMap[v.id.videoId]?.viewCount || "0",
          likeCount: statsMap[v.id.videoId]?.likeCount || "0",
          commentCount: statsMap[v.id.videoId]?.commentCount || "0",
        }));
      }
    }

    const ytContext = topVideos.length > 0
      ? `\n\nREAL YOUTUBE DATA for "${niche}" (top 15 videos by views):\n${topVideos.map((v, i) =>
          `${i + 1}. "${v.title}" by ${v.channel} — ${Number(v.viewCount).toLocaleString()} views, ${Number(v.likeCount).toLocaleString()} likes, published ${v.publishedAt.slice(0, 10)}`
        ).join("\n")}\n\nUse this real data to make your analysis accurate — reference actual view counts, title patterns you observe, and what the data reveals about this niche.`
      : "";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      messages: [{
        role: "user",
        content: `Perform a deep content strategy analysis for a YouTube channel in the "${niche}" niche.
${channelDescription ? `Channel description: ${channelDescription}` : ""}
${ytContext}

Current year: ${CURRENT_YEAR}

Return a comprehensive analysis as valid JSON with this exact structure:
{
  "summary": "2-3 sentence overview grounded in the real data — mention actual view counts, what the top videos reveal, and realistic opportunity assessment",
  "marketSize": "Small|Medium|Large|Massive",
  "competition": "Low|Medium|High|Very High",
  "revenuePotential": "Low|Medium|High|Very High",
  "avgTopViews": number (average views of top videos you see in the data, or your estimate),
  "opportunities": [
    {
      "title": "Specific content opportunity title based on gaps in the real data",
      "description": "2 sentence description referencing what the data shows is missing or underserved",
      "potential": "High|Viral|Medium"
    }
  ],
  "titlePatterns": ["Pattern 1 observed in top titles", "Pattern 2", "Pattern 3"],
  "contentGaps": [
    {
      "gap": "Specific underserved content area not covered by top videos",
      "why": "Why this gap exists based on what you see in the real data"
    }
  ],
  "topFormats": [
    {
      "format": "Format name",
      "description": "Why this format works in this niche based on what you see working",
      "examples": "2-3 example video titles you would make"
    }
  ],
  "avoidMistakes": ["Mistake 1", "Mistake 2", "Mistake 3", "Mistake 4"],
  "quickWins": ["Quick win 1", "Quick win 2", "Quick win 3", "Quick win 4", "Quick win 5"]
}

Provide exactly: 4 opportunities, 3 title patterns, 4 content gaps, 3 top formats, 4 mistakes, 5 quick wins.
Return ONLY the JSON object, no extra text.`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    res.json({ analysis, topVideos });
  } catch (err) {
    req.log.error({ err }, "Niche analysis failed");
    res.status(500).json({ error: "Niche analysis failed" });
  }
});

router.post("/tools/analyze-video", async (req, res): Promise<void> => {
  const { url } = req.body as { url: string };
  if (!url?.trim()) {
    res.status(400).json({ error: "url is required" });
    return;
  }

  const videoId = extractVideoId(url.trim());
  if (!videoId) {
    res.status(400).json({ error: "Could not extract a valid YouTube video ID from the URL." });
    return;
  }

  try {
    const transcriptItems = await fetchYouTubeTranscript(videoId);
    if (!transcriptItems || transcriptItems.length === 0) {
      res.status(400).json({ error: "No transcript found. This video may not have captions enabled." });
      return;
    }

    const fullText = transcriptItems.map(t => t.text).join(" ");
    const wordCount = fullText.split(/\s+/).length;
    const previewText = fullText.slice(0, 12000);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      messages: [{
        role: "user",
        content: `You are an expert YouTube script analyst trained on thousands of high-retention videos. Analyze this YouTube video transcript and provide a comprehensive breakdown.

TRANSCRIPT (${wordCount} words total):
${previewText}${wordCount > 2500 ? "\n[Transcript truncated for analysis]" : ""}

Current year: ${CURRENT_YEAR}

Return ONLY valid JSON with this exact structure:
{
  "overallScore": number (1-10 overall script quality),
  "hookType": "string (one of: Bold Claim, Shocking Stat, Question, Personal Story, Controversy, Pattern Interrupt, Number List, Curiosity Gap)",
  "hookScore": number (1-10),
  "hookText": "The exact opening line(s) used as the hook (first 1-3 sentences)",
  "hookBreakdown": "2-3 sentences explaining exactly why this hook works or doesn't, what psychological trigger it uses",
  "scoreBreakdown": [
    { "category": "Hook", "score": number, "note": "brief note" },
    { "category": "Structure", "score": number, "note": "brief note" },
    { "category": "Tension", "score": number, "note": "brief note" },
    { "category": "Pacing", "score": number, "note": "brief note" }
  ],
  "structure": [
    {
      "section": "Section name (e.g. Hook, Open Loop, Context, Main Point 1, Climax, CTA)",
      "timestamp": "Approximate time marker (e.g. 0:00-0:30)",
      "description": "What happens in this section and how it's executed",
      "technique": "Tension Engine technique used, if any (e.g. Open Loop, Pattern Interrupt, Stakes Escalation) or empty string"
    }
  ],
  "tensionTechniques": [
    {
      "technique": "Technique name",
      "where": "Approximate timestamp or section",
      "effectiveness": "1 sentence on how well it's used"
    }
  ],
  "retentionMoments": [
    {
      "moment": "Brief label for this high-retention moment",
      "timestamp": "Approximate timestamp",
      "why": "Why viewers would keep watching here"
    }
  ],
  "weakPoints": [
    {
      "issue": "Brief label of the weak point",
      "timestamp": "Approximate timestamp",
      "fix": "Specific actionable fix"
    }
  ],
  "stealableFormula": "2-3 sentences describing the exact formula this creator uses that could be replicated for any topic — be specific about structure, hook type, pacing pattern, and CTA style",
  "titleSuggestions": ["5 titles using this same formula but for different but related topics"]
}

Provide exactly: 4 score breakdown items, 4-8 structure sections, 2-4 tension techniques, 3 retention moments, 3 weak points, 5 title suggestions.`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    res.json({ analysis, transcript: transcriptItems.slice(0, 200) });
  } catch (err: unknown) {
    req.log.error({ err }, "Video analysis failed");
    const msg = err instanceof Error ? err.message : "Analysis failed";
    if (msg.includes("caption") || msg.includes("transcript") || msg.includes("No caption") || msg.includes("404") || msg.includes("403")) {
      res.status(400).json({ error: "Transcript not available for this video. It may have captions disabled, be age-restricted, or private." });
    } else {
      res.status(500).json({ error: `Video analysis failed: ${msg}` });
    }
  }
});

router.post("/tools/niche-discovery", async (req, res): Promise<void> => {
  try {
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      messages: [{
        role: "user",
        content: `You are a YouTube monetization expert. Suggest 8 profitable YouTube niches that someone could realistically start in ${CURRENT_YEAR} and make money from within 6-12 months.

For each niche, be specific (not "fitness" — say "home workouts for busy moms over 40"). Focus on niches with:
- High advertiser CPM ($8-40+)
- Growing search demand in ${CURRENT_YEAR}
- Achievable for a solo creator
- Not completely dominated by mega-channels

Return ONLY valid JSON array:
[
  {
    "niche": "Specific niche name",
    "searchQuery": "The YouTube search query to research this niche",
    "why": "1-2 sentences on why this niche is profitable right now",
    "cpmRange": "$X-$Y",
    "difficulty": "Beginner|Intermediate|Advanced",
    "contentIdeas": ["Idea 1", "Idea 2", "Idea 3"],
    "icon": "single emoji that represents this niche"
  }
]`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    let niches = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    if (YOUTUBE_API_KEY && niches.length > 0) {
      niches = await Promise.all(niches.map(async (n: { niche: string; searchQuery: string; why: string; cpmRange: string; difficulty: string; contentIdeas: string[]; icon: string }) => {
        try {
          const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&order=viewCount&q=${encodeURIComponent(n.searchQuery)}&maxResults=5&key=${YOUTUBE_API_KEY}`;
          const searchRes = await fetch(searchUrl);
          const searchData = await searchRes.json() as { items?: { id: { videoId: string } }[] };
          if (!searchData.items || searchData.items.length === 0) return n;

          const videoIds = searchData.items.map((v: { id: { videoId: string } }) => v.id.videoId).join(",");
          const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
          const statsRes = await fetch(statsUrl);
          const statsData = await statsRes.json() as { items?: { statistics: { viewCount?: string } }[] };

          let totalViews = 0;
          let count = 0;
          if (statsData.items) {
            for (const v of statsData.items) {
              if (v.statistics.viewCount) { totalViews += Number(v.statistics.viewCount); count++; }
            }
          }
          const avgViews = count > 0 ? Math.round(totalViews / count) : 0;
          return { ...n, avgTopViews: avgViews };
        } catch { return n; }
      }));
    }

    res.json({ niches });
  } catch (err) {
    req.log.error({ err }, "Niche discovery failed");
    res.status(500).json({ error: "Niche discovery failed" });
  }
});

// ──────────────────────────────────────────────
// Channel DNA helpers
// ──────────────────────────────────────────────

function parseChannelInfo(url: string): { type: 'handle' | 'id' | 'username' | 'search'; value: string } | null {
  const u = url.trim();
  const handleMatch = u.match(/youtube\.com\/@([^/?&\s]+)/);
  if (handleMatch) return { type: 'handle', value: `@${handleMatch[1]}` };
  const channelIdMatch = u.match(/youtube\.com\/channel\/(UC[^/?&\s]+)/);
  if (channelIdMatch) return { type: 'id', value: channelIdMatch[1] };
  const userMatch = u.match(/youtube\.com\/user\/([^/?&\s]+)/);
  if (userMatch) return { type: 'username', value: userMatch[1] };
  const customMatch = u.match(/youtube\.com\/c\/([^/?&\s]+)/);
  if (customMatch) return { type: 'search', value: customMatch[1] };
  const bareHandle = u.match(/^@([^/?&\s]+)$/);
  if (bareHandle) return { type: 'handle', value: `@${bareHandle[1]}` };
  return null;
}

async function fetchChannelData(channelUrl: string, apiKey: string) {
  const info = parseChannelInfo(channelUrl);
  if (!info) throw new Error("Could not parse channel URL. Please use a full YouTube channel URL like https://youtube.com/@channelname");

  let channelApiUrl = '';
  if (info.type === 'handle') {
    channelApiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${encodeURIComponent(info.value)}&key=${apiKey}`;
  } else if (info.type === 'id') {
    channelApiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${info.value}&key=${apiKey}`;
  } else if (info.type === 'username') {
    channelApiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forUsername=${info.value}&key=${apiKey}`;
  } else {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(info.value)}&maxResults=1&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json() as { items?: { id: { channelId: string } }[] };
    if (!searchData.items?.length) throw new Error("Channel not found. Try pasting the full channel URL.");
    channelApiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${searchData.items[0].id.channelId}&key=${apiKey}`;
  }

  const channelRes = await fetch(channelApiUrl);
  const channelData = await channelRes.json() as {
    items?: {
      id: string;
      snippet: { title: string; description: string; publishedAt: string; thumbnails: { default: { url: string } } };
      statistics: { subscriberCount?: string; videoCount?: string; viewCount?: string };
    }[];
  };

  if (!channelData.items?.length) throw new Error("Channel not found. Please check the URL and try again.");
  const ch = channelData.items[0];
  return {
    id: ch.id,
    name: ch.snippet.title,
    description: ch.snippet.description,
    publishedAt: ch.snippet.publishedAt,
    thumbnail: ch.snippet.thumbnails.default.url,
    subscribers: ch.statistics.subscriberCount || '0',
    videoCount: ch.statistics.videoCount || '0',
    totalViews: ch.statistics.viewCount || '0',
  };
}

async function fetchChannelTopVideos(channelId: string, apiKey: string, maxResults = 10) {
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=viewCount&maxResults=${maxResults}&key=${apiKey}`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json() as {
    items?: { id: { videoId: string }; snippet: { title: string; publishedAt: string } }[];
  };
  if (!searchData.items?.length) return [];

  const videoIds = searchData.items.map(v => v.id.videoId).join(',');
  const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${apiKey}`;
  const statsRes = await fetch(statsUrl);
  const statsData = await statsRes.json() as {
    items?: { id: string; statistics: { viewCount?: string; likeCount?: string } }[];
  };
  const statsMap: Record<string, { viewCount?: string; likeCount?: string }> = {};
  for (const v of statsData.items ?? []) statsMap[v.id] = v.statistics;

  return searchData.items.map(v => ({
    videoId: v.id.videoId,
    title: v.snippet.title,
    publishedAt: v.snippet.publishedAt,
    viewCount: statsMap[v.id.videoId]?.viewCount || '0',
    likeCount: statsMap[v.id.videoId]?.likeCount || '0',
  }));
}

// ──────────────────────────────────────────────
// POST /api/tools/channel-dna
// ──────────────────────────────────────────────
router.post("/tools/channel-dna", async (req, res): Promise<void> => {
  const { channelUrl, screenshots } = req.body as {
    channelUrl: string;
    screenshots?: { data: string; mediaType: string }[];
  };

  if (!channelUrl?.trim()) {
    res.status(400).json({ error: "channelUrl is required" });
    return;
  }

  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  if (!YOUTUBE_API_KEY) {
    res.status(500).json({ error: "YouTube API key not configured" });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  // Heartbeat — keeps the proxy from closing the SSE connection during long ops
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 10000);

  try {
    send({ type: 'status', message: 'Looking up channel…' });
    const channel = await fetchChannelData(channelUrl, YOUTUBE_API_KEY);
    send({ type: 'channel', data: channel });

    send({ type: 'status', message: 'Loading top videos…' });
    const topVideos = await fetchChannelTopVideos(channel.id, YOUTUBE_API_KEY, 10);
    send({ type: 'videos', data: topVideos });

    // Fetch transcripts for top 3 videos IN PARALLEL with a per-video timeout
    send({ type: 'status', message: 'Reading transcripts (up to 3 videos in parallel)…' });
    const transcriptTargets = topVideos.slice(0, 3);
    const transcriptResults = await Promise.allSettled(
      transcriptTargets.map(v =>
        Promise.race([
          fetchYouTubeTranscript(v.videoId),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 18000)),
        ]).then(segments => ({
          title: v.title,
          text: (segments as { text: string }[]).map(s => s.text).join(' ').slice(0, 3500),
        }))
      )
    );
    const transcripts = transcriptResults
      .filter((r): r is PromiseFulfilledResult<{ title: string; text: string }> => r.status === 'fulfilled')
      .map(r => r.value);

    send({ type: 'status', message: 'Analyzing channel DNA with AI…' });

    const videoListText = topVideos.map((v, i) =>
      `${i + 1}. "${v.title}" — ${Number(v.viewCount).toLocaleString()} views`
    ).join('\n');

    const transcriptText = transcripts.length > 0
      ? transcripts.map((t, i) => `\n--- TRANSCRIPT ${i + 1}: "${t.title}" ---\n${t.text}`).join('\n')
      : '\n(Transcripts unavailable — analyze from titles, description, and any screenshots provided)';

    type ClaudeContent =
      | { type: 'text'; text: string }
      | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } };

    const dnaContent: ClaudeContent[] = [
      {
        type: 'text',
        text: `You are a YouTube channel strategist. Analyze this channel's content DNA from its top videos and transcripts.

CHANNEL: ${channel.name}
SUBSCRIBERS: ${Number(channel.subscribers).toLocaleString()}
CHANNEL CREATED: ${new Date(channel.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} (${Math.floor((Date.now() - new Date(channel.publishedAt).getTime()) / 86400000)} days old — use this exact age, do NOT estimate)
DESCRIPTION: ${channel.description.slice(0, 500)}

TOP VIDEOS (by views):
${videoListText}

TRANSCRIPTS:
${transcriptText}

Return ONLY valid JSON:
{
  "hookStyle": "Describe their hook style in 1-2 sentences",
  "tone": "Tone/voice (e.g., authoritative and direct, conversational and warm, comedic and self-deprecating)",
  "pacing": "Content pacing (e.g., rapid-fire info, slow-burn storytelling, tight fast-cut energy)",
  "contentStructure": "Their typical video structure",
  "recurringPhrases": ["phrase 1", "phrase 2", "phrase 3"],
  "emotionalTriggers": ["trigger 1", "trigger 2", "trigger 3"],
  "uniquePatterns": ["pattern 1", "pattern 2", "pattern 3"],
  "audienceRelationship": "How they relate to / speak to their audience",
  "summary": "2-3 sentence DNA summary a new creator could follow"
}`,
      },
    ];

    if (screenshots?.length) {
      for (const s of screenshots.slice(0, 4)) {
        dnaContent.push({
          type: 'image',
          source: { type: 'base64', media_type: s.mediaType, data: s.data },
        });
      }
      dnaContent.push({
        type: 'text',
        text: 'Also use these channel screenshots to inform the DNA analysis — pay attention to thumbnail style, color palette, facial expressions, text overlay patterns, and visual branding.',
      });
    }

    const dnaMsg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: dnaContent }],
    });
    const dnaText = dnaMsg.content[0].type === 'text' ? dnaMsg.content[0].text : '{}';
    const dnaMatch = dnaText.match(/\{[\s\S]*\}/);
    const dna = dnaMatch ? JSON.parse(dnaMatch[0]) : {};
    send({ type: 'dna', data: dna });

    // Deep analysis: title strategy, thumbnail strategy, top/weakest videos, upload frequency
    send({ type: 'status', message: 'Analyzing title strategy, thumbnails, and performance patterns (Opus)…' });
    const deepMsg = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `You are an elite YouTube analyst. Perform a DEEP analysis of this channel based on its top videos and transcripts.

CHANNEL: ${channel.name}
SUBSCRIBERS: ${Number(channel.subscribers).toLocaleString()}
VIDEOS: ${channel.videoCount}
TOTAL VIEWS: ${Number(channel.totalViews).toLocaleString()}

TOP VIDEOS (by views):
${videoListText}

TRANSCRIPTS:
${transcriptText}

Return ONLY valid JSON:
{
  "titleStrategy": {
    "patterns": "What title formulas do they use repeatedly? (questions, numbers, how-to, controversy, etc.)",
    "lengthAvg": "Average title length and style",
    "emotionalTriggers": "What emotions do their titles target?",
    "topTechniques": ["technique 1", "technique 2", "technique 3"]
  },
  "thumbnailStrategy": {
    "style": "Describe their thumbnail visual style (faces, text, colors, composition)",
    "textUsage": "How do they use text on thumbnails?",
    "consistencyScore": "Rate 1-10 how consistent their thumbnails are",
    "whatWorks": "What makes their best thumbnails click-worthy?"
  },
  "contentStructure": {
    "hookStyle": "How do they open videos? (first 15 seconds)",
    "bodyFormat": "Storytelling, listicle, tutorial, case study, etc.",
    "pacingNotes": "Fast, slow, mixed? How do they maintain retention?",
    "retentionTechniques": ["technique 1", "technique 2", "technique 3"],
    "ctaStyle": "How do they close and what do they ask viewers to do?"
  },
  "uploadFrequency": {
    "schedule": "How often do they upload? (daily, weekly, etc.)",
    "consistency": "How consistent is the schedule?",
    "bestDays": "What days/times seem to work best?"
  },
  "top5Titles": [
    { "title": "video title", "views": "view count", "whyItWorks": "1 sentence on why this title performs" }
  ],
  "weakest5": [
    { "title": "video title", "views": "view count", "whyItFlopped": "1 sentence on why it underperformed" }
  ]
}`,
      }],
    });
    const deepText = deepMsg.content[0].type === 'text' ? deepMsg.content[0].text : '{}';
    const deepMatch = deepText.match(/\{[\s\S]*\}/);
    const deepAnalysis = deepMatch ? JSON.parse(deepMatch[0]) : {};
    send({ type: 'deep_analysis', data: deepAnalysis });

    // Generate 10 video ideas based on gaps and patterns found
    send({ type: 'status', message: 'Generating 10 clone-ready video ideas (Opus)…' });
    const cloneIdeasMsg = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `You are a YouTube strategist. Based on this deep channel analysis, generate 10 video ideas that someone could create for THEIR OWN channel by cloning the winning formulas found.

CHANNEL ANALYZED: ${channel.name}
DNA: ${dna.summary || ''}
Title Strategy: ${deepAnalysis.titleStrategy?.patterns || ''}
Content Format: ${deepAnalysis.contentStructure?.bodyFormat || ''}
Retention Techniques: ${JSON.stringify(deepAnalysis.contentStructure?.retentionTechniques || [])}
What works in thumbnails: ${deepAnalysis.thumbnailStrategy?.whatWorks || ''}
Top performing titles: ${JSON.stringify(deepAnalysis.top5Titles || [])}
Weakest titles: ${JSON.stringify(deepAnalysis.weakest5 || [])}

Generate 10 video ideas based on:
- Gaps found (topics they haven't covered that their audience would want)
- Winning patterns (replicate what works, avoid what doesn't)
- Proven formats (use their best content structure)

Return ONLY a valid JSON array:
[
  {
    "title": "A proven-format video title ready to use",
    "thumbnailText": "The 3-5 word text overlay for the thumbnail",
    "concept": "One sentence explaining the angle and why it would work",
    "format": "storytelling | listicle | tutorial | case study | reaction | comparison"
  }
]`,
      }],
    });
    const cloneIdeasText = cloneIdeasMsg.content[0].type === 'text' ? cloneIdeasMsg.content[0].text : '[]';
    const cloneIdeasMatch = cloneIdeasText.match(/\[[\s\S]*\]/);
    const cloneIdeas = cloneIdeasMatch ? JSON.parse(cloneIdeasMatch[0]) : [];
    send({ type: 'clone_ideas', data: cloneIdeas });

    // Generate 5 niche transfer suggestions
    send({ type: 'status', message: 'Finding niches where this style would dominate…' });
    const ideasMsg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `You are a YouTube strategist. This channel has a specific content style and DNA. Your job is to identify 5 COMPLETELY DIFFERENT NICHES where someone could apply the EXACT SAME style, format, and approach to build a new successful channel from scratch.

Do NOT suggest more content for the same channel. Suggest entirely new channel niches that would benefit from this style being applied there.

CHANNEL DNA:
Original Niche: ${channel.name} (use this ONLY to know what NOT to suggest — pick completely different niches)
Hook Style: ${dna.hookStyle || ''}
Tone: ${dna.tone || ''}
Pacing: ${dna.pacing || ''}
Content Structure: ${dna.contentStructure || ''}
Emotional Triggers: ${(dna.emotionalTriggers as string[] || []).join(', ')}
Unique Patterns: ${(dna.uniquePatterns as string[] || []).join(', ')}

Return ONLY a valid JSON array of 5 different niches:
[
  {
    "niche": "Specific niche name (be specific, not generic — e.g. 'AI tools for freelancers' not just 'tech')",
    "whyItWorks": "1-2 sentences on why THIS channel's exact style would win in this niche right now",
    "gap": "What's missing in this niche that this style would fill",
    "exampleTitle": "A specific video title for this niche written in the channel's exact style",
    "hook": "The opening hook line for that video (15 seconds, in the channel's exact voice/tone)",
    "cpmRange": "Estimated advertiser CPM range e.g. $8-$25"
  }
]`,
      }],
    });
    const ideasText = ideasMsg.content[0].type === 'text' ? ideasMsg.content[0].text : '[]';
    const ideasMatch = ideasText.match(/\[[\s\S]*\]/);
    const ideas = (ideasMatch ? JSON.parse(ideasMatch[0]) : []) as { niche: string; whyItWorks: string; gap: string; exampleTitle: string; hook: string; cpmRange: string }[];
    send({ type: 'ideas', data: ideas });

    // Write full script for the top idea (streaming)
    if (ideas.length > 0) {
      send({ type: 'status', message: 'Writing your script in their exact style…' });
      const scriptStream = anthropic.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: `You are an elite YouTube scriptwriter. Write in the EXACT style of the analyzed channel:
- Hook Style: ${dna.hookStyle || ''}
- Tone: ${dna.tone || ''}
- Pacing: ${dna.pacing || ''}
- Content Structure: ${dna.contentStructure || ''}
- Phrases to echo: ${(dna.recurringPhrases as string[] || []).join(', ')}
- Emotional triggers to use: ${(dna.emotionalTriggers as string[] || []).join(', ')}
- Unique patterns to follow: ${(dna.uniquePatterns as string[] || []).join(', ')}
- Audience relationship: ${dna.audienceRelationship || ''}`,
        messages: [{
          role: 'user',
          content: `Write a complete YouTube script for a video in this niche:

NICHE: ${ideas[0].niche}
TITLE: ${ideas[0].exampleTitle}
HOOK LINE: ${ideas[0].hook}
GAP THIS FILLS: ${ideas[0].gap}

Write the FULL script with clear section labels:
[HOOK] — first 15 seconds
[PROMISE] — what they'll get
[OPEN LOOP] — plant a mystery
[BODY] — main content sections
[CTA] — closing call to action

Sound EXACTLY like the channel we analyzed. Same rhythm, energy, vocabulary, and personality — but 100% original content.`,
        }],
      });

      for await (const event of scriptStream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          send({ type: 'script_delta', text: event.delta.text });
        }
      }
    }

    clearInterval(heartbeat);
    send({ type: 'done' });
    res.end();
  } catch (err) {
    clearInterval(heartbeat);
    const msg = err instanceof Error ? err.message : 'Channel DNA analysis failed';
    req.log.error({ err }, 'Channel DNA failed');
    send({ type: 'error', message: msg });
    res.end();
  }
});

// ─── Script → Video Scenes ───────────────────────────────────────────────────
router.post('/tools/video-scenes', async (req, res) => {
  const { script, format } = req.body as { script: string; format?: string };
  if (!script || script.trim().length < 50) {
    res.status(400).json({ error: 'Script too short — paste at least a paragraph.' });
    return;
  }

  const videoFormat = format === 'short' ? 'TikTok/Shorts (9:16 vertical)' : 'YouTube (16:9 landscape)';

  const systemPrompt = `You are a professional video editor who creates kinetic typography social media videos. Given a script, break it into punchy animated slides.

Return ONLY valid JSON — no markdown fences, no explanation. Return a JSON array of scene objects.

Each scene object has EXACTLY these fields:
- "id": number (1-based)
- "duration": number (milliseconds, 3000-5500 — longer for complex ideas)
- "headline": string (the main text — SHORT and punchy, max 10 words, ALL CAPS for impact on short videos)
- "highlightWords": array of strings (1-3 key words from headline to emphasize with color highlight)
- "subtext": string (supporting context, max 8 words, or "" if none needed)
- "emoji": string (single relevant emoji that adds emotion, or "" — use real emojis like 🔥💰⚡🧠🎯📈💡🚀✅❌⚠️🎬💎📊🏆)
- "palette": string (one of: "purple", "blue", "red", "gold", "green", "teal", "pink", "orange", "dark")
- "animStyle": string (one of: "word-by-word", "all-in", "rise-up")

Rules:
- Create 8-18 scenes depending on script length
- Each scene = ONE idea, ONE message
- Keep headline SHORT — max 10 words — viewers read in 1-2 seconds  
- highlightWords must be exact words that appear in headline
- Choose palette based on emotion: red/orange=danger/urgency, gold=money/success, green=growth/positive, purple=authority/wisdom, blue=trust/calm, teal=insight, pink=bold/trend, dark=serious/premium
- Vary palettes — do NOT repeat the same palette more than twice in a row
- animStyle "word-by-word" for dramatic reveals, "all-in" for statements, "rise-up" for powerful declarations
- End with a strong call-to-action scene`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Format: ${videoFormat}\n\nScript:\n${script.slice(0, 8000)}`,
      }],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const scenes = JSON.parse(cleaned);

    if (!Array.isArray(scenes)) throw new Error('Expected array of scenes');

    res.json({ scenes });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Scene generation failed';
    req.log.error({ err }, 'video-scenes failed');
    res.status(500).json({ error: msg });
  }
});

export default router;
