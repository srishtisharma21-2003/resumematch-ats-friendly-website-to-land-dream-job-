import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Missing Supabase service role key' }, { status: 500 })
  }

  const admin = createSupabaseAdmin(supabaseUrl, serviceKey)
  await admin.from('chat_sessions').delete().eq('user_id', user.id)
  await admin.from('applications').delete().eq('user_id', user.id)
  await admin.from('resume_analyses').delete().eq('user_id', user.id)
  await admin.from('skills').delete().eq('user_id', user.id)
  await admin.from('experiences').delete().eq('user_id', user.id)
  await admin.from('education').delete().eq('user_id', user.id)
  await admin.from('profiles').delete().eq('id', user.id)

  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  
  return NextResponse.json({ success: true })
}
