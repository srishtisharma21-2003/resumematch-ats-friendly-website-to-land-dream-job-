import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', user.id)
    .order('applied_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ applications: data || [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const job = await req.json()
  const jobId = String(job.job_id || job.id || '')

  const { data: existing } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', user.id)
    .eq('job_id', jobId)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ success: true, application: existing })
  }

  const { data, error } = await supabase
    .from('applications')
    .insert({
      user_id: user.id,
      job_id: jobId,
      title: job.title || job.job_title || '',
      company: job.company || '',
      location: job.location || '',
      salary: job.salary || '',
      match_score: Number(job.matchScore ?? job.match_score ?? 0),
      job_url: job.redirect_url || job.url || job.job_url || '',
      status: job.status || 'applied',
      applied_at: job.applied_at || new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, application: data })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const id = String(body.id || '')
  const status = String(body.status || '')
  const allowed = new Set(['applied', 'interview', 'rejected', 'offer', 'archived'])
  if (!id || !allowed.has(status)) {
    return NextResponse.json({ error: 'Valid id and status are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, application: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
