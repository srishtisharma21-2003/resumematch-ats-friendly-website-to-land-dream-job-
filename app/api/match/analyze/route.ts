import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractJsonObject, getGroqClient, GROQ_MODEL, normalizeKeywords } from '@/lib/server/ai';
import { extractTextFromUploadedFile } from '@/lib/server/files';

type AnalyzeInput = {
  analysisId?: string;
  resumeText: string;
  jobDescription: string;
  fileName: string;
};

async function readAnalyzeInput(req: NextRequest): Promise<AnalyzeInput> {
  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    const file = formData.get('resume') as File | null;
    const jobDescription = String(formData.get('jobDescription') || '');

    if (!file) {
      throw new Error('Resume and job description are required');
    }

    return {
      resumeText: await extractTextFromUploadedFile(file),
      jobDescription,
      fileName: file.name || 'resume.txt',
    };
  }

  const body = await req.json();
  return {
    analysisId: body.analysisId,
    resumeText: String(body.resumeText || ''),
    jobDescription: String(body.jobDescription || ''),
    fileName: String(body.fileName || 'resume.txt'),
  };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Please sign in' }, { status: 401 });
    }

    const { analysisId, resumeText, jobDescription, fileName } = await readAnalyzeInput(req);

    if (!resumeText || resumeText.length < 50) {
      return NextResponse.json({ error: 'Resume text too short (min 50 chars)' }, { status: 400 });
    }

    if (!jobDescription || jobDescription.length < 30) {
      return NextResponse.json({ error: 'Job description too short (min 30 chars)' }, { status: 400 });
    }

    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.25,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are an ATS resume analyst. Return ONLY valid JSON with this exact structure:
{
  "score": 85,
  "missingKeywords": [{"keyword": "React", "priority": "high"}, {"keyword": "TypeScript", "priority": "medium"}],
  "improvements": ["Add more metrics", "Include relevant projects"],
  "summary": "Overall good but missing technical keywords"
}`,
        },
        {
          role: 'user',
          content: `Resume:\n${resumeText.slice(0, 9000)}\n\nJob Description:\n${jobDescription.slice(0, 6000)}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || '{}';

    let parsed: any;
    try {
      parsed = JSON.parse(extractJsonObject(raw));
    } catch (error) {
      console.error('[analyze] JSON parse error:', error, raw);
      return NextResponse.json({ error: 'Invalid AI response format' }, { status: 503 });
    }

    const score = Math.min(100, Math.max(0, Number(parsed.score ?? parsed.matchScore ?? 0)));

    let missingKeywordsRaw = parsed.missingKeywords ?? parsed.missing_keywords ?? [];
    if (!Array.isArray(missingKeywordsRaw)) {
      missingKeywordsRaw = typeof missingKeywordsRaw === 'object' && missingKeywordsRaw !== null
        ? Object.values(missingKeywordsRaw)
        : [];
    }
    const missingKeywords = normalizeKeywords(missingKeywordsRaw);

    const improvements = Array.isArray(parsed.improvements)
      ? parsed.improvements.map(String).filter(Boolean).slice(0, 8)
      : typeof parsed.improvements === 'string'
        ? [parsed.improvements]
        : [];

    const aiSummary = typeof parsed.summary === 'string'
      ? parsed.summary
      : typeof parsed.ai_summary === 'string'
        ? parsed.ai_summary
        : '';

    const payload = {
      user_id: user.id,
      resume_text: resumeText,
      job_description: jobDescription,
      match_score: score,
      missing_keywords: missingKeywords.map((item) => item.keyword),
      improvements,
      ai_summary: aiSummary,
      file_name: fileName,
      updated_at: new Date().toISOString(),
    };

    const query = analysisId
      ? supabase
          .from('resume_analyses')
          .update(payload)
          .eq('id', analysisId)
          .eq('user_id', user.id)
          .select('id')
          .single()
      : supabase
          .from('resume_analyses')
          .insert(payload)
          .select('id')
          .single();

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      analysisId: data.id,
      score,
      matchScore: score,
      missingKeywords,
      improvements,
      summary: aiSummary,
    });
  } catch (err: any) {
    console.error('[analyze] ERROR:', err);
    return NextResponse.json({ error: err.message || 'AI service error' }, { status: 503 });
  }
}
