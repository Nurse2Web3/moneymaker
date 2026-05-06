import { Router, type IRouter } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import {
  GenerateTitlesBody,
  GenerateIdeasBody,
  GenerateDescriptionBody,
  GenerateTagsBody,
} from "@workspace/api-zod";

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
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      messages: [{
        role: "user",
        content: `Generate exactly 5 viral YouTube titles for the topic: "${topic}"${channelNiche ? ` in the ${channelNiche} niche` : ""}.

The current year is ${CURRENT_YEAR}. If the topic is time-sensitive or trending, use ${CURRENT_YEAR} in the title — never use a past year.

Rules for each title:
- Maximum 70 characters
- Use power words, numbers, and curiosity gaps
- Mix different styles: how-to, listicle, personal story, controversy, secret reveal
- No clickbait that doesn't deliver — every title must be achievable content
- Each title should feel dramatically different from the others

Return ONLY a JSON array of 5 title strings, nothing else. Example: ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"]`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const titles = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    res.json({ titles });
  } catch (err) {
    req.log.error({ err }, "Title generation failed");
    res.status(500).json({ error: "Title generation failed" });
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
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      messages: [{
        role: "user",
        content: `Generate ${count} high-potential YouTube video ideas for a channel in the "${channelNiche}" niche.

The current year is ${CURRENT_YEAR}. Where relevant, reference ${CURRENT_YEAR} in titles — never use a past year like 2024 or 2025.

For each idea provide:
- A compelling video title
- A 1-2 sentence description of what the video covers
- Estimated view potential (Low / Medium / High / Viral)

Return ONLY valid JSON array like:
[
  {
    "title": "Video Title Here",
    "description": "What this video covers in 1-2 sentences.",
    "estimatedViews": "High"
  }
]`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const ideas = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    res.json({ ideas });
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
${script ? `\nScript summary/excerpt:\n${script.slice(0, 1000)}` : ""}

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
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      messages: [{
        role: "user",
        content: `Generate 20 high-SEO YouTube tags for a video titled: "${title}"${topic ? ` about: ${topic}` : ""}.

Rules:
- Mix broad and specific tags
- Include 2-3 word and 3-5 word phrases
- Include the main keyword in multiple forms
- No tags over 500 characters combined
- Order by relevance (most important first)

Return ONLY a JSON array of tag strings: ["tag1", "tag2", ...]`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const tags = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    res.json({ tags });
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

export default router;
