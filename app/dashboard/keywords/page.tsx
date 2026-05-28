import { createClient } from '@/lib/supabase/server';
import { KeywordSuggestions } from '@/components/keyword-suggestions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function KeywordsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <div>Please log in</div>;

  const { data: analysis } = await supabase
    .from('resume_analyses')
    .select('id, file_name, missing_keywords, improvements, ai_summary, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const keywords = Array.isArray(analysis?.missing_keywords)
    ? analysis.missing_keywords.map((item: any, index: number) => ({
        id: String(index),
        text: typeof item === 'string' ? item : item.keyword || item.text || '',
        priority: (item.priority || 'medium') as 'high' | 'medium' | 'low',
        reason: 'Missing from your latest resume analysis',
      })).filter((item) => item.text)
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Keyword Suggester</h1>
        <p className="text-muted-foreground">Missing keywords from your latest AI resume analysis.</p>
      </div>

      {analysis ? (
        <>
          <KeywordSuggestions keywords={keywords} />
          <Card className="border-border/50 shadow-xl">
            <CardHeader><CardTitle className="text-xl">AI Improvements</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(analysis.improvements || []).map((item: string, index: number) => (
                  <div key={index} className="p-4 rounded-xl border border-border bg-card">
                    <p className="text-sm">{item}</p>
                  </div>
                ))}
                {analysis.ai_summary && <p className="text-sm text-muted-foreground">{analysis.ai_summary}</p>}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="border-border/50 shadow-xl">
          <CardContent className="p-8 text-sm text-muted-foreground">
            Upload a resume and job description first. Your AI keyword suggestions will appear here.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
