import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const query = searchParams.get('query') || 'software engineer';
  const location = searchParams.get('location') || 'India';

  const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID!;
  const ADZUNA_API_KEY = process.env.ADZUNA_API_KEY!;
  const FINDWORK_API_KEY = process.env.FINDWORK_API_KEY?.replace(/^"|"$/g, '') || '';

  const jobs = [];

  // 1. Fetch from Adzuna (free, ~5000 calls/month)
  try {
    const adzunaUrl = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_API_KEY}&results_per_page=15&what=${encodeURIComponent(query)}&where=${encodeURIComponent(location)}`;
    const adzunaRes = await fetch(adzunaUrl);
    const adzunaData = await adzunaRes.json();
    if (adzunaData.results) {
      for (const job of adzunaData.results) {
        jobs.push({
          id: `adzuna_${job.id}`,
          title: job.title,
          company: job.company?.display_name || 'Unknown',
          location: job.location?.display_name || location,
          salary: job.salary_min
            ? `₹${Math.round(job.salary_min / 100000)}L - ₹${Math.round(job.salary_max / 100000)}L`
            : 'Not disclosed',
          matchScore: 0,
          platform: 'adzuna',
          postedAt: job.created ? new Date(job.created).toLocaleDateString() : 'Recent',
          type: 'Full-time',
          description: job.description?.substring(0, 500) || 'No description provided.',
          url: job.redirect_url || '#',
        });
      }
    }
  } catch (err) {
    console.error('Adzuna error:', err);
  }

  // 2. Fetch from FindWork (free, 100 calls/day)
  if (FINDWORK_API_KEY) {
    try {
      const findworkUrl = `https://findwork.dev/api/jobs/?search=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`;
      const findworkRes = await fetch(findworkUrl, {
        headers: { Authorization: `Token ${FINDWORK_API_KEY}` },
      });
      if (findworkRes.ok) {
        const findworkData = await findworkRes.json();
        if (findworkData.results) {
          for (const job of findworkData.results) {
            jobs.push({
              id: `findwork_${job.id}`,
              title: job.role,
              company: job.company_name,
              location: job.location || location,
              salary: job.salary || 'Not disclosed',
              matchScore: 0,
              platform: 'findwork',
              postedAt: job.published_date ? new Date(job.published_date).toLocaleDateString() : 'Recent',
              type: job.employment_type || 'Full-time',
              description: job.description?.substring(0, 500) || 'No description provided.',
              url: job.url,
            });
          }
        }
      }
    } catch (err) {
      console.error('FindWork error:', err);
    }
  }

  return NextResponse.json({ jobs, success: true });
}