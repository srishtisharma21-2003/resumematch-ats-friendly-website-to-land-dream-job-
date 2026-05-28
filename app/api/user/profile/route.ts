import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [profile, skills, experiences, education] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('skills').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('experiences').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('education').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  if (profile.error && profile.error.code !== 'PGRST116') {
    return NextResponse.json({ error: profile.error.message }, { status: 500 })
  }

  return NextResponse.json({
    profile: profile.data || { id: user.id, email: user.email },
    skills: skills.data || [],
    experiences: experiences.data || [],
    education: education.data || [],
  })
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const profile = body.profile || body

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    email: profile.email || user.email,
    first_name: profile.firstName ?? profile.first_name ?? '',
    last_name: profile.lastName ?? profile.last_name ?? '',
    full_name: [profile.firstName ?? profile.first_name ?? '', profile.lastName ?? profile.last_name ?? ''].filter(Boolean).join(' '),
    phone: profile.phone ?? '',
    location: profile.location ?? '',
    title: profile.title ?? '',
    bio: profile.bio ?? '',
    avatar_url: profile.avatarUrl ?? profile.avatar_url ?? null,
    notifications: body.notifications ?? profile.notifications ?? {},
    privacy: body.privacy ?? profile.privacy ?? {},
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (Array.isArray(body.skills)) {
    await supabase.from('skills').delete().eq('user_id', user.id)
    if (body.skills.length) {
      await supabase.from('skills').insert(body.skills.map((skill: any) => ({
        user_id: user.id,
        skill_name: skill.name || skill.skill_name || skill,
        name: skill.name || skill.skill_name || skill,
      })))
    }
  }

  if (Array.isArray(body.experiences)) {
    await supabase.from('experiences').delete().eq('user_id', user.id)
    if (body.experiences.length) {
      await supabase.from('experiences').insert(body.experiences.map((exp: any) => ({
        user_id: user.id,
        title: exp.title || '',
        company: exp.company || '',
        duration: exp.duration || '',
        current: Boolean(exp.current),
      })))
    }
  }

  if (Array.isArray(body.education)) {
    await supabase.from('education').delete().eq('user_id', user.id)
    if (body.education.length) {
      await supabase.from('education').insert(body.education.map((edu: any) => ({
        user_id: user.id,
        degree: edu.degree || '',
        school: edu.school || '',
        year: edu.year || '',
      })))
    }
  }

  return NextResponse.json({ success: true })
}
