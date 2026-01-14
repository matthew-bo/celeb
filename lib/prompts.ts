/**
 * LLM Prompt Templates
 *
 * Reference: README.md §7.1-7.2
 * System prompts, user payloads, and forbidden phrase detection.
 */

import type { Costume, QuizResponse } from "./schema";

/**
 * Forbidden phrases that make the output feel "AI-like"
 * Reference: README.md §7.2
 */
export const FORBIDDEN_PHRASES = [
  "based on your preferences",
  "based on your answers",
  "as an ai",
  "i think",
  "i recommend",
  "you might like",
  "i suggest",
  "here are some",
  "i've selected",
  "i've chosen",
  "you may enjoy",
  "consider trying",
] as const;

/**
 * Check if text contains any forbidden phrases
 */
export function containsForbiddenPhrases(text: string): boolean {
  const lowerText = text.toLowerCase();
  return FORBIDDEN_PHRASES.some((phrase) => lowerText.includes(phrase));
}

/**
 * Build system prompt for editorial stylist persona
 */
function buildSystemPrompt(): string {
  return `You are an editorial costume stylist for a magazine quiz. Your tone is confident, punchy, and fun—like GQ or NYMag.

RULES:
- Never mention AI, algorithms, or that you're an assistant
- Never hedge or use phrases like "I think" or "you might like"
- Be assertive and editorial: "This hits your vibe" not "This might match what you're looking for"
- Select EXACTLY 3 costumes from the provided candidate list
- Each costumeId in your response MUST be from the candidate list
- Output valid JSON only, no markdown

OUTPUT FORMAT:
{
  "recommendations": [
    {
      "costumeId": "exact_id_from_candidates",
      "whyItMatches": ["bullet 1", "bullet 2"],
      "shoppingList": ["item 1", "item 2", "item 3"],
      "substitutions": ["optional substitution"],
      "warnings": ["optional warning"]
    }
  ]
}

STYLE GUIDE:
- "Why it matches" bullets should reference specific quiz choices (niche level, effort, vibe)
- Shopping list should be 3-7 specific, buyable items
- Substitutions are optional cheaper/easier alternatives
- Warnings are optional "only works if..." notes
- Use active voice and short sentences
- Be specific, not generic`;
}

/**
 * Format quiz response for LLM context
 */
function formatQuizContext(quiz: QuizResponse): string {
  const parts: string[] = [];

  parts.push(`Goals: ${quiz.goals.join(", ")}`);
  parts.push(`Niche level: ${quiz.nicheTarget}/7 (1=everyone gets it, 7=deep cut)`);
  parts.push(`Effort: ${quiz.effort.replace(/_/g, " ")}`);
  parts.push(`Budget: ${quiz.budget.replace(/_/g, " ").replace("lt", "<")}`);
  parts.push(`Era preference: ${quiz.era.replace(/_/g, "/")}`);

  if (quiz.practical.mustBeComfortable) parts.push("Must be comfortable all night");
  if (quiz.practical.mustSurviveCrowdedBar) parts.push("Must survive a crowded bar");
  if (quiz.practical.needsPockets) parts.push("Needs pockets");

  if (quiz.closetBoosters) {
    const boosters = Object.entries(quiz.closetBoosters)
      .filter(([, v]) => v)
      .map(([k]) => k.replace("has", "").toLowerCase());
    if (boosters.length > 0) {
      parts.push(`Already owns: ${boosters.join(", ")}`);
    }
  }

  return parts.join("\n");
}

/**
 * Format candidate costumes for LLM context
 */
function formatCandidates(candidates: Costume[]): string {
  return candidates
    .map((c) => {
      const vibeStr = Object.entries(c.vibes)
        .filter(([, v]) => v >= 2)
        .map(([k]) => k)
        .join(", ");

      return [
        `ID: ${c.id}`,
        `Title: ${c.displayTitle}`,
        `Vibes: ${vibeStr || "neutral"}`,
        `Niche: ${c.nicheScore}/7`,
        `Effort: ${c.constraints.effort}`,
        `Anchor: ${c.requirements.anchorItem}`,
        `Items: ${c.requirements.items.slice(0, 5).join(", ")}`,
        c.notes ? `Note: ${c.notes}` : null,
      ]
        .filter(Boolean)
        .join(" | ");
    })
    .join("\n");
}

/**
 * Build complete prompt for LLM call
 */
export function buildPrompt(
  quiz: QuizResponse,
  candidates: Costume[]
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = buildSystemPrompt();

  const userPrompt = `QUIZ ANSWERS:
${formatQuizContext(quiz)}

CANDIDATE COSTUMES (pick exactly 3):
${formatCandidates(candidates)}

Select the 3 best matches. Be specific in "whyItMatches" bullets—reference their niche level (${quiz.nicheTarget}/7), effort preference (${quiz.effort}), and vibe goals (${quiz.goals.join("/")}).`;

  return { systemPrompt, userPrompt };
}

