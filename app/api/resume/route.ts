import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const resumeText = String(body.resume_text || body.resumeText || "");
    const jobDescription = String(body.job_description || body.jobDescription || "");
    const fileName = String(body.file_name || body.fileName || "resume.txt");

    if (!resumeText.trim()) {
      return NextResponse.json({ error: "resume_text is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("resume_analyses")
      .insert({
        user_id: user.id,
        resume_text: resumeText,
        job_description: jobDescription,
        file_name: fileName,
        match_score: Number(body.match_score || body.matchScore || 0),
        missing_keywords: body.missing_keywords || body.missingKeywords || [],
        improvements: body.improvements || [],
        ai_summary: body.ai_summary || body.summary || "",
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) throw error;
    return NextResponse.json({ id: data.id, analysisId: data.id });
  } catch (error) {
    console.error("[api/resume POST]", error);
    return NextResponse.json({ error: "Could not save resume." }, { status: 500 });
  }
}
