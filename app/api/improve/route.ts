import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGroqClient, GROQ_MODEL } from '@/lib/server/ai'

function fallbackImprovement(sectionType: string, currentContent: string, missingKeywords: unknown) {
  const keywords = Array.isArray(missingKeywords)
    ? missingKeywords.map((item: any) => typeof item === 'string' ? item : item?.keyword || item?.text).filter(Boolean).slice(0, 5)
    : []
  const cleaned = String(currentContent || '').trim()
  if (sectionType === 'skills') {
    const existing = cleaned.split(/,|\n/).map((skill) => skill.trim()).filter(Boolean)
    return Array.from(new Set([...existing, ...keywords])).join(', ')
  }
  if (!keywords.length) return cleaned
  return `${cleaned}\n\nATS focus: ${keywords.join(', ')}.`
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { sectionType, currentContent, jobDescription, missingKeywords } = body

  if (!sectionType || !currentContent) {
    return NextResponse.json({ error: 'sectionType and currentContent are required' }, { status: 400 })
  }

  try {
    await createClient()

    const keywords = Array.isArray(missingKeywords)
      ? missingKeywords.map((item: any) => typeof item === 'string' ? item : item.keyword || item.text).filter(Boolean).join(', ')
      : ''

    const groq = getGroqClient()
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.45,
      max_tokens: 700,
      messages: [
        {
          role: 'system',
          content: 'You rewrite resume sections for ATS compatibility. Preserve truthfulness, keep the same section type, add measurable impact only when implied, and return only the improved text.',
        },
        {
          role: 'user',
          content: `Section type: ${sectionType}\n\nCurrent content:\n${String(currentContent).slice(0, 3500)}\n\nTarget job description:\n${String(jobDescription || '').slice(0, 3500)}\n\nMissing keywords to include naturally:\n${keywords || 'None provided'}\n\nRewrite this section so it is clear, polished, keyword-aligned, and ready to paste into a resume. Return only the rewritten section text.`,
        },
      ],
    })

    const improvedText = completion.choices[0]?.message?.content?.trim()
    if (!improvedText) throw new Error('Empty AI response')

    return NextResponse.json({ improvedText })
  } catch {
    const improvedText = fallbackImprovement(sectionType || 'summary', currentContent || '', missingKeywords)
    return NextResponse.json({
      improvedText,
      fallback: true,
      message: 'AI quota is temporarily unavailable, so a local keyword-safe improvement was applied.',
    })
  }
}
