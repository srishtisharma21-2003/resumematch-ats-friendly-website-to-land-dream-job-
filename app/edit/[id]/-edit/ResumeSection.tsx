import { memo, useState } from "react";
import { ChevronDown, ChevronRight, Lightbulb, AlertTriangle, Sparkles, CheckCircle2 } from "lucide-react";

function ResumeSection({
  title,
  icon,
  children,
  defaultOpen = false,
  warning,
}: {
  title: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
  defaultOpen?: boolean;
  warning?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [applied, setApplied] = useState(false);

  const tips = [
    "Add measurable impact (numbers, %, $)",
    "Include role-specific keywords from the JD",
    "Use strong action verbs (led, built, optimized)",
  ];

  return (
    <div
      className={`rounded-2xl border bg-white overflow-hidden transition ${
        warning && !applied ? "border-red-200 shadow-[0_0_0_3px_rgba(239,68,68,0.06)]" : applied ? "border-green-200" : "border-slate-200"
      }`}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold text-slate-900">{title}</span>
          {warning && !applied && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 inline-flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Needs work
            </span>
          )}
          {applied && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 inline-flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Improved
            </span>
          )}
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t">
          <div className="pt-3">
            <button
              onClick={() => setTipsOpen((v) => !v)}
              className="w-full flex items-center justify-between rounded-xl bg-blue-50 hover:bg-blue-100 px-3 py-2 text-sm text-blue-800"
            >
              <span className="inline-flex items-center gap-2">
                <Lightbulb className="h-4 w-4" /> Tips and Recommendations
              </span>
              {tipsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            {tipsOpen && (
              <ul className="mt-2 space-y-1 text-xs text-slate-600 pl-6 list-disc">
                {tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
          </div>

          {warning && !applied && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-xs text-red-700 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                {warning}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setApplied(true)}
                  className="text-xs px-3 py-1.5 rounded-full bg-green-600 text-white hover:bg-green-700"
                >
                  Apply Improvement
                </button>
                <button className="text-xs px-3 py-1.5 rounded-full text-white bg-gradient-to-r from-blue-500 to-purple-500 inline-flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Write with AI
                </button>
              </div>
            </div>
          )}

          {children}
        </div>
      )}
    </div>
  );
}

export default memo(ResumeSection);
