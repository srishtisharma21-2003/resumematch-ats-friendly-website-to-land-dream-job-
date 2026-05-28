"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScoreCardProps {
  score: number
  missingKeywords: string[]
  improvements: string[]
  isLoading?: boolean
}

export function ScoreCard({
  score,
  missingKeywords,
  improvements,
  isLoading = false,
}: ScoreCardProps) {
  const scoreColor =
    score >= 80 ? "text-emerald-500" : score >= 60 ? "text-amber-500" : "text-red-500"
  const scoreBg =
    score >= 80 ? "gradient-neon" : score >= 60 ? "gradient-sunset" : "gradient-danger"

  return (
    <div className="space-y-4">
      {/* Match Score */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Match Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-4xl",
                scoreBg
              )}
            >
              {score}%
            </div>
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-2">ATS Match Rate</div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={cn("h-full rounded-full transition-all", scoreBg)}
                  style={{ width: `${score}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {score >= 80
                  ? "✅ Excellent match"
                  : score >= 60
                    ? "⚠️ Good match, room for improvement"
                    : "❌ Needs significant improvements"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Missing Keywords */}
      {missingKeywords.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Missing Keywords ({missingKeywords.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {missingKeywords.slice(0, 8).map((keyword, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 text-xs rounded-full font-medium"
                >
                  +{keyword}
                </span>
              ))}
              {missingKeywords.length > 8 && (
                <span className="px-3 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                  +{missingKeywords.length - 8} more
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Improvements */}
      {improvements.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-500" />
              Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {improvements.slice(0, 3).map((improvement, i) => (
                <li
                  key={i}
                  className="text-sm text-foreground/80 flex gap-2 items-start"
                >
                  <CheckCircle className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                  <span>{improvement}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="py-8 text-center">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-full border-2 border-muted-foreground border-t-primary animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">
                Analyzing and updating score...
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
