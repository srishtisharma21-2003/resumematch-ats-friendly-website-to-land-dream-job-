// app/api/get-tips/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { matchScore, appliedCount } = await req.json();

  let tips = [];

  if (matchScore < 60) {
    tips.push({
      title: 'Improve Resume Keywords',
      description:
        'Add more relevant skills like React, SQL, AWS, or Python.',
      priority: 'high',
    });
  }

  if (appliedCount < 5) {
    tips.push({
      title: 'Apply More',
      description:
        'Applying to more roles increases interview probability.',
      priority: 'medium',
    });
  }

  tips.push({
    title: 'Tailor Applications',
    description:
      'Customize resume summary for each job category.',
    priority: 'low',
  });

  return NextResponse.json({ tips });
}