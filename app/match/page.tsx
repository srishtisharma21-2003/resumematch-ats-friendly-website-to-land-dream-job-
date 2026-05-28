"use client";

import * as React from "react";
import { 
  FileText, 
  X,
  Sparkles, 
  Check, 
  Loader2,
  Target,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  Download,
  Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/navbar";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { ErrorMessage } from "@/components/error-message";
import { FileUploader, type UploadedFileInfo } from "@/components/file-uploader";

// ✅ Import the CORRECT Supabase client (SSR cookies support)
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { apiClient, extractTextFromFile, analyzeResume } from "@/lib/api";

type AnalysisStep = {
  id: number;
  label: string;
  status: "pending" | "loading" | "complete";
}

interface AnalysisResult {
  matchScore: number;
  categories: Array<{
    name: string;
    score: number;
    details: string;
  }>;
  keywords: {
    missing: Array<{
      text: string;
      priority: string;
      reason: string;
    }>;
    present: string[];
  };
  suggestions: string[];
  summary?: string;
}

const initialSteps: AnalysisStep[] = [
  { id: 1, label: "Parsing resume...", status: "pending" },
  { id: 2, label: "Analyzing job description...", status: "pending" },
  { id: 3, label: "Calculating match score...", status: "pending" },
  { id: 4, label: "Generating suggestions...", status: "pending" },
];

export default function MatchPage() {
  return (
    <ProtectedRoute>
      <MatchPageContent />
    </ProtectedRoute>
  );
}

function MatchPageContent() {
  const router = useRouter();
  const [user, setUser] = React.useState<any>(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  
  const [resumeFile, setResumeFile] = React.useState<UploadedFileInfo | null>(null);
  const [jobFile, setJobFile] = React.useState<UploadedFileInfo | null>(null);
  const [jobDescriptionText, setJobDescriptionText] = React.useState("");
  const [storedResumeText, setStoredResumeText] = React.useState("");
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [steps, setSteps] = React.useState<AnalysisStep[]>(initialSteps);
  const [showResults, setShowResults] = React.useState(false);
  const [animatedScore, setAnimatedScore] = React.useState(0);
  const [analysisResults, setAnalysisResults] = React.useState<AnalysisResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [canRetry, setCanRetry] = React.useState(false);
  const [analysisId, setAnalysisId] = React.useState<string | null>(null);
  const [lastResumeText, setLastResumeText] = React.useState("");
  const [lastJobText, setLastJobText] = React.useState("");

  // ✅ Get the correct Supabase client
  const supabase = React.useMemo(() => createSupabaseClient(), []);

  // ✅ Fetch user on mount and redirect if not authenticated
  React.useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (!user) {
          router.push('/auth/login');
        }
      } catch (err) {
        console.error("Auth error:", err);
        router.push('/auth/login');
      } finally {
        setAuthLoading(false);
      }
    };
    getUser();
  }, [router, supabase]);

  React.useEffect(() => {
    const storedResume = window.localStorage.getItem("resumeForMatch");
    if (!storedResume) return;

    try {
      const parsed = JSON.parse(storedResume) as { fileName?: string; text?: string; resumeData?: unknown };
      const text = parsed.text || JSON.stringify(parsed.resumeData || "", null, 2);
      if (text.trim()) {
        setStoredResumeText(text);
        setResumeFile({
          name: parsed.fileName || "Edited resume from builder",
          size: new Blob([text]).size,
        });
      }
    } catch {
      setStoredResumeText(storedResume);
      setResumeFile({
        name: "Edited resume from builder",
        size: new Blob([storedResume]).size,
      });
    } finally {
      window.localStorage.removeItem("resumeForMatch");
    }
  }, []);

  if (authLoading) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </main>
    );
  }

  if (!user) return null; // Already redirecting

  const updateStepStatus = (stepId: number, status: "pending" | "loading" | "complete") => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };

  const animateScore = (targetScore: number) => {
    const duration = 1500;
    const increment = targetScore / 60;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= targetScore) {
        setAnimatedScore(targetScore);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(current));
      }
    }, duration / 60);
  };

  // Helper: extract keywords from text
  const extractKeywords = (text: string): string[] => {
    const techKeywords = [
      'React', 'Angular', 'Vue', 'JavaScript', 'TypeScript', 'Python', 'Java',
      'Node.js', 'Express', 'Django', 'MongoDB', 'PostgreSQL', 'MySQL', 'AWS',
      'Azure', 'GCP', 'Docker', 'Kubernetes', 'GraphQL', 'REST API', 'HTML',
      'CSS', 'Git', 'CI/CD', 'Next.js', 'Redux', 'Tailwind', 'SASS'
    ];
    const found = techKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
    return [...new Set(found)];
  };

  // Transform API response to match UI expectations
  const transformApiResult = (
    apiResult: any,
    resumeText: string,
    jobText: string
  ): AnalysisResult => {
    const jobKeywords = extractKeywords(jobText);
    const resumeKeywords = extractKeywords(resumeText);
    const presentKeywords = resumeKeywords.filter(kw => 
      jobKeywords.some(jkw => jkw.toLowerCase() === kw.toLowerCase())
    );

    const missingKeywordsWithPriority = (apiResult.missingKeywords || []).map((kw: any, idx: number) => ({
      text: typeof kw === "string" ? kw : kw.keyword || kw.text || "",
      priority: typeof kw === "object" && kw.priority ? kw.priority : idx < 3 ? "high" : idx < 6 ? "medium" : "low",
      reason: `Important keyword for this role`
    })).filter((kw: any) => kw.text);

    const totalMissing = apiResult.missingKeywords?.length || 0;
    const techScore = Math.min(100, Math.max(0, apiResult.matchScore + (totalMissing > 3 ? -15 : 5)));
    const expScore = Math.min(100, Math.max(0, apiResult.matchScore + (resumeText.length > 1000 ? 5 : -10)));
    const eduScore = Math.min(100, Math.max(0, apiResult.matchScore + (resumeText.toLowerCase().includes('bachelor') ? 10 : 0)));
    const softScore = Math.min(100, Math.max(0, apiResult.matchScore + (resumeText.toLowerCase().includes('team') ? 5 : -5)));

    const categories = [
      {
        name: "Technical Skills",
        score: techScore,
        details: `${presentKeywords.length} out of ${jobKeywords.length} required technologies matched`
      },
      {
        name: "Experience Level",
        score: expScore,
        details: resumeText.length > 800 ? "Good level of experience" : "Could elaborate more on past roles"
      },
      {
        name: "Education",
        score: eduScore,
        details: resumeText.toLowerCase().includes('degree') ? "Education section present" : "Add educational background"
      },
      {
        name: "Soft Skills",
        score: softScore,
        details: "Communication and teamwork keywords appear"
      }
    ];

    return {
      matchScore: apiResult.matchScore,
      categories,
      keywords: {
        missing: missingKeywordsWithPriority,
        present: presentKeywords
      },
      suggestions: Array.isArray(apiResult.improvements) ? apiResult.improvements : [],
      summary: apiResult.summary || ''
    };
  };

  const handleAnalyze = async () => {
    if (!resumeFile) {
      setError("Please upload your resume or send one from the editor.");
      setCanRetry(false);
      return;
    }
    if (!jobFile && jobDescriptionText.trim().length < 30) {
      setError("Please paste at least 30 characters of the job description or upload a job description file.");
      setCanRetry(false);
      return;
    }

    setIsAnalyzing(true);
    setShowResults(false);
    setError(null);
    setCanRetry(false);
    setSteps(initialSteps);
    setAnalysisId(null);

    try {
      // Step 1
      updateStepStatus(1, "loading");
      const resumeText = resumeFile.file ? await extractTextFromFile(resumeFile.file) : storedResumeText;
      if (!resumeText || resumeText.trim().length < 50) {
        throw new Error("Resume text is too short. Please upload a text-based PDF or DOCX file.");
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      updateStepStatus(1, "complete");

      // Step 2
      updateStepStatus(2, "loading");
      let jobText = "";
      if (jobFile) {
        if (jobFile.file) jobText = await extractTextFromFile(jobFile.file);
      } else if (jobDescriptionText.trim()) {
        jobText = jobDescriptionText;
      }
      if (jobText.trim().length < 30) {
        throw new Error("Job description is too short. Please add more detail about the role.");
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      updateStepStatus(2, "complete");

      // Step 3 – call the canonical match analysis API
      updateStepStatus(3, "loading");
      
      // ✅ Use the user from state (already authenticated)
      const apiResult = await analyzeResume({
        resumeText,
        jobDescription: jobText,
        userId: user.id,
        fileName: resumeFile.name
      });

      console.log("API response:", apiResult);

      const finalAnalysisId = apiResult.analysisId;
      if (!finalAnalysisId) {
        throw new Error("Analysis failed – no ID returned");
      }

      setAnalysisId(finalAnalysisId);
      setLastResumeText(resumeText);
      setLastJobText(jobText);
      localStorage.setItem("latestAnalysisId", finalAnalysisId);

      await new Promise(resolve => setTimeout(resolve, 500));
      updateStepStatus(3, "complete");

      // Step 4
      updateStepStatus(4, "loading");
      const safeApiResult = {
        matchScore: apiResult?.matchScore ?? apiResult?.score ?? 0,
        missingKeywords: apiResult?.missingKeywords ?? [],
        improvements: Array.isArray(apiResult?.improvements)
          ? apiResult.improvements
          : Object.values(apiResult?.improvements || {}).filter(Boolean),
        summary: apiResult?.summary ?? '',
      };
      const transformed = transformApiResult(safeApiResult, resumeText, jobText);
      const weakSections = transformed.categories
        .filter((category) => category.score < 60)
        .map((category) => {
          if (category.name.toLowerCase().includes("technical")) return "skills";
          if (category.name.toLowerCase().includes("experience")) return "experience";
          if (category.name.toLowerCase().includes("education")) return "education";
          return "summary";
        });
      await new Promise(resolve => setTimeout(resolve, 300));
      updateStepStatus(4, "complete");

      setAnalysisResults(transformed);
      window.localStorage.setItem(
        `resumeEditContext:${finalAnalysisId}`,
        JSON.stringify({
          resumeText,
          jobDescription: jobText,
          originalScore: transformed.matchScore,
          missingKeywords: transformed.keywords.missing.map((keyword) => keyword.text),
          weakSections,
          categories: transformed.categories,
        }),
      );
      animateScore(transformed.matchScore);
      setShowResults(true);
    } catch (err: any) {
      console.error("Analysis error:", err);
      const message = err.message || "Failed to analyze. Please try again.";
      const normalized = message.toLowerCase();
      const isRetryable =
        normalized.includes("timeout") ||
        normalized.includes("network") ||
        normalized.includes("busy") ||
        normalized.includes("service") ||
        normalized.includes("failed to fetch");
      const isPdfFailure = normalized.includes("pdf") || normalized.includes("scanned") || normalized.includes("parse");
      setError(
        isPdfFailure
          ? "We could not read that PDF. Please upload a text-based PDF or DOCX file."
          : message,
      );
      setCanRetry(isRetryable);
      setSteps(initialSteps);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setResumeFile(null);
    setJobFile(null);
    setJobDescriptionText("");
    setStoredResumeText("");
    setShowResults(false);
    setAnimatedScore(0);
    setSteps(initialSteps);
    setAnalysisResults(null);
    setError(null);
    setCanRetry(false);
    setAnalysisId(null);
    setLastResumeText("");
    setLastJobText("");
  };

  const handleEditResume = async () => {
    if (analysisId) {
      router.push(`/edit/${analysisId}`);
      return;
    }

    if (!lastResumeText.trim()) {
      setError("Run an analysis before opening the editor.");
      setCanRetry(false);
      return;
    }

    try {
      const saved = await apiClient<{ id?: string; analysisId?: string }>("/api/resume", {
        method: "POST",
        body: {
          resume_text: lastResumeText,
          job_description: lastJobText,
          file_name: resumeFile?.name || "resume.txt",
          match_score: analysisResults?.matchScore || 0,
          missing_keywords: analysisResults?.keywords.missing.map((keyword) => keyword.text) || [],
          improvements: analysisResults?.suggestions || [],
          summary: analysisResults?.summary || "",
        },
      });
      const savedId = saved.analysisId || saved.id;
      if (!savedId) throw new Error("Resume saved, but no ID was returned.");
      setAnalysisId(savedId);
      router.push(`/edit/${savedId}`);
    } catch (editError) {
      setError(editError instanceof Error ? editError.message : "Could not open the editor.");
      setCanRetry(false);
    }
  };

  const downloadReport = () => {
    if (!analysisResults) return;
    
    const report = {
      timestamp: new Date().toISOString(),
      matchScore: analysisResults.matchScore,
      categories: analysisResults.categories,
      keywords: analysisResults.keywords,
      suggestions: analysisResults.suggestions
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume-analysis-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };

  const getProgressGradient = (score: number) => {
    if (score >= 80) return "from-emerald-500 to-teal-400";
    if (score >= 60) return "from-amber-500 to-orange-400";
    return "from-red-500 to-rose-400";
  };

  const displayResults = analysisResults;

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Match Analysis</span>
            </div>
            <h1 className="text-4xl font-bold mb-4 text-balance">
              Analyze Your{" "}
              <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                Resume Match
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload your resume and job description to get AI-powered insights, 
              match scores, and actionable suggestions.
            </p>
          </div>

          {!showResults ? (
            <>
              {/* Upload Section */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Resume Upload Card */}
                <Card className="border-border/50 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Your Resume
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FileUploader
                      id="resume-upload"
                      label="Upload your resume"
                      value={resumeFile}
                      onChange={(file) => {
                        setResumeFile(file);
                        if (file?.file) setStoredResumeText("");
                        setError(null);
                        setCanRetry(false);
                      }}
                      onError={(message) => {
                        if (message) setError(message);
                        setCanRetry(false);
                      }}
                      disabled={isAnalyzing}
                    />
                    {storedResumeText && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Using the edited resume from your last editor session.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Job Description Upload Card */}
                <Card className="border-border/50 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-purple-500" />
                      Job Description
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <FileUploader
                        id="job-description-upload"
                        label="Upload job description"
                        value={jobFile}
                        onChange={(file) => {
                          setJobFile(file);
                          setError(null);
                          setCanRetry(false);
                        }}
                        onError={(message) => {
                          if (message) setError(message);
                          setCanRetry(false);
                        }}
                        disabled={isAnalyzing}
                      />
                      
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-border"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">Or paste text</span>
                        </div>
                      </div>
                      
                      <textarea
                        placeholder="Paste job description text here..."
                        value={jobDescriptionText}
                        onChange={(e) => {
                          setJobDescriptionText(e.target.value);
                          setError(null);
                          setCanRetry(false);
                        }}
                        className="w-full h-32 p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
                      />
                      {jobDescriptionText.trim().length > 0 && jobDescriptionText.trim().length < 30 && (
                        <p className="text-sm text-destructive">
                          Add a little more detail so the analyzer has enough job context.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Error Message */}
              {error && (
                <ErrorMessage
                  className="mb-6"
                  title="Analysis needs attention"
                  message={error}
                  onRetry={canRetry ? handleAnalyze : undefined}
                />
              )}

              {/* Analyze Button */}
              <div className="text-center">
                <Button
                  size="lg"
                  className="gradient-primary text-white border-0 shadow-lg shadow-primary/25 hover:opacity-90 disabled:opacity-50 px-8"
                  disabled={(!resumeFile || (!jobFile && jobDescriptionText.trim().length < 30)) || isAnalyzing}
                  onClick={handleAnalyze}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Analyze Match
                    </>
                  )}
                </Button>
              </div>

              {/* Analysis Progress */}
              {isAnalyzing && (
                <Card className="mt-8 border-border/50 shadow-xl max-w-lg mx-auto">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {steps.map((step) => (
                        <div key={step.id} className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                              step.status === "complete"
                                ? "bg-emerald-500 text-white"
                                : step.status === "loading"
                                ? "gradient-primary text-white"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {step.status === "complete" ? (
                              <Check className="h-4 w-4" />
                            ) : step.status === "loading" ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              step.id
                            )}
                          </div>
                          <span
                            className={cn(
                              "text-sm font-medium",
                              step.status === "pending"
                                ? "text-muted-foreground"
                                : "text-foreground"
                            )}
                          >
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            /* Results Section */
            displayResults && (
              <div className="space-y-8 animate-fade-in-up">
                {/* Score Overview */}
                <Card className="border-border/50 shadow-xl overflow-hidden">
                  <div className="gradient-primary p-8 text-white text-center">
                    <p className="text-lg font-medium mb-2 opacity-90">Your Match Score</p>
                    <div className="text-7xl font-bold mb-4">{animatedScore}%</div>
                    <p className="text-lg opacity-90">
                      {displayResults.matchScore >= 80
                        ? "Excellent Match! You're a strong candidate."
                        : displayResults.matchScore >= 60
                        ? "Good Match! A few improvements could help."
                        : "Needs work. Follow our suggestions below."}
                    </p>
                  </div>
                </Card>

                {/* Categories */}
                <div className="grid md:grid-cols-2 gap-6">
                  {displayResults.categories.map((cat) => (
                    <Card key={cat.name} className="border-border/50 shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold">{cat.name}</h4>
                          <span className={cn("text-2xl font-bold", getScoreColor(cat.score))}>
                            {Math.round(cat.score)}%
                          </span>
                        </div>
                        <div className="h-3 rounded-full bg-muted overflow-hidden mb-3">
                          <div
                            className={cn(
                              "h-full rounded-full bg-gradient-to-r transition-all duration-1000",
                              getProgressGradient(cat.score)
                            )}
                            style={{ width: `${cat.score}%` }}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">{cat.details}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Keywords */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="border-border/50 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-red-500 flex items-center gap-2">
                        <X className="h-5 w-5" />
                        Missing Keywords
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {displayResults.keywords.missing.length > 0 ? (
                        displayResults.keywords.missing.map((kw) => (
                          <div key={kw.text} className="p-3 rounded-lg border border-border">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{kw.text}</span>
                              <span
                                className={cn(
                                  "px-2 py-0.5 text-xs font-medium rounded-full",
                                  kw.priority === "high"
                                    ? "bg-red-500/10 text-red-500"
                                    : kw.priority === "medium"
                                    ? "bg-amber-500/10 text-amber-500"
                                    : "bg-blue-500/10 text-blue-500"
                                )}
                              >
                                {kw.priority}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{kw.reason}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-4">
                          No missing keywords! Great job!
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-border/50 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-emerald-500 flex items-center gap-2">
                        <Check className="h-5 w-5" />
                        Present Keywords
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {displayResults.keywords.present.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {displayResults.keywords.present.map((kw) => (
                            <span
                              key={kw}
                              className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-4">
                          No matching keywords found
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Suggestions */}
                <Card className="border-border/50 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-amber-500" />
                      Improvement Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {displayResults.suggestions.map((suggestion, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center shrink-0 mt-0.5">
                            <ArrowRight className="h-3 w-3 text-white" />
                          </div>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex flex-wrap justify-center gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={resetAnalysis}
                    className="gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Analyze Another
                  </Button>
                  <Button 
                    size="lg" 
                    onClick={downloadReport}
                    className="gap-2 gradient-primary text-white border-0"
                  >
                    <Download className="h-4 w-4" />
                    Download Report
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleEditResume}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Resume
                  </Button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </main>
  );
}
