import { NextRequest, NextResponse } from "next/server";
import { extractJsonObject, getGroqClient, GROQ_MODEL } from "@/lib/server/ai";

const MAX_RETRIES = 2;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function rewriteWithGroq(bullet: string, jobDescription?: string) {
  const completion = await getGroqClient().chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: "system",
        content:
          'You are a resume expert. Return only valid JSON in this shape: {"improved":"new bullet text","explanation":"one sentence"}',
      },
      {
        role: "user",
        content: `Rewrite this resume bullet so it is stronger, ATS-friendly, truthful, and aligned to the job context.

Original bullet: "${bullet}"
Job context: ${String(jobDescription || "none").slice(0, 800)}`,
      },
    ],
    temperature: 0.6,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(extractJsonObject(raw));

  return {
    improved: String(parsed.improved || bullet),
    explanation: String(parsed.explanation || ""),
  };
}

export async function POST(req: NextRequest) {
  try {
    const { bullet, jobDescription } = await req.json();
    if (!bullet || String(bullet).trim().length < 5) {
      return NextResponse.json({ error: "Bullet too short" }, { status: 400 });
    }

    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      try {
        const result = await rewriteWithGroq(String(bullet), jobDescription);
        return NextResponse.json(result);
      } catch (error) {
        lastError = error;
        if (attempt < MAX_RETRIES) {
          await wait(500 * 2 ** attempt);
        }
      }
    }

    console.error("[api/rewrite] retries exhausted", lastError);
    return NextResponse.json(
      {
        error:
          "The AI rewrite service is busy right now. Your resume is still saved, and you can try rewriting this bullet again in a moment.",
      },
      { status: 503 },
    );
  } catch (error) {
    console.error("[api/rewrite]", error);
    return NextResponse.json({ error: "Rewrite failed. Please try again." }, { status: 500 });
  }
}
