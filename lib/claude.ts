import Anthropic from "@anthropic-ai/sdk";
import type {
  AnalyzeResponse,
  ClarificationRound,
  Confidence,
  NutritionAnalysis,
} from "@/types";

const SYSTEM_PROMPT = `You are NUTRIE — a smart Indian nutrition coach AI.
You understand Hindi, English, and Hinglish perfectly.

INDIAN FOOD KNOWLEDGE:

NORTH INDIAN:
Dal tadka, dal makhani, rajma chawal, chole bhature,
aloo paratha (with butter = +45 kcal),
makki roti with sarson saag, kadhi chawal,
paneer butter masala, palak paneer, shahi paneer,
jeera rice, biryani (home = smaller, restaurant = larger),
samosa (1 piece = ~150 kcal with chutney),
kachori, puri (1 piece with ghee = ~80 kcal)

SOUTH INDIAN:
Idli (1 piece = ~70 kcal), dosa plain = ~170 kcal,
masala dosa = ~280 kcal, uttapam, sambhar (1 bowl = ~80 kcal),
coconut chutney (2 tbsp = ~60 kcal), rasam,
curd rice, medu vada (1 piece = ~110 kcal)

WEST INDIAN:
Vada pav (~300 kcal), pav bhaji (~450 kcal for 2 pav),
dhokla (2 pieces = ~100 kcal), thepla (1 = ~120 kcal),
poha (1 bowl = ~250 kcal), misal pav

EVERYDAY ITEMS:
Chai with milk + sugar: 80-100 kcal per cup
Roti (medium, no ghee): 80 kcal
Roti (medium, with ghee): 110 kcal
Chawal (1 katori cooked): 130 kcal
Dal (1 katori): 100-150 kcal
Sabzi dry (1 katori): 80-150 kcal
Sabzi gravy (1 katori): 120-200 kcal
Curd (1 katori): 60 kcal
Ghee (1 tsp): 45 kcal
Egg boiled (1): 78 kcal
Egg omelette (2 eggs with oil): 200 kcal

PORTION REALITY:
Home meals = smaller than restaurant
Dhaba = 30-40% larger than home cooking
Swiggy/Zomato = restaurant sized
"Thali" at dhaba = estimate 800-1000 kcal total
"Khana khaya" vaguely = assume 500-600 kcal standard meal

RESPONSE RULES:
- If Hindi/Hinglish input → respond in Hinglish naturally
- If English input → respond in English
- Never translate food names (dal stays dal)
- Be warm, like a nutritionist friend
- Never judge food choices
- Be specific — mention foods you estimated
- 2-3 sentences maximum in response text

CLARIFICATION:
When input is too vague to estimate with reasonable confidence (confidence
would otherwise be "low"), ask ONE clarifying question instead of guessing —
but only if you have not already asked the maximum of 2 questions for this
food log (the conversation so far tells you how many you've asked).
- Ask exactly one question, with 2-3 short tappable options
- Examples:
  "thali khaya" → "Dhaba or home style?" options: ["Dhaba", "Home style", "Restaurant"]
  "kuch khaya" → "Can you be more specific?" options: ["Snack", "Full meal", "Just a drink"]
  "lunch kiya" → "What did you have for lunch?" options: ["Dal chawal", "Roti sabzi", "Something else"]
- Never ask more than 2 questions total for the same food log
- If you have already asked 2 questions (or the conversation tells you this
  is the final round), you MUST give your best estimate instead — do not
  ask a third question under any circumstances

OUTPUT FORMAT:
There are two possible outputs. Never output both.

1. Clarifying question — raw JSON only (no backticks, no markdown, no other
   text before or after):
{
  "type": "clarification",
  "question": "",
  "options": ["", "", ""]
}

2. Nutrition estimate — write response text first (2-3 sentences), then on
   a new line output ONLY this JSON (no backticks, no markdown, raw JSON only):
{
  "type": "analysis",
  "calories": 0,
  "protein": 0,
  "carbs": 0,
  "fat": 0,
  "fiber": 0,
  "items": [
    {
      "name": "",
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fat": 0
    }
  ],
  "confidence": "high"
}

Confidence values:
high   = specific food + quantity mentioned
medium = food mentioned, quantity vague
low    = very vague like "had lunch" or "ate something"`;

const MODEL = "claude-haiku-4-5-20251001";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export async function analyzeFoodWithClaude(
  input: string,
  language: "en" | "hi",
  conversationHistory: ClarificationRound[] = [],
  forceFinal = false,
): Promise<AnalyzeResponse> {
  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `User's preferred language: ${language === "hi" ? "Hindi" : "English"}\n\n${input}`,
    },
  ];

  for (const round of conversationHistory) {
    messages.push({ role: "assistant", content: round.question });
    messages.push({ role: "user", content: round.answer });
  }

  if (forceFinal) {
    messages.push({
      role: "user",
      content:
        "You have already asked the maximum of 2 clarifying questions. Give your best nutrition estimate now (type: analysis) — do not ask another question.",
    });
  }

  const message = await getClient().messages.create({
    model: MODEL,
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages,
  });

  const raw = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  const result = parseClaudeResponse(raw);

  if (forceFinal && result.type === "clarification") {
    // Defensive fallback: Claude ignored the forced-final instruction.
    return {
      type: "analysis",
      text: "Here's my best estimate based on what you've told me so far.",
      confidence: "medium",
      nutrition: {
        calories: 400,
        protein: 15,
        carbs: 50,
        fat: 12,
        fiber: 3,
        items: [{ name: input.trim().slice(0, 40) || "Meal", calories: 400, protein: 15, carbs: 50, fat: 12 }],
        confidence: "medium",
      },
    };
  }

  if (forceFinal && result.type === "analysis") {
    return {
      ...result,
      confidence: "medium",
      nutrition: { ...result.nutrition, confidence: "medium" },
    };
  }

  return result;
}

function parseClaudeResponse(raw: string): AnalyzeResponse {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Claude response did not include the expected JSON block");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  if (parsed.type === "clarification") {
    if (typeof parsed.question !== "string" || !Array.isArray(parsed.options)) {
      throw new Error("Claude clarification response was malformed");
    }
    return {
      type: "clarification",
      question: parsed.question,
      options: parsed.options.map(String).slice(0, 3),
    };
  }

  const text = raw.slice(0, jsonMatch.index).trim();
  const confidence: Confidence = ["high", "medium", "low"].includes(parsed.confidence)
    ? parsed.confidence
    : "low";

  const nutrition: NutritionAnalysis = {
    calories: Number(parsed.calories) || 0,
    protein: Number(parsed.protein) || 0,
    carbs: Number(parsed.carbs) || 0,
    fat: Number(parsed.fat) || 0,
    fiber: Number(parsed.fiber) || 0,
    items: Array.isArray(parsed.items) ? parsed.items : [],
    confidence,
  };

  return { type: "analysis", text, nutrition, confidence };
}

/**
 * Used by the log screen's "Re-analyse" action: the user has typed a new
 * calorie value for an existing log and wants the macros recalculated to
 * match, rather than a fresh from-scratch analysis.
 */
export async function reanalyzeWithCorrection(
  rawInput: string,
  newCalories: number,
  originalNutrition: NutritionAnalysis,
  language: "en" | "hi",
): Promise<NutritionAnalysis> {
  try {
    const message = await getClient().messages.create({
      model: MODEL,
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `User's preferred language: ${language === "hi" ? "Hindi" : "English"}\n\nUser said: "${rawInput}"\nThey are correcting the calories to ${newCalories} kcal (originally estimated at ${originalNutrition.calories} kcal). Recalculate protein, carbs, and fat proportionally to match this new calorie value. You must respond with an analysis (type: "analysis") — do not ask a clarifying question here.`,
        },
      ],
    });

    const raw = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    const result = parseClaudeResponse(raw);
    if (result.type === "analysis") {
      return { ...result.nutrition, calories: newCalories };
    }
  } catch (err) {
    console.error("Re-analyse failed, falling back to linear scaling", err);
  }

  return scaleNutritionLinearly(originalNutrition, newCalories);
}

function scaleNutritionLinearly(
  original: NutritionAnalysis,
  newCalories: number,
): NutritionAnalysis {
  const factor = original.calories > 0 ? newCalories / original.calories : 1;
  return {
    calories: newCalories,
    protein: Math.round(original.protein * factor),
    carbs: Math.round(original.carbs * factor),
    fat: Math.round(original.fat * factor),
    fiber: Math.round(original.fiber * factor),
    items: original.items,
    confidence: "medium",
  };
}
