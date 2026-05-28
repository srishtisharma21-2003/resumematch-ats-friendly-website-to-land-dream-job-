import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("resume_analyses")
      .select("id, updated_resume, resume_text, updated_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("[api/resume GET]", error);
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { updated_resume, resume_text } = await request.json();
    if ((!updated_resume || typeof updated_resume !== "object") && typeof resume_text !== "string") {
      return NextResponse.json({ error: "updated_resume or resume_text is required" }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (updated_resume && typeof updated_resume === "object") updatePayload.updated_resume = updated_resume;
    if (typeof resume_text === "string") updatePayload.resume_text = resume_text;

    const { data, error } = await supabase
      .from("resume_analyses")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id, updated_at")
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("[api/resume PATCH]", error);
    return NextResponse.json({ error: "Autosave failed. Please try again." }, { status: 500 });
  }
}
