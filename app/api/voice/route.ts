import { NextResponse } from "next/server";
import OpenAI from "openai";

let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server" },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const audio = formData.get("audio");
  const language = formData.get("language");

  if (!(audio instanceof Blob)) {
    return NextResponse.json({ error: "audio is required" }, { status: 400 });
  }

  try {
    const file = new File([audio], "recording.webm", {
      type: audio.type || "audio/webm",
    });

    const transcription = await getClient().audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: language === "hi" ? "hi" : "en",
    });

    return NextResponse.json({ transcript: transcription.text });
  } catch (err) {
    console.error("Voice transcription failed", err);
    return NextResponse.json(
      { error: "Nutrie couldn't hear that clearly — please try again." },
      { status: 502 },
    );
  }
}
