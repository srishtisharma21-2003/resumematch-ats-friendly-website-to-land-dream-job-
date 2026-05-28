"use client"

import * as React from "react"
import { 
  CloudUpload, 
  FileText, 
  X, 
  Sparkles,
  Check,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface UploadedFile {
  name: string
  size: number
  type: string
}

interface FileUploadZoneProps {
  title: string
  description: string
  accept: string
  file: UploadedFile | null
  onFileChange: (file: UploadedFile | null) => void
}

function FileUploadZone({ title, description, accept, file, onFileChange }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      onFileChange({
        name: droppedFile.name,
        size: droppedFile.size,
        type: droppedFile.type,
      })
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      onFileChange({
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 cursor-pointer",
        isDragging
          ? "border-primary bg-primary/5"
          : file
          ? "border-emerald-500 bg-emerald-500/5"
          : "border-border hover:border-primary/50 hover:bg-muted/50"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {file ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="font-medium text-foreground">{file.name}</p>
              <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              onFileChange(null)
            }}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      ) : (
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl gradient-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/25">
            <CloudUpload className="h-8 w-8 text-white" />
          </div>
          <p className="font-semibold text-foreground mb-1">{title}</p>
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {["PDF", "DOC", "DOCX", "TXT"].map((format) => (
              <span
                key={format}
                className="px-2 py-1 text-xs font-medium rounded-md bg-muted text-muted-foreground"
              >
                {format}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface FileUploadProps {
  onAnalyze: () => void
  isAnalyzing: boolean
}

export function FileUpload({ onAnalyze, isAnalyzing }: FileUploadProps) {
  const [resumeFile, setResumeFile] = React.useState<UploadedFile | null>(null)
  const [jobFile, setJobFile] = React.useState<UploadedFile | null>(null)

  const canAnalyze = resumeFile && jobFile && !isAnalyzing

  return (
    <section className="py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Card className="border-border/50 shadow-xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">Upload Your Documents</CardTitle>
            <p className="text-muted-foreground">
              Upload your resume and the job description to get your match analysis
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <FileUploadZone
                title="Upload Resume"
                description="Drag and drop or click to upload"
                accept=".pdf,.doc,.docx,.txt"
                file={resumeFile}
                onFileChange={setResumeFile}
              />
              <FileUploadZone
                title="Upload Job Description"
                description="Drag and drop or click to upload"
                accept=".pdf,.doc,.docx,.txt"
                file={jobFile}
                onFileChange={setJobFile}
              />
            </div>

            <Button
              size="lg"
              className="w-full gradient-primary text-white border-0 shadow-lg shadow-primary/25 hover:opacity-90 disabled:opacity-50"
              disabled={!canAnalyze}
              onClick={onAnalyze}
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

            {/* Analysis steps */}
            {isAnalyzing && (
              <div className="space-y-3 pt-4">
                {[
                  { step: 1, label: "Parsing resume...", done: true },
                  { step: 2, label: "Analyzing job description...", done: true },
                  { step: 3, label: "Calculating match score...", done: false, loading: true },
                  { step: 4, label: "Generating suggestions...", done: false },
                ].map((item) => (
                  <div key={item.step} className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                        item.done
                          ? "bg-emerald-500 text-white"
                          : item.loading
                          ? "gradient-primary text-white"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {item.done ? (
                        <Check className="h-3 w-3" />
                      ) : item.loading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        item.step
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-sm",
                        item.done || item.loading
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
