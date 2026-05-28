import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGroqClient, GROQ_MODEL } from '@/lib/server/ai'
import { extractTextFromUploadedFile } from '@/lib/server/files'

type Job = {
  id: string
  title: string
  company: string
  location: string
  salary: string
  description: string
  url: string
  redirect_url?: string
  platform?: string
  postedAt?: string
  type?: string
  matchScore?: number
}

const fallbackTitles = [
  'Full Stack Developer',
  'Frontend Engineer',
  'Backend Developer',
  'React Developer',
  'Next.js Developer',
  'Data Analyst',
  'Machine Learning Engineer',
  'DevOps Engineer',
  'QA Automation Engineer',
  'Product Engineer',
]

const fallbackCompanies = ['ResumeMatch Partner', 'CloudWorks India', 'DataNest Labs', 'TalentBridge', 'Northstar Digital']
const fallbackLocations = ['Bengaluru, India', 'Hyderabad, India', 'Pune, India', 'Gurugram, India', 'Remote India']

function fallbackJobs(skills: string[], preferredLocation = 'India') {
  const seedSkills = skills.length ? skills : ['React', 'TypeScript', 'SQL', 'Node.js', 'Python']
  return Array.from({ length: 50 }).map((_, index): Job => {
    const title = fallbackTitles[index % fallbackTitles.length]
    const description = `${title} role using ${seedSkills.slice(index % seedSkills.length, index % seedSkills.length + 4).join(', ') || seedSkills.join(', ')}. Includes API development, collaboration, documentation, and delivery ownership.`
    const job = {
      id: `fallback_${index + 1}`,
      title,
      company: fallbackCompanies[index % fallbackCompanies.length],
      location: fallbackLocations[index % fallbackLocations.length] || preferredLocation,
      salary: index % 3 === 0 ? '₹8L - ₹18L' : 'Not disclosed',
      description,
      url: 'https://www.adzuna.in/search',
      redirect_url: 'https://www.adzuna.in/search',
      platform: 'mock',
      postedAt: 'Recent',
      type: 'Full-time',
    }
    return { ...job, matchScore: scoreJob(job, seedSkills, preferredLocation) }
  }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
}

function parseSkills(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const repeated = params.getAll('skills')
  const comma = params.get('skills')?.split(',') || []
  return [...repeated, ...comma]
    .flatMap((skill) => skill.split(','))
    .map((skill) => skill.trim())
    .filter(Boolean)
    .slice(0, 20)
}

function words(value: string) {
  return new Set(value.toLowerCase().split(/[^a-z0-9.+#-]+/).filter((word) => word.length > 1))
}

function extractSkillsHeuristic(text: string) {
  const known = [
    'React', 'Next.js', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'SQL', 'PostgreSQL', 'Supabase',
    'Tailwind CSS', 'AWS', 'Docker', 'Kubernetes', 'Java', 'Spring', 'Machine Learning', 'Data Analysis',
    'Power BI', 'Tableau', 'Git', 'REST API', 'GraphQL', 'HTML', 'CSS',
  ]
  const lower = text.toLowerCase()
  return known.filter((skill) => lower.includes(skill.toLowerCase())).slice(0, 12)
}

function scoreJob(job: Job, skills: string[], preferredLocation = '') {
  const titleWords = words(job.title)
  const description = `${job.title} ${job.description}`.toLowerCase()
  const normalizedSkills = skills.map((skill) => skill.toLowerCase())
  const titleOverlap = normalizedSkills.filter((skill) => titleWords.has(skill) || job.title.toLowerCase().includes(skill)).length
  const skillOverlap = normalizedSkills.filter((skill) => description.includes(skill)).length
  const locationMatch = preferredLocation && job.location.toLowerCase().includes(preferredLocation.toLowerCase()) ? 10 : 0
  return Math.min(100, Math.round(35 + titleOverlap * 10 + skillOverlap * 8 + locationMatch))
}

export async function GET(req: NextRequest) {
  await createClient()
  const skills = parseSkills(req)
  const location = req.nextUrl.searchParams.get('location') || 'India'
  const query = req.nextUrl.searchParams.get('query') || skills.slice(0, 5).join(' ') || 'software developer'
  const appId = process.env.ADZUNA_APP_ID
  const appKey = process.env.ADZUNA_API_KEY

  if (!appId || !appKey) {
    return NextResponse.json({
      jobs: fallbackJobs(skills, location),
      fallback: true,
      warning: 'Adzuna credentials are missing, so mock jobs are being shown.',
    })
  }

  try {
    const url = new URL('https://api.adzuna.com/v1/api/jobs/in/search/1')
    url.searchParams.set('app_id', appId)
    url.searchParams.set('app_key', appKey)
    url.searchParams.set('results_per_page', '20')
    url.searchParams.set('what', query)
    url.searchParams.set('where', location)

    const response = await fetch(url, { next: { revalidate: 300 } })
    if (response.status === 429) {
      return NextResponse.json({ jobs: fallbackJobs(skills, location), fallback: true, warning: 'Adzuna limit reached, so mock jobs are being shown.' })
    }
    if (!response.ok) throw new Error(`Adzuna returned ${response.status}`)
    const data = await response.json()

    const jobs = ((data.results || []) as any[])
      .map((job): Job => ({
        id: String(job.id),
        title: job.title || 'Untitled role',
        company: job.company?.display_name || 'Unknown company',
        location: job.location?.display_name || location,
        salary: job.salary_min ? `₹${Math.round(job.salary_min / 100000)}L - ₹${Math.round((job.salary_max || job.salary_min) / 100000)}L` : 'Not disclosed',
        description: job.description || '',
        url: job.redirect_url || '#',
        redirect_url: job.redirect_url || '#',
        platform: 'adzuna',
        postedAt: job.created ? new Date(job.created).toLocaleDateString() : 'Recent',
        type: 'Full-time',
      }))
      .map((job) => ({ ...job, matchScore: scoreJob(job, skills, location) }))
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))

    if (!jobs.length) return NextResponse.json({ jobs: fallbackJobs(skills, location), fallback: true, warning: 'No live jobs matched, so mock jobs are being shown.' })
    return NextResponse.json({ jobs })
  } catch (error) {
    console.error('[api/jobs/search]', error)
    return NextResponse.json({ jobs: fallbackJobs(skills, location), fallback: true, warning: 'Adzuna is unavailable, so mock jobs are being shown.' })
  }
}

export async function POST(req: NextRequest) {
  try {
    await createClient()
    const contentType = req.headers.get('content-type') || ''
    let resumeText = ''
    let location = 'India'

    if (contentType.includes('application/json')) {
      const body = await req.json()
      resumeText = String(body.resumeText || '')
      location = String(body.location || 'India')
    } else {
      const formData = await req.formData()
      const file = (formData.get('resume') || formData.get('file')) as File | null
      if (!file) return NextResponse.json({ error: 'No resume uploaded' }, { status: 400 })
      resumeText = await extractTextFromUploadedFile(file)
    }

    if (!resumeText.trim()) return NextResponse.json({ error: 'resumeText is required' }, { status: 400 })

    let extractedSkills = extractSkillsHeuristic(resumeText)
    try {
      const groq = getGroqClient()
      const completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Extract resume skills. Return JSON only: {"skills":["React","TypeScript"]}.' },
          { role: 'user', content: resumeText.slice(0, 6000) },
        ],
      })
      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{"skills":[]}')
      extractedSkills = Array.isArray(parsed.skills) ? parsed.skills.map(String).slice(0, 30) : extractedSkills
    } catch (error) {
      console.error('[api/jobs/search skills]', error)
    }
    const query = extractedSkills.slice(0, 6).join(' ') || 'software developer'

    const appId = process.env.ADZUNA_APP_ID
    const appKey = process.env.ADZUNA_API_KEY
    if (!appId || !appKey) {
      return NextResponse.json({ extractedSkills, jobs: fallbackJobs(extractedSkills, location), fallback: true, warning: 'Adzuna credentials are missing, so mock jobs are being shown.' })
    }

    const url = new URL('https://api.adzuna.com/v1/api/jobs/in/search/1')
    url.searchParams.set('app_id', appId)
    url.searchParams.set('app_key', appKey)
    url.searchParams.set('results_per_page', '30')
    url.searchParams.set('what', query)
    url.searchParams.set('where', location)

    const response = await fetch(url, { next: { revalidate: 300 } })
    if (!response.ok) {
      return NextResponse.json({ extractedSkills, jobs: fallbackJobs(extractedSkills, location), fallback: true, warning: 'Adzuna is unavailable, so mock jobs are being shown.' })
    }
    const data = await response.json()
    const jobs = ((data.results || []) as any[])
      .map((job): Job => ({
        id: String(job.id),
        title: job.title || 'Untitled role',
        company: job.company?.display_name || 'Unknown company',
        location: job.location?.display_name || location,
        salary: job.salary_min ? `₹${Math.round(job.salary_min / 100000)}L - ₹${Math.round((job.salary_max || job.salary_min) / 100000)}L` : 'Not disclosed',
        description: job.description || '',
        url: job.redirect_url || '#',
        redirect_url: job.redirect_url || '#',
        platform: 'adzuna',
        postedAt: job.created ? new Date(job.created).toLocaleDateString() : 'Recent',
        type: 'Full-time',
      }))
      .map((job) => ({ ...job, matchScore: scoreJob(job, extractedSkills, location) }))
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))

    return NextResponse.json({ extractedSkills, jobs: jobs.length ? jobs : fallbackJobs(extractedSkills, location), fallback: !jobs.length })
  } catch (error) {
    console.error('[api/jobs/search POST]', error)
    return NextResponse.json({ error: 'Failed to extract skills from resume' }, { status: 500 })
  }
}
