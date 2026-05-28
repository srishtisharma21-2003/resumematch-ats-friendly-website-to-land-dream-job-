import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';

const createGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new Groq({ apiKey });
};

const createSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};

function extractJSONFromText(text: string): string {
  let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return cleaned.substring(start, end + 1);
  }
  return cleaned;
}

export async function POST(req: NextRequest) {
  try {
    const { resumeText, jobDescription, userId, fileName } = await req.json();

    if (!resumeText || resumeText.length < 50) {
      return NextResponse.json({ error: 'Resume too short (min 50 chars)' }, { status: 400 });
    }
    if (!jobDescription || jobDescription.length < 30) {
      return NextResponse.json({ error: 'Job description too short (min 30 chars)' }, { status: 400 });
    }

    const groq = createGroqClient();

    if (!groq) {
      return NextResponse.json({ error: 'Missing GROQ_API_KEY' }, { status: 500 });
    }

    // Call Groq AI
    const userPrompt = `You are an ATS expert. Analyze the resume against the job description.
CRITICAL: Return ONLY valid JSON. Do NOT include any markdown, explanations, or text outside the JSON object.
Use exactly these keys: matchScore (0-100 integer), missingKeywords (array of strings), improvements (array of 3-5 strings), summary (string).

Resume:
"""
${resumeText.slice(0, 4000)}
"""

Job Description:
"""
${jobDescription.slice(0, 2000)}
"""`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: userPrompt }],
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    console.log('Raw AI response:', raw);

    const cleaned = extractJSONFromText(raw);
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error('Failed to parse JSON:', cleaned);
      return NextResponse.json({ error: 'AI returned invalid JSON' }, { status: 500 });
    }

    const result = {
      matchScore: Math.min(100, Math.max(0, Number(parsed.matchScore) || 0)),
      missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords.slice(0, 10) : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 5) : [],
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    };

    // Save to Supabase (even if userId is null)
    let analysisId = null;
    const supabaseAdmin = createSupabaseAdmin();

    if (supabaseAdmin) {
      const effectiveUserId = userId || null;

      const { data: resumeData, error: resumeError } = await supabaseAdmin
        .from('resumes')
        .insert({ user_id: effectiveUserId, file_name: fileName || 'resume.txt', content: resumeText })
        .select('id')
        .single();

      if (!resumeError && resumeData) {
        const { data: analysisData, error: analysisError } = await supabaseAdmin
          .from('analyses')
          .insert({
            resume_id: resumeData.id,
            user_id: effectiveUserId,
            job_description: jobDescription,
            score: result.matchScore,
            missing_keywords: result.missingKeywords,
            improvements: result.improvements,
            summary: result.summary,
            original_resume: resumeText,
            updated_resume: resumeText,
          })
          .select('id')
          .single();

        if (!analysisError && analysisData) {
          analysisId = analysisData.id;
        }
      }
    }

    // ✅ Return the analysisId (even if null)
    return NextResponse.json({ ...result, analysisId });
  } catch (err: any) {
    console.error('Analysis API error:', err);
    return NextResponse.json({ error: err.message || 'Analysis failed' }, { status: 500 });
  }
}
