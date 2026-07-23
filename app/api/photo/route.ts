import { NextResponse } from "next/server";
import { analyzeFoodPhoto } from "@/lib/claude";
import type { AnalyzeResponse } from "@/types";

interface PhotoRequestBody {
  imageBase64: string;
  language: "en" | "hi";
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server" },
      { status: 500 },
    );
  }

  const body = (await request.json()) as Partial<PhotoRequestBody>;
  const { imageBase64, language } = body;

  if (!imageBase64?.trim()) {
    return NextResponse.json({ error: "imageBase64 is required" }, { status: 400 });
  }

  try {
    const analysis: AnalyzeResponse = await analyzeFoodPhoto(
      imageBase64,
      language === "hi" ? "hi" : "en",
    );
    return NextResponse.json(analysis);
  } catch (err) {
    console.error("Photo analysis failed", err);
    return NextResponse.json(
      { error: "Nutrie couldn't analyse that photo — please try again." },
      { status: 502 },
    );
  }
}
