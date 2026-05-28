"use client"

import * as React from "react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MatchScoreCardProps {
  score: number
  previousScore?: number
  categories: {
    name: string
    score: number
    maxScore: number
  }[]
  aiSummary?: string
}

export function MatchScoreCard({ score, previousScore, categories, aiSummary }: MatchScoreCardProps) {
  const [animatedScore, setAnimatedScore] = React.useState(0)
  
  React.useEffect(() => {
    const duration = 1500
    const steps = 60
    const increment = score / steps
    let current = 0
    
    const timer = setInterval(() => {
      current += increment
      if (current >= score) {
        setAnimatedScore(score)
        clearInterval(timer)
      } else {
        setAnimatedScore(Math.floor(current))
      }
    }, duration / steps)
    
    return () => clearInterval(timer)
  }, [score])

  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-emerald-500"
    if (s >= 60) return "text-amber-500"
    return "text-red-500"
  }

  const getProgressGradient = (s: number) => {
    if (s >= 80) return "from-emerald-500 to-teal-400"
    if (s >= 60) return "from-amber-500 to-orange-400"
    return "from-red-500 to-rose-400"
  }

  const scoreDiff = previousScore ? score - previousScore : 0

  return (
    <Card className="border-border/50 shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl">Match Score</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center mb-8">
          {/* Circular progress */}
          <div className="relative w-48 h-48 mb-4">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="url(#scoreGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${animatedScore * 2.64} 264`}
                className="transition-all duration-300"
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  {score >= 80 ? (
                    <>
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#2DD4BF" />
                    </>
                  ) : score >= 60 ? (
                    <>
                      <stop offset="0%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#FB923C" />
                    </>
                  ) : (
                    <>
                      <stop offset="0%" stopColor="#EF4444" />
                      <stop offset="100%" stopColor="#FB7185" />
                    </>
                  )}
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-5xl font-bold", getScoreColor(score))}>
                {animatedScore}%
              </span>
              {previousScore !== undefined && (
                <div className={cn(
                  "flex items-center gap-1 text-sm font-medium",
                  scoreDiff > 0 ? "text-emerald-500" : scoreDiff < 0 ? "text-red-500" : "text-muted-foreground"
                )}>
                  {scoreDiff > 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : scoreDiff < 0 ? (
                    <TrendingDown className="h-4 w-4" />
                  ) : (
                    <Minus className="h-4 w-4" />
                  )}
                  <span>{scoreDiff > 0 ? "+" : ""}{scoreDiff}% from last</span>
                </div>
              )}
            </div>
          </div>

          {/* Score interpretation */}
          <div className={cn(
            "px-4 py-2 rounded-full text-sm font-medium",
            score >= 80 ? "bg-emerald-500/10 text-emerald-500" :
            score >= 60 ? "bg-amber-500/10 text-amber-500" :
            "bg-red-500/10 text-red-500"
          )}>
            {score >= 80 ? "Excellent Match!" : score >= 60 ? "Good Match" : "Needs Improvement"}
          </div>
        </div>

        {/* Category breakdown */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Score Breakdown</h4>
          {categories.map((category) => {
            const percentage = (category.score / category.maxScore) * 100
            return (
              <div key={category.name}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium">{category.name}</span>
                  <span className={cn("font-semibold", getScoreColor(percentage))}>
                    {Math.round(percentage)}%
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-1000", getProgressGradient(percentage))}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* AI Summary */}
        {aiSummary && (
          <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full gradient-primary" />
              AI Analysis
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{aiSummary}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
