"use client"

import * as React from "react"
import Link from "next/link"
import { ExternalLink, Star, MapPin, Clock, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Job {
  id: string
  title: string
  company: string
  location: string
  salary?: string
  matchScore: number
  platform: "linkedin" | "naukri" | "instahire" | "wellfound" | "adzuna"
  postedAt: string
  isSaved?: boolean
}

interface RecentJobsCardProps {
  jobs: Job[]
}

const platformColors: Record<Job["platform"], string> = {
  linkedin: "bg-blue-500",
  naukri: "bg-red-500",
  instahire: "bg-emerald-500",
  wellfound: "bg-orange-500",
  adzuna: "bg-purple-500",
}

const platformNames: Record<Job["platform"], string> = {
  linkedin: "LinkedIn",
  naukri: "Naukri",
  instahire: "Instahire",
  wellfound: "Wellfound",
  adzuna: "Adzuna",
}

export function RecentJobsCard({ jobs }: RecentJobsCardProps) {
  const [savedJobs, setSavedJobs] = React.useState<Set<string>>(
    new Set(jobs.filter((j) => j.isSaved).map((j) => j.id))
  )

  const toggleSave = (jobId: string) => {
    setSavedJobs((prev) => {
      const next = new Set(prev)
      if (next.has(jobId)) {
        next.delete(jobId)
      } else {
        next.add(jobId)
      }
      return next
    })
  }

  const getMatchColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500 text-white"
    if (score >= 60) return "bg-amber-500 text-white"
    return "bg-red-500 text-white"
  }

  return (
    <Card className="border-border/50 shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Matching Jobs</CardTitle>
        <Button variant="ghost" size="sm" asChild className="gap-1 text-primary">
          <Link href="/jobs">
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="group p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold truncate group-hover:text-primary transition-colors">
                      {job.title}
                    </h4>
                    <span
                      className={cn(
                        "shrink-0 px-2 py-0.5 text-xs font-medium rounded-full",
                        getMatchColor(job.matchScore)
                      )}
                    >
                      {job.matchScore}%
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{job.company}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {job.location}
                    </span>
                    {job.salary && (
                      <span className="font-medium text-foreground">{job.salary}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {job.postedAt}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => toggleSave(job.id)}
                  >
                    <Star
                      className={cn(
                        "h-4 w-4 transition-colors",
                        savedJobs.has(job.id)
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground"
                      )}
                    />
                    <span className="sr-only">Save job</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                    <a href="#" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      <span className="sr-only">View job</span>
                    </a>
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    platformColors[job.platform]
                  )}
                />
                <span className="text-xs text-muted-foreground">
                  {platformNames[job.platform]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
