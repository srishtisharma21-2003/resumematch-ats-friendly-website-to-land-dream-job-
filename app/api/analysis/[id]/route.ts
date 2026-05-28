import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const createSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabaseAdmin = createSupabaseAdmin();

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Missing Supabase service role key" },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("resume_analyses")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { updated_resume } = body;
    const supabaseAdmin = createSupabaseAdmin();

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Missing Supabase service role key" },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("resume_analyses")
      .update({ updated_resume, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
