import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(req: NextRequest) {
  const { resumeData, jobDescription, missingKeywords, instruction } = await req.json();

  const prompt = `You are an expert resume coach. The user's resume is currently:
${JSON.stringify(resumeData, null, 2)}

Job Description: ${jobDescription || 'Not provided'}
Missing keywords: ${missingKeywords?.join(', ') || 'None'}

Instruction: ${instruction}

Suggest a specific improvement (e.g., rewrite a bullet point, add a skill, quantify an achievement). Return only the improved text or a short actionable suggestion.`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    }),
  });
  const data = await res.json();
  const suggestion = data.choices[0]?.message?.content || 'Could not generate suggestion.';
  return NextResponse.json({ suggestion });
}
