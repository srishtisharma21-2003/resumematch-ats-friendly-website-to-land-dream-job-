"use client"

import * as React from "react"
import { Lightbulb, Copy, Check, Plus, Download, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Keyword {
  id: string
  text: string
  priority: "high" | "medium" | "low"
  reason: string
  inResume?: boolean
}

interface KeywordSuggestionsProps {
  keywords: Keyword[]
  existingKeywords?: string[]
}

export function KeywordSuggestions({ keywords, existingKeywords = [] }: KeywordSuggestionsProps) {
  const [copiedId, setCopiedId] = React.useState<string | null>(null)
  const [addedIds, setAddedIds] = React.useState<Set<string>>(new Set())

  const handleCopy = async (keyword: Keyword) => {
    await navigator.clipboard.writeText(keyword.text)
    setCopiedId(keyword.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleAdd = (keyword: Keyword) => {
    setAddedIds((prev) => new Set([...prev, keyword.id]))
  }

  const getPriorityColor = (priority: Keyword["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "medium":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      case "low":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
    }
  }

  const suggestedKeywords = keywords.filter((k) => !k.inResume)
  const presentKeywords = keywords.filter((k) => k.inResume)

  return (
    <Card className="border-border/50 shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <Lightbulb className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-xl">AI-Powered Suggestions</CardTitle>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export PDF
        </Button>
      </CardHeader>
      <CardContent>
        {/* Suggested keywords */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Missing Keywords ({suggestedKeywords.length})
          </h4>
          <div className="space-y-3">
            {suggestedKeywords.map((keyword) => (
              <div
                key={keyword.id}
                className={cn(
                  "p-4 rounded-xl border bg-card transition-all",
                  addedIds.has(keyword.id) && "opacity-50"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{keyword.text}</span>
                      <span
                        className={cn(
                          "px-2 py-0.5 text-xs font-medium rounded-full border",
                          getPriorityColor(keyword.priority)
                        )}
                      >
                        {keyword.priority}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{keyword.reason}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleCopy(keyword)}
                    >
                      {copiedId === keyword.id ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      <span className="sr-only">Copy</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-8 w-8 p-0",
                        addedIds.has(keyword.id) && "text-emerald-500"
                      )}
                      onClick={() => handleAdd(keyword)}
                      disabled={addedIds.has(keyword.id)}
                    >
                      {addedIds.has(keyword.id) ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      <span className="sr-only">Add to resume</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Present keywords */}
        {presentKeywords.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Already in Resume ({presentKeywords.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {presentKeywords.map((keyword) => (
                <div
                  key={keyword.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  {keyword.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Existing keywords from props */}
        {existingKeywords.length > 0 && presentKeywords.length === 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Already in Resume ({existingKeywords.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {existingKeywords.map((keyword) => (
                <div
                  key={keyword}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  {keyword}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
