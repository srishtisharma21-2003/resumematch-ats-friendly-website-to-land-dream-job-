import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGroqClient, GROQ_MODEL } from '@/lib/server/ai';

type ChatRole = 'user' | 'assistant';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const analysisId = req.nextUrl.searchParams.get('analysisId');
    if (!analysisId) {
      return NextResponse.json({ error: 'analysisId is required' }, { status: 400 });
    }

    const { data: analysis } = await supabase
      .from('resume_analyses')
      .select('id')
      .eq('id', analysisId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('chat_sessions')
      .select('role, content, created_at')
      .eq('analysis_id', analysisId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(40);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ messages: data || [] });
  } catch (err: any) {
    console.error('[chat GET] ERROR:', err);
    return NextResponse.json({ error: err.message || 'Chat history error' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { analysisId, message, resumeText, resumeData, jobDescription, missingKeywords } = await req.json();

    if (!analysisId || !message) {
      return NextResponse.json({ error: 'Missing analysisId or message' }, { status: 400 });
    }

    const { data: analysis, error: analysisError } = await supabase
      .from('resume_analyses')
      .select('id, resume_text, job_description, missing_keywords')
      .eq('id', analysisId)
      .eq('user_id', user.id)
      .single();

    if (analysisError || !analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    await supabase.from('chat_sessions').insert({
      analysis_id: analysisId,
      user_id: user.id,
      role: 'user' satisfies ChatRole,
      content: String(message),
    });

    const { data: history } = await supabase
      .from('chat_sessions')
      .select('role, content, created_at')
      .eq('analysis_id', analysisId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(8);

    const keywordList = Array.isArray(missingKeywords) && missingKeywords.length > 0
      ? missingKeywords
      : analysis.missing_keywords || [];

    const resumeContext = resumeText
      || analysis.resume_text
      || (resumeData ? JSON.stringify(resumeData, null, 2) : '');

    const systemPrompt = `You are a professional resume coach. Use this context:
Resume: ${String(resumeContext).slice(0, 3000)}
Job Description: ${String(jobDescription || analysis.job_description || '').slice(0, 2200)}
Missing Keywords: ${keywordList.map((item: any) => typeof item === 'string' ? item : item?.keyword).filter(Boolean).join(', ')}

Answer questions helpfully. Keep responses concise and actionable.`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...(history || [])
        .reverse()
        .map((item: { role: ChatRole; content: string }) => ({
          role: item.role,
          content: item.content,
        })),
    ];

    const completion = await getGroqClient().chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.7,
      messages,
    });

    const reply = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process that.";

    await supabase.from('chat_sessions').insert({
      analysis_id: analysisId,
      user_id: user.id,
      role: 'assistant' satisfies ChatRole,
      content: reply,
    });

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error('[chat] ERROR:', err);
    return NextResponse.json({ error: err.message || 'Chat service error' }, { status: 503 });
  }
}
