import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGroqClient, GROQ_MODEL, groqBusyResponse } from '@/lib/server/ai';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { analysisId, sectionType, currentContent, resumeText, jobDescription, missingKeywords } = await req.json();
    if (!sectionType) {
      return NextResponse.json({ error: 'sectionType is required' }, { status: 400 });
    }

    let context = { resume_text: resumeText || '', job_description: jobDescription || '', missing_keywords: missingKeywords || [] };
    if (analysisId) {
      const { data } = await supabase
        .from('resume_analyses')
        .select('resume_text, job_description, missing_keywords')
        .eq('id', analysisId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) context = { ...context, ...data };
    }

    const keywords = Array.isArray(context.missing_keywords)
      ? context.missing_keywords.map((item: any) => typeof item === 'string' ? item : item?.keyword).filter(Boolean).join(', ')
      : '';

    const completion = await getGroqClient().chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.45,
      max_tokens: 900,
      messages: [
        {
          role: 'system',
          content: 'You are a senior resume editor. Return only the improved replacement text for the requested resume section. Keep it truthful, concise, ATS-friendly, and naturally include relevant missing keywords.',
        },
        {
          role: 'user',
          content: `Section: ${sectionType}

Current section text:
${String(currentContent || '').slice(0, 4000)}

Full resume context:
${String(context.resume_text || '').slice(0, 5000)}

Job description:
${String(context.job_description || '').slice(0, 3500)}

Missing keywords:
${keywords || 'None provided'}`,
        },
      ],
    });

    const improvedText = completion.choices[0]?.message?.content?.trim();
    if (!improvedText) throw new Error('Empty AI response');

    await supabase.from('chat_sessions').insert({
      analysis_id: analysisId,
      user_id: user.id,
      role: 'assistant',
      content: `Improved ${sectionType}:\n${improvedText}`,
    });

    return NextResponse.json({ improvedText });
  } catch (error) {
    console.error('[api/improve/section]', error);
    return NextResponse.json(groqBusyResponse(), { status: 503 });
  }
}
