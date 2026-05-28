import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { resumeData, jobDescription, missingKeywords, question } = await req.json();

    if (!GROQ_API_KEY) {
      return NextResponse.json({ 
        reply: "⚠️ API key missing. Please add GROQ_API_KEY to .env.local" 
      }, { status: 500 });
    }

    const prompt = `You are an expert resume coach. The user's resume is:
${JSON.stringify(resumeData, null, 2)}

Job Description: ${jobDescription || 'Not provided'}
Missing Keywords: ${missingKeywords?.join(', ') || 'None'}

User's question: ${question}

Provide helpful, concise, actionable advice (max 150 words).`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "I couldn't process your request.";
    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ reply: "Service temporarily unavailable." }, { status: 500 });
  }
}
