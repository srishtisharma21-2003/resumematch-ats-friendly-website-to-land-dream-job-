'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useResumeStore, ResumeData } from '@/stores/resumeStore';
import ScoreCard from './-edit/ScoreCard';
import ChatPanel from './-edit/ChatPanel';
import EditableResumePreview from './-edit/EditableResumePreview';
import { Download, Sparkles, Eye, EyeOff, ArrowLeft, Pencil, CheckCircle2, AlertTriangle } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import debounce from 'lodash/debounce';

function createEmptyResume(): ResumeData {
  return {
    personal: { name: '', title: '', email: '', phone: '', city: '', linkedin: '' },
    summary: '',
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    skills: [],
    languages: [],
  };
}

function parsePlainTextToResume(text: string): ResumeData {
  const result = createEmptyResume();
  const lines = text.split('\n').filter(l => l.trim());
  const nameLine = lines.find(l => /^[A-Z][a-z]+ [A-Z][a-z]+/.test(l)) || lines[0];
  if (nameLine) result.personal.name = nameLine.trim();
  const emailMatch = text.match(/\b[\w.-]+@[\w.-]+\.\w+\b/);
  if (emailMatch) result.personal.email = emailMatch[0];
  const phoneMatch = text.match(/\+?\d{10,13}/);
  if (phoneMatch) result.personal.phone = phoneMatch[0];
  const summaryMatch = text.match(/Professional Summary\s*([\s\S]*?)(?=Education|Work Experience|Projects|Skills|$)/i);
  if (summaryMatch) result.summary = summaryMatch[1].trim();
  const skillsMatch = text.match(/(?:Technical Skills|Skills)\s*:?\s*([\s\S]*?)(?=Certifications|Honors|Projects|$)/i);
  if (skillsMatch) {
    const skillsText = skillsMatch[1];
    result.skills = skillsText.split(/[•,·\n]/).map(s => s.trim()).filter(s => s.length > 0 && s.length < 50);
  }
  const expMatch = text.match(/Work Experience\s*([\s\S]*?)(?=Education|Projects|Skills|Certifications|$)/i);
  if (expMatch) {
    const expText = expMatch[1];
    const bulletLines = expText.split(/\n[•-]/).map(b => b.trim()).filter(b => b.length > 10);
    if (bulletLines.length > 0) {
      result.experience.push({
        company: 'Experience',
        role: 'Role',
        startDate: '',
        endDate: '',
        bullets: bulletLines.slice(0, 5),
      });
    }
  }
  const eduMatch = text.match(/Education\s*([\s\S]*?)(?=Work Experience|Projects|Skills|Certifications|$)/i);
  if (eduMatch) {
    const eduText = eduMatch[1];
    const degreeMatch = eduText.match(/(?:B\.Tech|B\.E|M\.Tech|Bachelor|Master).*?(?=\n|$)/i);
    const schoolMatch = eduText.match(/(?:University|College|Institute).*?(?=\n|$)/i);
    result.education.push({
      degree: degreeMatch ? degreeMatch[0] : '',
      school: schoolMatch ? schoolMatch[0] : '',
      graduationDate: '',
      location: '',
      additional: '',
    });
  }
  return result;
}

export default function EditPage() {
  const params = useParams();
  const router = useRouter();
  const analysisId = params.id as string;
  const supabase = useMemo(() => createClient(), []);
  const { data: resumeData, setData, updateField, addItem } = useResumeStore();
  const [score, setScore] = useState(0);
  const [missingKeywords, setMissingKeywords] = useState<any[]>([]);
  const [improvements, setImprovements] = useState<string[]>([]);
  const [summary, setSummary] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);
  const [improvingSection, setImprovingSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [assistantOpen, setAssistantOpen] = useState(true);
  const [resumeName, setResumeName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [aiNotice, setAiNotice] = useState('');

  // Load analysis data
  useEffect(() => {
    async function load() {
      const { data: analysis, error } = await supabase
        .from('resume_analyses')
        .select('*')
        .eq('id', analysisId)
        .single();
      if (error || !analysis) { setLoading(false); return; }
      const originalText = analysis.resume_text || analysis.original_resume || '';
      setResumeText(originalText);
      setJobDescription(analysis.job_description || analysis.job_description_text || '');
      setScore(analysis.match_score || analysis.score || 0);
      setMissingKeywords(analysis.missing_keywords || []);
      setImprovements(Array.isArray(analysis.improvements) ? analysis.improvements : Object.values(analysis.improvements || {}));
      setSummary(analysis.ai_summary || analysis.summary || '');

      let parsedResume: ResumeData | null = null;
      const raw = analysis.updated_resume || originalText;
      if (typeof raw === 'object' && raw !== null) {
        parsedResume = raw as ResumeData;
      } else if (typeof raw === 'string') {
        if (raw.trim().startsWith('{')) {
          try { parsedResume = JSON.parse(raw); } catch (e) {}
        }
        if (!parsedResume && raw.length > 0) {
          parsedResume = parsePlainTextToResume(raw);
        }
      }
      if (!parsedResume) parsedResume = createEmptyResume();
      if (!Array.isArray(parsedResume.education)) parsedResume.education = [];
      if (!Array.isArray(parsedResume.skills)) parsedResume.skills = [];
      if (!Array.isArray(parsedResume.experience)) parsedResume.experience = [];
      if (!parsedResume.personal) parsedResume.personal = createEmptyResume().personal;
      setData(parsedResume);
      setResumeName(parsedResume.personal?.name || analysis.file_name || 'Untitled Resume');
      setLoading(false);
    }
    load();
  }, [analysisId, setData, supabase]);

  const saveToSupabase = useCallback(debounce(async (newData: ResumeData) => {
    setSaveState('saving');
    const { error } = await supabase
      .from('resume_analyses')
      .update({ updated_resume: newData, updated_at: new Date().toISOString() })
      .eq('id', analysisId);
    setSaveState(error ? 'error' : 'saved');
  }, 800), [analysisId, supabase]);

  useEffect(() => {
    if (!loading) saveToSupabase(resumeData);
    return () => saveToSupabase.cancel();
  }, [resumeData, loading, saveToSupabase]);

  const recalcScore = useCallback(async () => {
    if (isRecalculating) return;
    setIsRecalculating(true);
    setAiNotice('');
    try {
      const response = await fetch('/api/match/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId,
          resumeText: JSON.stringify(resumeData, null, 2),
          jobDescription: jobDescription || 'General role optimization and ATS compatibility review.',
          fileName: `${resumeName || 'resume'}.json`,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setAiNotice('AI scoring is temporarily unavailable. Your edits are still saved.');
        return;
      }
      const finalScore = data.score ?? data.matchScore ?? score ?? 0;
      const nextMissingKeywords = data.missingKeywords || [];
      setScore(finalScore);
      setMissingKeywords(nextMissingKeywords);
      setImprovements(data.improvements || []);
      setSummary(data.summary || '');
      await supabase
        .from('resume_analyses')
        .update({
          score: finalScore,
          missing_keywords: nextMissingKeywords.map((item: any) => typeof item === 'string' ? item : item.keyword).filter(Boolean),
          improvements: data.improvements || [],
          summary: data.summary || '',
          updated_at: new Date().toISOString(),
        })
        .eq('id', analysisId);
    } catch {
      setAiNotice('AI scoring is temporarily unavailable. Your edits are still saved.');
    } finally {
      setIsRecalculating(false);
    }
  }, [resumeData, analysisId, jobDescription, resumeName, supabase, isRecalculating, score]);

  // Scroll to section in right panel
  const scrollToSection = (sectionKey: string) => {
    const element = document.getElementById(`resume-section-${sectionKey}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setHighlightedSection(sectionKey);
      setTimeout(() => setHighlightedSection(null), 2000);
    }
  };

  const getSectionContent = (key: string) => {
    if (key === 'summary') return resumeData.summary || '';
    if (key === 'skills') return (resumeData.skills || []).join(', ');
    if (key === 'experience') return (resumeData.experience || []).map(exp => `${exp.role} at ${exp.company}\n${exp.bullets.join('\n')}`).join('\n\n');
    if (key === 'projects') return (resumeData.projects || []).map(proj => `${proj.title}\n${proj.bullets.join('\n')}`).join('\n\n');
    if (key === 'education') return (resumeData.education || []).map(edu => `${edu.degree} - ${edu.school}`).join('\n');
    return JSON.stringify(resumeData.personal);
  };

  const applyImprovedText = (key: string, improvedText: string) => {
    if (key === 'summary') updateField('summary', improvedText);
    else if (key === 'skills') updateField('skills', improvedText.split(/,|\n/).map(s => s.trim()).filter(Boolean));
    else if (key === 'experience') {
      if (resumeData.experience.length === 0) addItem('experience', { company: '', role: '', startDate: '', endDate: '', bullets: improvedText.split('\n').filter(Boolean) });
      else updateField('experience[0].bullets', improvedText.split('\n').map(b => b.replace(/^[-•]\s*/, '').trim()).filter(Boolean));
    }
    else if (key === 'projects') {
      if (resumeData.projects.length === 0) addItem('projects', { title: 'Project', bullets: improvedText.split('\n').filter(Boolean) });
      else updateField('projects[0].bullets', improvedText.split('\n').map(b => b.replace(/^[-•]\s*/, '').trim()).filter(Boolean));
    }
    else if (key === 'education') {
      if (resumeData.education.length === 0) addItem('education', { degree: '', school: '', graduationDate: '', location: '', additional: improvedText });
      else updateField('education[0].additional', improvedText);
    }
    setHighlightedSection(key);
    setTimeout(() => setHighlightedSection(null), 3000);
  };

  const quickApplySection = async (key: string) => {
    if (key === 'keywords') key = 'skills';
    setImprovingSection(key);
    setAiNotice('');
    try {
      const response = await fetch('/api/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId,
          sectionType: key,
          currentContent: getSectionContent(key),
          resumeText: JSON.stringify(resumeData, null, 2),
          jobDescription,
          missingKeywords,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.improvedText) {
        setAiNotice(data.error || 'AI improvement is temporarily unavailable. Please try again later.');
        return;
      }
      applyImprovedText(key, data.improvedText);
      if (data.fallback) {
        setAiNotice(data.message || 'Applied a local keyword-safe improvement because AI quota is temporarily unavailable.');
      }
    } catch {
      setAiNotice('AI improvement is temporarily unavailable. Please try again later.');
    } finally {
      setImprovingSection(null);
    }
  };

  const improveSection = async (sectionType: string, currentContent: string, apply: (value: string) => void) => {
    const response = await fetch('/api/improve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sectionType, currentContent, jobDescription, missingKeywords }),
    });
    const data = await response.json();
    if (!response.ok || !data.improvedText) {
      setAiNotice(data.error || 'AI improvement is temporarily unavailable. Please try again later.');
      return;
    }
    apply(data.improvedText);
    if (data.fallback) {
      setAiNotice(data.message || 'Applied a local keyword-safe improvement because AI quota is temporarily unavailable.');
    }
  };

  const handleExportPDF = () => {
    const element = document.getElementById('resume-preview');
    if (element) html2pdf().from(element).set({ margin: 0, filename: `${resumeName || 'resume'}.pdf`, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }).save();
  };

  const sectionScores = [
    { key: 'contact', title: 'Contact & Profile Completeness', score: [resumeData.personal?.name, resumeData.personal?.email, resumeData.personal?.phone, resumeData.personal?.linkedin].filter(Boolean).length * 4, max: 20, desc: 'Checks contact information, photo, and public profile links.' },
    { key: 'summary', title: 'Professional Summary', score: Math.min(12, Math.max(0, Math.round((resumeData.summary || '').length / 30))), max: 12, desc: 'Reviews clarity, metrics, and job-aligned keywords.' },
    { key: 'experience', title: 'Work Experience', score: Math.min(30, (resumeData.experience || []).reduce((acc, exp) => acc + 5 + (exp.bullets || []).filter((b) => /\d|%|\$|improved|reduced|increased/i.test(b)).length * 4, 0)), max: 30, desc: 'Checks measurable achievements, action verbs, and STAR structure.' },
    { key: 'keywords', title: 'Keywords & ATS Match', score: Math.max(0, 20 - missingKeywords.length * 3), max: 20, desc: `${missingKeywords.length} keyword${missingKeywords.length !== 1 ? 's' : ''} missing from the target job.` },
    { key: 'skills', title: 'Technical Skills', score: Math.min(20, (resumeData.skills || []).length * 2), max: 20, desc: 'Looks for relevant tools, frameworks, and technical depth.' },
    { key: 'projects', title: 'Projects & Portfolio', score: Math.min(20, (resumeData.projects || []).length * 6), max: 20, desc: 'Checks project scope, impact, metrics, and implementation proof.' },
    { key: 'education', title: 'Education & Credentials', score: Math.min(20, ((resumeData.education || []).length + (resumeData.certifications || []).length) * 7), max: 20, desc: 'Checks degree, institution, dates, certifications, and credentials.' },
  ];

  const normalizedKeywords = missingKeywords
    .map((item) => typeof item === 'string' ? { keyword: item, priority: 'medium' } : { keyword: item?.keyword || item?.text || item?.name, priority: item?.priority || 'medium' })
    .filter((item) => item.keyword);

  if (loading) return <div className="flex h-screen items-center justify-center">Loading editor...</div>;

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-50">
      <header className="flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-3 border-b bg-white px-4 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></button>
          {editingName ? (
            <input autoFocus value={resumeName} onChange={(e) => setResumeName(e.target.value)} onBlur={() => setEditingName(false)} className="max-w-[42vw] rounded-md border px-2 py-1 text-sm font-medium" />
          ) : (
            <button onClick={() => setEditingName(true)} className="flex min-w-0 items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium hover:bg-slate-100">
              <span className="truncate">{resumeName}</span> <Pencil className="h-3.5 w-3.5 shrink-0" />
            </button>
          )}
          <Link href="/dashboard" className="hidden rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 sm:inline-flex">
            Back to Dashboard
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs ${saveState === 'error' ? 'bg-red-100 text-red-700' : saveState === 'saving' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {saveState === 'error' ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            {saveState === 'saving' ? 'Saving...' : saveState === 'error' ? 'Save failed' : 'Saved'}
          </span>
          <button onClick={recalcScore} disabled={isRecalculating} className="flex items-center gap-1 rounded-md bg-blue-100 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-200 disabled:opacity-60">
            <Sparkles className="h-4 w-4" /> {isRecalculating ? 'Recalculating...' : 'Refresh Score'}
          </button>
          <button onClick={handleExportPDF} className="flex items-center gap-1 rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white">
            <Download className="h-4 w-4" /> PDF
          </button>
          <button onClick={() => setAssistantOpen(!assistantOpen)} className="flex items-center gap-1 rounded-md border bg-white px-3 py-1.5 text-sm">
            {assistantOpen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} Assistant
          </button>
        </div>
      </header>

      <div className={`min-h-0 flex-1 grid overflow-hidden max-lg:overflow-y-auto ${assistantOpen ? 'lg:grid-cols-[minmax(280px,0.85fr)_minmax(300px,0.95fr)_minmax(420px,1.35fr)]' : 'lg:grid-cols-[minmax(320px,0.8fr)_minmax(520px,1.6fr)]'}`}>
        <aside className="min-h-0 overflow-y-auto border-r bg-white p-5 scrollbar-thin max-lg:min-h-[70vh]">
          <ScoreCard
            score={score || 0}
            missingCount={missingKeywords.length || 0}
            sections={sectionScores}
            onSectionClick={scrollToSection}
            onQuickApply={quickApplySection}
            improvingSection={improvingSection}
          />

          <div className="mt-6 space-y-4">
            {aiNotice && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                {aiNotice}
              </div>
            )}

            <section className="rounded-lg border bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-950">Missing Keywords</h2>
                <span className="rounded-md bg-white px-2 py-1 text-xs text-slate-500">{normalizedKeywords.length} found</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {normalizedKeywords.length ? normalizedKeywords.map((item, index) => (
                  <span key={`${item.keyword}-${index}`} className={`rounded-md px-2.5 py-1 text-xs font-medium ${item.priority === 'high' ? 'bg-red-100 text-red-700' : item.priority === 'low' ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-700'}`}>
                    {item.keyword}
                  </span>
                )) : <p className="text-sm text-slate-500">No missing keywords recorded for this analysis.</p>}
              </div>
            </section>

            <section className="rounded-lg border bg-white p-4">
              <h2 className="text-sm font-semibold text-slate-950">AI Summary</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{summary || 'Refresh the score to generate the latest ATS summary.'}</p>
            </section>

            <section className="rounded-lg border bg-white p-4">
              <h2 className="text-sm font-semibold text-slate-950">Section Improvements</h2>
              <div className="mt-3 space-y-3">
                {['summary', 'experience', 'skills', 'projects', 'education'].map((section) => (
                  <div key={section} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium capitalize text-slate-900">{section}</p>
                        <p className="text-xs text-slate-500">Rewrite with job context and missing keywords.</p>
                      </div>
                      <button
                        onClick={() => quickApplySection(section)}
                        disabled={improvingSection === section}
                        className="shrink-0 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                      >
                        {improvingSection === section ? 'Applying...' : 'Apply Improvement'}
                      </button>
                    </div>
                  </div>
                ))}
                {improvements.slice(0, 6).map((item, index) => (
                  <p key={index} className="rounded-md bg-blue-50 p-3 text-sm leading-6 text-blue-950">{String(item)}</p>
                ))}
              </div>
            </section>
          </div>
        </aside>

        {assistantOpen && (
          <section className="min-h-0 overflow-hidden border-r bg-white max-lg:min-h-[70vh]">
            <ChatPanel
              analysisId={analysisId}
              resumeText={resumeText || JSON.stringify(resumeData, null, 2)}
              jobDescription={jobDescription}
              missingKeywords={missingKeywords}
              resumeData={resumeData}
              onApplySuggestion={applyImprovedText}
            />
          </section>
        )}

        <aside className="min-h-0 overflow-auto bg-slate-100 p-4 scrollbar-thin max-lg:min-h-[85vh]">
          <EditableResumePreview missingKeywords={missingKeywords} highlightedSection={highlightedSection} />
        </aside>
      </div>
    </div>
  );
}
