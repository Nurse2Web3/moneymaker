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

export default router;
