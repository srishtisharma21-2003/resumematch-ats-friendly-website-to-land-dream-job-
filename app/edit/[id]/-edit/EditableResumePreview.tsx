'use client';

import { useResumeStore } from '@/stores/resumeStore';
import { memo, useCallback } from 'react';
import { Plus } from 'lucide-react';

function HighlightedText({ text, keywords }: { text: string; keywords: string[] }) {
  const cleanKeywords = keywords.map((keyword) => keyword.trim()).filter((keyword) => keyword.length > 1);
  if (!cleanKeywords.length || !text) return <>{text}</>;
  const escaped = cleanKeywords.map((keyword) => keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  return (
    <>
      {text.split(regex).map((part, index) => {
        const isMissing = cleanKeywords.some((keyword) => keyword.toLowerCase() === part.toLowerCase());
        return isMissing ? <mark key={index} className="bg-red-200 dark:bg-red-800 rounded px-0.5">{part}</mark> : <span key={index}>{part}</span>;
      })}
    </>
  );
}

function EditableResumePreview({ missingKeywords = [], highlightedSection }: { missingKeywords?: any[]; highlightedSection?: string | null }) {
  const { data, updateField, updateArrayItem, updateBullet, addItem, removeItem } = useResumeStore();
  const keywordText = missingKeywords.map((item) => typeof item === 'string' ? item : item?.keyword || item?.text).filter(Boolean);
  const sectionClass = (key: string) => highlightedSection === key ? 'bg-green-200/70 transition-colors duration-500' : 'transition-colors duration-500';

  const handleBlur = useCallback((path: string, value: string) => {
    updateField(path, value);
  }, [updateField]);

  const handleBulletChange = useCallback((expIndex: number, bulletIndex: number, newText: string) => {
    updateBullet('experience', expIndex, bulletIndex, newText);
  }, [updateBullet]);

  const addBullet = useCallback((expIndex: number) => {
    const newBullets = [...data.experience[expIndex].bullets, ''];
    updateArrayItem('experience', expIndex, 'bullets', newBullets);
  }, [data.experience, updateArrayItem]);

  const addExperience = () => {
    addItem('experience', { company: '', role: '', startDate: '', endDate: '', bullets: [''] });
  };

  const addEducation = () => {
    addItem('education', { degree: '', school: '', graduationDate: '', location: '', additional: '' });
  };

  const addProject = () => {
    addItem('projects', { title: '', bullets: [''] });
  };

  const phone = data.personal?.phone || '';
  const email = data.personal?.email || '';
  const linkedin = data.personal?.linkedin || '';
  const name = data.personal?.name || 'Your Name';
  const title = data.personal?.title || '';

  const editableClass = 'rounded-sm outline-none transition hover:bg-blue-50 focus:bg-blue-50 focus:ring-2 focus:ring-blue-400';

  return (
    <div id="resume-preview" className="mx-auto w-full max-w-[210mm] bg-white shadow-lg" style={{ minHeight: '297mm', padding: 'clamp(16px, 4vw, 14mm)' }}>
      {/* Contact header */}
      <div id="resume-section-contact" className={`text-center text-[11px] text-slate-700 pb-2 border-b flex flex-wrap justify-center gap-2 ${sectionClass('contact')}`}>
        <span contentEditable suppressContentEditableWarning onBlur={(e) => handleBlur('personal.phone', e.currentTarget.innerText)} className={editableClass}>{phone}</span>
        <span>|</span>
        <span contentEditable suppressContentEditableWarning onBlur={(e) => handleBlur('personal.email', e.currentTarget.innerText)} className={editableClass}>{email}</span>
        <span>|</span>
        <span contentEditable suppressContentEditableWarning onBlur={(e) => handleBlur('personal.linkedin', e.currentTarget.innerText)} className={`${editableClass} text-blue-600 underline`}>{linkedin}</span>
      </div>

      {/* Name & Title */}
      <div className="mt-3 text-center">
        <h1 contentEditable suppressContentEditableWarning onBlur={(e) => handleBlur('personal.name', e.currentTarget.innerText)} className={`${editableClass} text-2xl font-bold`}>{name}</h1>
        <p contentEditable suppressContentEditableWarning onBlur={(e) => handleBlur('personal.title', e.currentTarget.innerText)} className={`${editableClass} mt-1 text-sm text-blue-600`}>{title}</p>
      </div>

      {/* Summary */}
      <div id="resume-section-summary" className={`mt-3 ${sectionClass('summary')}`}>
        <h2 className="text-[11px] font-bold tracking-wide border-b mb-1 pb-0.5">PROFESSIONAL SUMMARY</h2>
        <div contentEditable suppressContentEditableWarning onBlur={(e) => handleBlur('summary', e.currentTarget.innerText)} className={`${editableClass} whitespace-pre-wrap text-[10px]`}><HighlightedText text={data.summary || ''} keywords={keywordText} /></div>
      </div>

      {/* Work Experience */}
      <div id="resume-section-experience" className={`mt-3 ${sectionClass('experience')}`}>
        <h2 className="text-[11px] font-bold tracking-wide border-b mb-1 pb-0.5">WORK EXPERIENCE</h2>
        {data.experience.map((exp, expIdx) => (
          <div key={expIdx} className="mb-2 text-[10px] border-b pb-2">
            <div className="flex justify-between font-semibold">
              <span contentEditable suppressContentEditableWarning onBlur={(e) => updateArrayItem('experience', expIdx, 'company', e.currentTarget.innerText)} className={editableClass}>{exp.company}</span>
              <span contentEditable suppressContentEditableWarning onBlur={(e) => {
                const [start, end] = e.currentTarget.innerText.split(' – ');
                updateArrayItem('experience', expIdx, 'startDate', start);
                updateArrayItem('experience', expIdx, 'endDate', end);
              }} className={`${editableClass} font-normal italic`}>{exp.startDate} – {exp.endDate}</span>
            </div>
            <div contentEditable suppressContentEditableWarning onBlur={(e) => updateArrayItem('experience', expIdx, 'role', e.currentTarget.innerText)} className={`${editableClass} italic`}>{exp.role}</div>
            <ul className="list-disc pl-5 mt-1 space-y-0.5">
              {exp.bullets.map((bullet, bulletIdx) => (
                <li key={bulletIdx}>
                  <span contentEditable suppressContentEditableWarning onBlur={(e) => handleBulletChange(expIdx, bulletIdx, e.currentTarget.innerText)} className={editableClass}><HighlightedText text={bullet || ''} keywords={keywordText} /></span>
                </li>
              ))}
              <li><button onClick={() => addBullet(expIdx)} className="text-blue-500 text-xs">+ Add bullet</button></li>
            </ul>
            <button onClick={() => removeItem('experience', expIdx)} className="text-red-500 text-xs mt-1">× Remove</button>
          </div>
        ))}
        <button onClick={addExperience} className="text-blue-500 text-xs flex items-center gap-1 mt-1"><Plus className="h-3 w-3" /> Add Experience</button>
      </div>

      {/* Education (now array) */}
      <div id="resume-section-education" className={`mt-3 ${sectionClass('education')}`}>
        <h2 className="text-[11px] font-bold tracking-wide border-b mb-1 pb-0.5">EDUCATION</h2>
        {data.education.map((edu, eduIdx) => (
          <div key={eduIdx} className="mb-2 text-[10px] border-b pb-2">
            <div className="flex justify-between">
              <span contentEditable suppressContentEditableWarning onBlur={(e) => updateArrayItem('education', eduIdx, 'degree', e.currentTarget.innerText)} className={`${editableClass} font-semibold`}>{edu.degree}</span>
              <span contentEditable suppressContentEditableWarning onBlur={(e) => updateArrayItem('education', eduIdx, 'graduationDate', e.currentTarget.innerText)} className={editableClass}>{edu.graduationDate}</span>
            </div>
            <div contentEditable suppressContentEditableWarning onBlur={(e) => updateArrayItem('education', eduIdx, 'school', e.currentTarget.innerText)} className={editableClass}>{edu.school}</div>
            <div contentEditable suppressContentEditableWarning onBlur={(e) => updateArrayItem('education', eduIdx, 'location', e.currentTarget.innerText)} className={`${editableClass} text-xs`}>{edu.location}</div>
            <div contentEditable suppressContentEditableWarning onBlur={(e) => updateArrayItem('education', eduIdx, 'additional', e.currentTarget.innerText)} className={`${editableClass} text-xs italic`}>{edu.additional}</div>
            <button onClick={() => removeItem('education', eduIdx)} className="text-red-500 text-xs mt-1">× Remove</button>
          </div>
        ))}
        <button onClick={addEducation} className="text-blue-500 text-xs flex items-center gap-1"><Plus className="h-3 w-3" /> Add Education</button>
      </div>

      {/* Projects */}
      <div id="resume-section-projects" className={`mt-3 ${sectionClass('projects')}`}>
        <h2 className="text-[11px] font-bold tracking-wide border-b mb-1 pb-0.5">PROJECTS</h2>
        {data.projects.map((proj, projIdx) => (
          <div key={projIdx} className="mb-2">
            <div contentEditable suppressContentEditableWarning onBlur={(e) => updateArrayItem('projects', projIdx, 'title', e.currentTarget.innerText)} className={`${editableClass} text-[10px] font-semibold`}>{proj.title}</div>
            <ul className="list-disc pl-5">
              {proj.bullets.map((bullet, bulletIdx) => (
                <li key={bulletIdx}>
                  <span contentEditable suppressContentEditableWarning onBlur={(e) => {
                    const newBullets = [...proj.bullets];
                    newBullets[bulletIdx] = e.currentTarget.innerText;
                    updateArrayItem('projects', projIdx, 'bullets', newBullets);
                  }} className={`${editableClass} text-[10px]`}><HighlightedText text={bullet || ''} keywords={keywordText} /></span>
                </li>
              ))}
              <li><button onClick={() => {
                const newBullets = [...proj.bullets, ''];
                updateArrayItem('projects', projIdx, 'bullets', newBullets);
              }} className="text-blue-500 text-xs">+ Add bullet</button></li>
            </ul>
            <button onClick={() => removeItem('projects', projIdx)} className="text-red-500 text-xs mt-1">× Remove</button>
          </div>
        ))}
        <button onClick={addProject} className="text-blue-500 text-xs flex items-center gap-1"><Plus className="h-3 w-3" /> Add Project</button>
      </div>

      {/* Skills */}
      <div id="resume-section-skills" className={`mt-3 ${sectionClass('skills')}`}>
        <h2 className="text-[11px] font-bold tracking-wide border-b mb-1 pb-0.5">TECHNICAL SKILLS</h2>
        <div contentEditable suppressContentEditableWarning onBlur={(e) => {
          const skillsArray = e.currentTarget.innerText.split(',').map(s => s.trim());
          updateField('skills', skillsArray);
        }} className={`${editableClass} text-[10px]`}><HighlightedText text={data.skills.join(', ')} keywords={keywordText} /></div>
      </div>
    </div>
  );
}

export default memo(EditableResumePreview);
