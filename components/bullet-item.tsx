"use client"

import * as React from "react"
import { Sparkles, Check, Copy, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface BulletItemProps {
  index: number
  original: string
  improved?: string
  onImprove: (bullet: string) => Promise<string>
  onApply: (original: string, improved: string) => void
  jobDescription: string
}

export function BulletItem({
  index,
  original,
  improved: initialImproved,
  onImprove,
  onApply,
  jobDescription,
}: BulletItemProps) {
  const [text, setText] = React.useState(original)
  const [improved, setImproved] = React.useState(initialImproved)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isCopied, setIsCopied] = React.useState(false)

  const handleImprove = async () => {
    setIsLoading(true)
    try {
      const result = await onImprove(text)
      setImproved(result)
    } catch (error) {
      console.error("[v0] Failed to improve bullet:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApply = () => {
    if (improved) {
      setText(improved)
      onApply(original, improved)
      setImproved(undefined)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(improved || text)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <Card className="p-4 border-l-4 border-l-cyan-400 hover:shadow-md transition-shadow">
      <div className="space-y-3">
        {/* Original/Current Bullet */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase">
            Bullet {index + 1}
          </label>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mt-2 text-sm"
            placeholder="Enter your bullet point..."
          />
        </div>

        {/* Improved Suggestion */}
        {improved && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded border border-emerald-200 dark:border-emerald-900">
            <label className="text-xs font-semibold text-emerald-900 dark:text-emerald-300 uppercase flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              AI Improved
            </label>
            <p className="mt-2 text-sm text-emerald-900 dark:text-emerald-200">
              {improved}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {!improved ? (
            <Button
              onClick={handleImprove}
              disabled={isLoading || !text.trim()}
              size="sm"
              variant="outline"
              className="gap-2 flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Improving...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Improve with AI
                </>
              )}
            </Button>
          ) : (
            <>
              <Button
                onClick={handleApply}
                size="sm"
                className="gap-2 flex-1 gradient-neon text-white"
              >
                <Check className="w-4 h-4" />
                Apply
              </Button>
              <Button
                onClick={handleCopy}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <Copy className="w-4 h-4" />
                {isCopied ? "Copied!" : "Copy"}
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}
