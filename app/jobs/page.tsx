'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bookmark, BriefcaseBusiness, ExternalLink, RefreshCw, Search, Trash2 } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api';
import { ApplicationItem, JobResult, useJobStore } from '@/stores/jobStore';

const statuses = ['applied', 'interview', 'rejected', 'offer', 'archived'] as const;

type LatestResumeAnalysis = {
  updated_resume?: unknown;
  resume_text?: string | null;
  original_resume?: string | null;
  extracted_skills?: unknown;
};

function scoreClass(score = 0) {
  if (score >= 80) return 'bg-emerald-100 text-emerald-700';
  if (score >= 60) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}

function resumeToText(value: unknown) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

export default function JobsPage() {
  const { jobs, applications, extractedSkills, setJobs, setApplications, setExtractedSkills } = useJobStore();
  const [resumeText, setResumeText] = useState('');
  const [loadingResume, setLoadingResume] = useState(true);
  const [searching, setSearching] = useState(false);
  const [savingJobId, setSavingJobId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const analytics = useMemo(() => {
    const active = applications.filter((app) => app.status !== 'archived');
    const average = active.length
      ? Math.round(active.reduce((sum, app) => sum + Number(app.match_score || 0), 0) / active.length)
      : 0;
    const interviewCount = active.filter((app) => app.status === 'interview' || app.status === 'offer').length;
    const interviewRate = active.length ? Math.round((interviewCount / active.length) * 100) : 0;
    return { total: active.length, average, interviewRate };
  }, [applications]);

  async function loadApplications() {
    const data = await apiClient<{ applications: ApplicationItem[] }>('/api/applications', { timeoutMs: 20000 });
    setApplications(data.applications || []);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      setLoadingResume(true);
      try {
        const { analysis } = await apiClient<{ analysis: LatestResumeAnalysis | null }>('/api/resume/latest', { timeoutMs: 20000 });

        if (!cancelled && analysis) {
          const text = resumeToText(analysis.updated_resume) || analysis.resume_text || analysis.original_resume || '';
          setResumeText(text);
          const skills = Array.isArray(analysis.extracted_skills) ? analysis.extracted_skills.map(String).slice(0, 10) : [];
          setExtractedSkills(skills);
        }
        if (!cancelled) await loadApplications();
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load job data.');
      } finally {
        if (!cancelled) setLoadingResume(false);
      }
    }

    loadInitialData();
    return () => {
      cancelled = true;
    };
  }, [setApplications, setExtractedSkills]);

  async function findJobs() {
    setSearching(true);
    setError('');
    try {
      const data = await apiClient<{ jobs: JobResult[]; extractedSkills?: string[]; fallback?: boolean; warning?: string }>('/api/jobs/search', {
        method: 'POST',
        body: { resumeText, location: 'India' },
        timeoutMs: 60000,
      });
      setJobs(data.jobs || []);
      setExtractedSkills((data.extractedSkills || extractedSkills).slice(0, 10));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Job search failed.');
    } finally {
      setSearching(false);
    }
  }

  async function saveApplication(job: JobResult) {
    setSavingJobId(job.id);
    setError('');
    try {
      await apiClient('/api/jobs/apply', {
        method: 'POST',
        body: {
          ...job,
          job_id: job.id,
          matchScore: job.matchScore,
          redirect_url: job.redirect_url || job.url,
          status: 'applied',
        },
      });
      await loadApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save application.');
    } finally {
      setSavingJobId(null);
    }
  }

  async function updateStatus(id: string, status: string) {
    const previous = applications;
    setApplications(applications.map((app) => app.id === id ? { ...app, status: status as ApplicationItem['status'] } : app));
    try {
      await apiClient('/api/applications/update', { method: 'POST', body: { id, status } });
    } catch (err) {
      setApplications(previous);
      setError(err instanceof Error ? err.message : 'Could not update status.');
    }
  }

  async function deleteApplication(id: string) {
    const previous = applications;
    setApplications(applications.filter((app) => app.id !== id));
    try {
      await apiClient(`/api/applications?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (err) {
      setApplications(previous);
      setError(err instanceof Error ? err.message : 'Could not delete application.');
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50">
      <Navbar />
      <section className="mx-auto flex max-w-screen-xl flex-col gap-6 px-4 pb-12 pt-24 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">Jobs</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Search India jobs from your latest resume analysis, compare match scores, and keep application status in one place.
            </p>
          </div>
          <Button onClick={findJobs} disabled={searching || loadingResume || !resumeText.trim()} className="rounded-md">
            {searching ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Find Jobs
          </Button>
        </div>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-lg">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Applications</CardTitle></CardHeader>
            <CardContent className="text-3xl font-bold">{analytics.total}</CardContent>
          </Card>
          <Card className="rounded-lg">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Average Match</CardTitle></CardHeader>
            <CardContent className="text-3xl font-bold">{analytics.average}%</CardContent>
          </Card>
          <Card className="rounded-lg">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Interview Rate</CardTitle></CardHeader>
            <CardContent className="text-3xl font-bold">{analytics.interviewRate}%</CardContent>
          </Card>
        </div>

        <section className="rounded-lg border bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950">Search Inputs</h2>
            <div className="flex flex-wrap gap-2">
              {extractedSkills.length ? extractedSkills.map((skill) => (
                <span key={skill} className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{skill}</span>
              )) : <span className="text-sm text-slate-500">Skills will be extracted when you search.</span>}
            </div>
          </div>
          <textarea
            value={resumeText}
            onChange={(event) => setResumeText(event.target.value)}
            rows={5}
            className="w-full resize-y rounded-md border bg-slate-50 p-3 text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Latest resume analysis text appears here. Paste resume text if none is available."
          />
        </section>

        <section className="min-h-0 rounded-lg border bg-white p-4">
          <div className="mb-4 flex items-center gap-2">
            <BriefcaseBusiness className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-950">Job Results</h2>
          </div>
          <div className="grid max-h-[620px] gap-4 overflow-y-auto pr-1 scrollbar-thin md:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job) => (
              <article key={job.id} className="flex min-h-64 flex-col rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 text-base font-semibold text-slate-950">{job.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{job.company}</p>
                  </div>
                  <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold ${scoreClass(job.matchScore)}`}>{job.matchScore || 0}%</span>
                </div>
                <p className="mt-3 text-sm text-slate-500">{job.location}</p>
                <p className="mt-1 text-sm font-medium text-slate-700">{job.salary || 'Not disclosed'}</p>
                <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">{job.description}</p>
                <div className="mt-4 flex gap-2">
                  <Button asChild variant="outline" className="flex-1 rounded-md">
                    <a href={job.redirect_url || job.url || '#'} target="_blank" rel="noopener noreferrer">
                      Apply Now <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                  <Button onClick={() => saveApplication(job)} disabled={savingJobId === job.id} className="flex-1 rounded-md">
                    <Bookmark className="mr-2 h-4 w-4" />
                    {savingJobId === job.id ? 'Saving' : 'Save'}
                  </Button>
                </div>
              </article>
            ))}
            {!jobs.length && (
              <div className="col-span-full rounded-lg border border-dashed p-8 text-center text-sm text-slate-500">
                {searching ? 'Finding matched jobs...' : 'Click Find Jobs to generate matched job results.'}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-lg border bg-white p-4">
          <h2 className="mb-4 text-lg font-semibold text-slate-950">Application Tracker</h2>
          <div className="max-h-[520px] overflow-y-auto scrollbar-thin">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[2fr_1.2fr_0.8fr_1fr_1fr_56px] gap-3 border-b px-3 py-2 text-xs font-semibold uppercase text-slate-500">
                <span>Job</span><span>Company</span><span>Match</span><span>Status</span><span>Date</span><span />
              </div>
              {applications.map((app) => (
                <div key={app.id} className="grid grid-cols-[2fr_1.2fr_0.8fr_1fr_1fr_56px] items-center gap-3 border-b px-3 py-3 text-sm">
                  <span className="font-medium text-slate-900">{app.title || app.job_title}</span>
                  <span className="text-slate-600">{app.company}</span>
                  <span><span className={`rounded-md px-2 py-1 text-xs font-semibold ${scoreClass(app.match_score)}`}>{app.match_score || 0}%</span></span>
                  <select value={app.status || 'applied'} onChange={(event) => updateStatus(app.id, event.target.value)} className="rounded-md border bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                  <span className="text-slate-500">{app.applied_at ? new Date(app.applied_at).toLocaleDateString() : '-'}</span>
                  <button onClick={() => deleteApplication(app.id)} className="grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label="Delete application">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {!applications.length && <div className="px-3 py-8 text-center text-sm text-slate-500">Saved applications will appear here.</div>}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
