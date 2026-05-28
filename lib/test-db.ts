import { supabase } from "./supabase";

export async function checkDatabase() {
  try {
    // Attempt a simple query to see if it connects
    const { data, error } = await supabase.from('resume_analyses').select('*').limit(1);
    
    if (error) {
      console.error("❌ Supabase Error:", error.message);
      return false;
    }
    console.log("✅ Supabase Connected Successfully!");
    return true;
  } catch (err) {
    console.error("❌ Supabase Setup Error:", err);
    return false;
  }
}