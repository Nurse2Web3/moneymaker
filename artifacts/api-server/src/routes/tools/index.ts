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
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      messages: [{
        role: "user",
        content: `Perform a deep content strategy analysis for a YouTube channel in the "${niche}" niche.
${channelDescription ? `Channel description: ${channelDescription}` : ""}

Current year: ${CURRENT_YEAR}

Return a comprehensive analysis as valid JSON with this exact structure:
{
  "summary": "2-3 sentence overview of this niche's current landscape and opportunity level",
  "opportunities": [
    {
      "title": "Specific content opportunity title",
      "description": "2 sentence description of what to make and why it works",
      "potential": "High|Viral|Medium"
    }
  ],
  "contentGaps": [
    {
      "gap": "Specific underserved content area",
      "why": "Why this gap exists and how to exploit it"
    }
  ],
  "topFormats": [
    {
      "format": "Format name",
      "description": "Why this format works in this niche",
      "examples": "2-3 example video titles using this format"
    }
  ],
  "avoidMistakes": ["Mistake 1", "Mistake 2", "Mistake 3", "Mistake 4"],
  "quickWins": ["Quick win 1", "Quick win 2", "Quick win 3", "Quick win 4", "Quick win 5"]
}

Provide exactly: 4 opportunities, 4 content gaps, 3 top formats, 4 mistakes, 5 quick wins.
Return ONLY the JSON object, no extra text.`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    res.json({ analysis });
  } catch (err) {
    req.log.error({ err }, "Niche analysis failed");
    res.status(500).json({ error: "Niche analysis failed" });
  }
});

export default router;
