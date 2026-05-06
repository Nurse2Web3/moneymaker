import { Router, type IRouter } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { GenerateScriptBody } from "@workspace/api-zod";

const router: IRouter = Router();

function buildTensionSystemPrompt(tensionLevel: string, techniques: string[]): string {
  const tensionDesc: Record<string, string> = {
    low: "a relaxed, informative pace with gentle curiosity hooks",
    medium: "moderate tension with clear open loops and satisfying payoffs",
    high: "high tension with aggressive open loops, pattern interrupts, and escalating stakes",
    extreme: "maximum tension using every psychological engagement technique — constant open loops, cliffhangers between every section, stakes escalation, curiosity gaps, and pattern interrupts",
  };

  const techniqueGuide: Record<string, string> = {
    open_loops: "Open loops: Raise a compelling question early, never answer it until later. Example: 'Before I show you #1, there's something you need to know that most creators get completely wrong...'",
    pattern_interrupts: "Pattern interrupts: Every 60-90 seconds, shift tone, speed, or subject unexpectedly to re-engage attention.",
    stakes_escalation: "Stakes escalation: Continuously raise what's at risk. Each section should feel more important than the last.",
    curiosity_gaps: "Curiosity gaps: Tease information without revealing it. 'The #3 strategy is counterintuitive — most people do the opposite and wonder why they fail.'",
    cliffhangers: "Cliffhangers: End every major section on a hook that makes skipping the next section impossible.",
    social_proof: "Social proof: Sprinkle in proof points ('This one tip helped 10,000 creators double their views').",
    foreshadowing: "Foreshadowing: Early in the script, hint at something incredible coming later.",
  };

  const activeTechniques = techniques.length > 0
    ? techniques.map(t => techniqueGuide[t] || t).join("\n\n")
    : Object.values(techniqueGuide).join("\n\n");

  return `You are an elite YouTube scriptwriter trained on the best-performing videos of all time. Your scripts are engineered for maximum retention and watch time using the TENSION ENGINE system.

TENSION LEVEL: ${tensionLevel.toUpperCase()} — use ${tensionDesc[tensionLevel] || tensionDesc.medium}.

TENSION ENGINE TECHNIQUES TO APPLY:
${activeTechniques}

SCRIPT STRUCTURE RULES:
1. HOOK (0-15 seconds): Start with the most compelling, disruptive statement possible. Never start with "In this video...". Use a bold claim, shocking stat, or direct challenge.
2. PROMISE: Tell viewers exactly what they'll get and why they'd be insane to leave.
3. OPEN LOOP: Plant a mystery or question that won't be answered until the end.
4. BODY: Deliver value in numbered sections. Each section ends with a hook to the next.
5. PATTERN INTERRUPT: At least one unexpected shift in tone or subject per section.
6. CLIMAX: The biggest, most valuable point saved for near the end (after most would normally quit).
7. CLOSE LOOP: Answer the open loop from step 3.
8. CTA: Strong, specific call-to-action tied to the video content.

FORMAT THE SCRIPT as:
[HOOK (0-15s)]
[content]

[INTRO/PROMISE (15-30s)]
[content]

[OPEN LOOP]
[content]

[MAIN CONTENT - Section 1]
[content]
...and so on through all sections...

[CLIMAX]
[content]

[CLOSE LOOP + CTA]
[content]

Write naturally and conversationally — this should sound like a real person speaking, not a corporate presentation.`;
}

router.post("/scripts/generate", async (req, res): Promise<void> => {
  const parsed = GenerateScriptBody.safeParse({
    ...req.body,
    videoLength: Number(req.body.videoLength),
  });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { topic, channelStyle, videoLength, tensionLevel, tensionTechniques, inspirationLinks, model } = parsed.data;

  const wordCount = parseInt(videoLength, 10);
  const minuteMap: Record<string, string> = { "100": "~1 minute", "800": "~5 minutes", "1500": "~10 minutes", "3000": "~20 minutes" };
  const duration = minuteMap[videoLength] || "~10 minutes";

  const systemPrompt = buildTensionSystemPrompt(tensionLevel, tensionTechniques || []);

  const currentYear = new Date().getFullYear();

  const userPrompt = `Write a YouTube script about: "${topic}"

Target length: ${wordCount} words (${duration} video)
${channelStyle ? `Channel style/tone: ${channelStyle}` : ""}
${inspirationLinks ? `Inspiration (analyze the approach from these links for style, not content): ${inspirationLinks}` : ""}
Current year: ${currentYear} — use this year in any date references, never use a past year.

Apply the TENSION ENGINE at ${tensionLevel} intensity throughout every section. Every transition must create forward momentum — the viewer should never feel like they can safely stop watching.`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const selectedModel = model === "claude-opus" ? "claude-opus-4-7" : "claude-sonnet-4-6";

    const stream = anthropic.messages.stream({
      model: selectedModel,
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Script generation failed");
    res.write(`data: ${JSON.stringify({ error: "Script generation failed. Please try again." })}\n\n`);
    res.end();
  }
});

export default router;
