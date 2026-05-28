import { createClient } from '@/lib/supabase/server';
import { MatchScoreCard } from '@/components/match-score-card';
import { KeywordSuggestions } from '@/components/keyword-suggestions';
import { RecentJobsCard } from '@/components/recent-jobs-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Target, Briefcase, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const fallbackStats = [
  { title: "Resumes Analyzed", value: "0", icon: FileText, change: "Upload your first resume", color: "from-cyan-400 to-blue-500" },
  { title: "Avg Match Score", value: "0%", icon: Target, change: "Analyze a job to see score", color: "from-emerald-400 to-cyan-400" },
  { title: "Jobs Applied", value: "0", icon: Briefcase, change: "Start applying", color: "from-fuchsia-500 to-pink-400" },
  { title: "Recent Analyses", value: "0", icon: TrendingUp, change: "No analyses yet", color: "from-yellow-400 to-orange-500" },
];

const fallbackCategories = [
  { name: "Technical Skills", score: 0, maxScore: 100 },
  { name: "Experience Level", score: 0, maxScore: 100 },
  { name: "Education", score: 0, maxScore: 100 },
  { name: "Soft Skills", score: 0, maxScore: 100 },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <div>Please log in</div>;

  // Fetch user's profile for real name
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', user.id)
    .single();

  const displayName = profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : user.email?.split('@')[0] || 'User';

  const { data: analyses, count: analysesCount } = await supabase
    .from('resume_analyses')
    .select('id, file_name, match_score, missing_keywords, ai_summary, created_at', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const { count: jobsApplied } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const latestAnalysis = analyses?.[0];
  const avgMatchScore = analyses?.length
    ? Math.round(analyses.reduce((acc, a) => acc + (a.match_score || 0), 0) / analyses.length)
    : 0;

  let keywords: Array<{ id: string; text: string; priority: "high" | "medium" | "low"; reason: string }> = [];
  if (latestAnalysis?.missing_keywords && Array.isArray(latestAnalysis.missing_keywords)) {
    keywords = latestAnalysis.missing_keywords.map((k: any, idx: number) => ({
      id: String(idx),
      text: k.keyword || k,
      priority: k.priority || 'medium',
      reason: k.reason || 'Missing from your resume',
    }));
  }

  const { data: applications } = await supabase
    .from('applications')
    .select('id, job_id, title, company, location, salary, match_score, job_url, platform, applied_at')
    .eq('user_id', user.id)
    .order('applied_at', { ascending: false })
    .limit(4);

  const knownPlatforms = ['linkedin', 'naukri', 'instahire', 'wellfound', 'adzuna'] as const;
  const jobs = (applications || []).map((job: any) => ({
    id: job.job_id || job.id,
    title: job.title,
    company: job.company,
    location: job.location || 'Not specified',
    salary: job.salary || 'Not disclosed',
    matchScore: job.match_score || 0,
    platform: knownPlatforms.includes(job.platform) ? job.platform : 'adzuna',
    postedAt: job.applied_at ? new Date(job.applied_at).toLocaleDateString() : 'recent',
  }));

  const hasRealData = (analysesCount || 0) > 0;
  const stats = hasRealData
    ? [
        { title: "Resumes Analyzed", value: String(analysesCount || 0), icon: FileText, change: "Total saved analyses", color: "from-cyan-400 to-blue-500" },
        { title: "Avg Match Score", value: `${avgMatchScore}%`, icon: Target, change: "Average across analyses", color: "from-emerald-400 to-cyan-400" },
        { title: "Jobs Applied", value: String(jobsApplied || 0), icon: Briefcase, change: "Saved applications", color: "from-fuchsia-500 to-pink-400" },
        { title: "Recent Analyses", value: String(Math.min(analyses?.length || 0, 6)), icon: TrendingUp, change: "Shown below", color: "from-yellow-400 to-orange-500" },
      ]
    : fallbackStats;

  const matchScore = latestAnalysis?.match_score || 0;
  const aiSummary = latestAnalysis?.ai_summary || (hasRealData ? "Review the latest missing keywords and refine your resume from the editor." : "Upload a resume and job description to generate your first AI analysis.");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome back, {displayName}!</h1>
        <p className="text-muted-foreground">Track your resume performance and job applications.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border/50 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <MatchScoreCard score={matchScore} previousScore={matchScore - 5} categories={fallbackCategories} aiSummary={aiSummary} />
        </div>
        <div className="lg:col-span-2">
          <KeywordSuggestions keywords={keywords} />
        </div>
      </div>

      <Card className="border-border/50 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Recent Analyses</CardTitle>
          <Link href="/match" className="text-sm text-primary inline-flex items-center gap-1">
            New Analysis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {analyses && analyses.length > 0 ? (
            <div className="space-y-3">
              {analyses.slice(0, 6).map((item: any) => (
                <Link
                  key={item.id}
                  href={`/edit/${item.id}`}
                  className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all"
                >
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{item.file_name || 'Resume analysis'}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recently analyzed'}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold">{item.match_score || 0}%</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Upload a resume and job description to generate your first analysis.</p>
          )}
        </CardContent>
      </Card>

      {jobs.length > 0 ? <RecentJobsCard jobs={jobs} /> : null}
    </div>
  );
}
