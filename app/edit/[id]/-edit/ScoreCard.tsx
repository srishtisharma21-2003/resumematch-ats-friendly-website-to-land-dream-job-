'use client';

import type { ReactNode } from 'react';
import { memo } from 'react';
import { AlertTriangle, CheckCircle2, ArrowUpRight, User, FileText, Briefcase, Sparkle, Wrench, FolderGit2, GraduationCap, Zap } from 'lucide-react';

type SectionScore = {
  key: string;
  title: string;
  score: number;
  max: number;
  desc: string;
};

function ScoreCard({
  score,
  missingCount,
  sections,
  onSectionClick,
  onQuickApply,
  improvingSection,
}: {
  score: number;
  missingCount: number;
  sections?: SectionScore[];
  onSectionClick?: (key: string) => void;
  onQuickApply?: (key: string) => void;
  improvingSection?: string | null;
}) {
  const iconMap: Record<string, ReactNode> = {
    contact: <User className="h-4 w-4" />,
    summary: <FileText className="h-4 w-4" />,
    experience: <Briefcase className="h-4 w-4" />,
    keywords: <Sparkle className="h-4 w-4" />,
    skills: <Wrench className="h-4 w-4" />,
    projects: <FolderGit2 className="h-4 w-4" />,
    education: <GraduationCap className="h-4 w-4" />,
  };

  const steps = sections || [
    { key: 'contact', title: 'Contact & Profile Completeness', score: score >= 80 ? 20 : score >= 50 ? 10 : 5, max: 20, desc: 'Complete your contact info and professional title' },
    { key: 'summary', title: 'Professional Summary', score: score >= 80 ? 20 : score >= 50 ? 12 : 8, max: 20, desc: 'Write a compelling summary with key achievements' },
    { key: 'experience', title: 'Work Experience', score: score >= 80 ? 30 : score >= 50 ? 20 : 10, max: 30, desc: 'Add measurable impact and action verbs' },
    { key: 'keywords', title: 'Keywords & ATS Match', score: missingCount <= 3 ? 20 : missingCount <= 6 ? 12 : 6, max: 20, desc: `Missing ${missingCount} keyword${missingCount !== 1 ? 's' : ''}` },
  ];

  const radius = 44;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const ready = score >= 90;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-gradient-to-br from-blue-50 to-purple-50 p-5">
        <div className="flex items-center gap-5">
          <div className="relative">
            <svg width="110" height="110" className="-rotate-90">
              <circle cx="55" cy="55" r={radius} stroke="#e2e8f0" strokeWidth="10" fill="none" />
              <circle cx="55" cy="55" r={radius} stroke="url(#grad)" strokeWidth="10" fill="none" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
              <defs><linearGradient id="grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#a855f7" /></linearGradient></defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center"><div className="text-2xl font-bold text-slate-900">{score}</div><div className="text-[10px] text-slate-500">/100</div></div>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-slate-900">Resume Analysis</h3>
            <p className="text-sm text-slate-600 mt-1">Your resume scored {score} out of 100</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Overall score</span>
              {score < 80 && <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Needs attention</span>}
              {ready && <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Ready</span>}
            </div>
          </div>
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-2">Steps to increase your score</h4>
        <div className="space-y-2">
          {steps.map((s, index) => {
            const status = s.score / s.max >= 0.8 ? 'good' : s.score / s.max >= 0.55 ? 'ok' : 'weak';
            return (
            <div key={s.key} onClick={() => onSectionClick?.(s.key)} className={`w-full text-left rounded-xl border p-3 flex items-center gap-3 transition cursor-pointer ${status === 'weak' ? 'border-red-200 bg-red-50/40' : status === 'good' ? 'border-green-200 bg-green-50/40' : 'border-yellow-200 bg-yellow-50/40'}`}>
              <div className="h-7 w-7 rounded-full bg-white border flex items-center justify-center text-xs font-semibold text-slate-700">{index + 1}</div>
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">{iconMap[s.key] || <Sparkle className="h-4 w-4" />}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><span className="text-sm font-medium text-slate-900 truncate">{s.title}</span><span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${status === 'weak' ? 'bg-red-100 text-red-700' : status === 'good' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{s.score}/{s.max}</span></div>
                <p className="text-xs text-slate-500 truncate">{s.desc}</p>
              </div>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onQuickApply?.(s.key);
                }}
                disabled={improvingSection === s.key}
                className="text-[10px] px-2 py-1 rounded-full bg-white border text-slate-700 hover:bg-blue-50 flex items-center gap-1"
              >
                <Zap className="h-3 w-3" /> {improvingSection === s.key ? 'Applying' : 'Quick Apply'}
              </button>
              <ArrowUpRight className="h-4 w-4 text-slate-400 shrink-0" />
            </div>
          )})}
        </div>
      </div>
    </div>
  );
}

export default memo(ScoreCard);
