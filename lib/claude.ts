import Anthropic from "@anthropic-ai/sdk";
import type { AnalyzeResponse, Confidence, NutritionAnalysis } from "@/types";

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
- If vague input → estimate and mention it
- 2-3 sentences maximum in response text

OUTPUT FORMAT:
Write response text first (2-3 sentences).
Then on a new line, output ONLY this JSON (no backticks,
no markdown, raw JSON only):
{
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
): Promise<AnalyzeResponse> {
  const message = await getClient().messages.create({
    model: MODEL,
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `User's preferred language: ${language === "hi" ? "Hindi" : "English"}\n\n${input}`,
      },
    ],
  });

  const raw = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  return parseClaudeResponse(raw);
}

function parseClaudeResponse(raw: string): AnalyzeResponse {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Claude response did not include the expected JSON block");
  }

  const text = raw.slice(0, jsonMatch.index).trim();
  const parsed = JSON.parse(jsonMatch[0]);
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

  return { text, nutrition, confidence };
}
