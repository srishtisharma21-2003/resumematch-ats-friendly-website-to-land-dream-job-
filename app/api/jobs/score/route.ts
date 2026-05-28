import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { jobs, skills } = await req.json();
    if (!jobs || !skills) {
      return NextResponse.json({ error: 'Missing jobs or skills' }, { status: 400 });
    }

    const scoredJobs = await Promise.all(
      jobs.map(async (job: any) => {
        const prompt = `You are a resume-job matcher. Given the job: "${job.title}" at "${job.company}". Description snippet: "${job.description.substring(0, 600)}". Candidate skills: ${skills.join(', ')}. Return ONLY a number from 0 to 100 representing the match percentage. No extra text.`;
        const completion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama3-8b-8192',
          temperature: 0,
        });
        const scoreText = completion.choices[0]?.message?.content || '0';
        const score = parseInt(scoreText, 10);
        return { ...job, matchScore: isNaN(score) ? 0 : Math.min(100, Math.max(0, score)) };
      })
    );

    return NextResponse.json({ jobs: scoredJobs });
  } catch (error) {
    console.error('Scoring error:', error);
    return NextResponse.json({ error: 'Failed to score jobs' }, { status: 500 });
  }
}