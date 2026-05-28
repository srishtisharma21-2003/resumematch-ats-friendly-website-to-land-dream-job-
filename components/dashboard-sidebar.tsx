"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Brain,
  LayoutDashboard,
  Target,
  Lightbulb,
  Search,
  Settings,
  ChevronLeft,
  ChevronRight,
  Upload,
  Zap,
  Moon,
  Sun,
  User,
  LogOut,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Target, label: "Match Analysis", href: "/match" },
  { icon: Lightbulb, label: "Keyword Suggester", href: "/dashboard/keywords" },
  { icon: Search, label: "Job Scanner", href: "/jobs" },
  { icon: Settings, label: "Settings", href: "/settings" },
]

const quickActions = [
  { icon: Upload, label: "Upload Resume", href: "/match" },
  { icon: Zap, label: "Scan Jobs Now", href: "/jobs" },
]

interface DashboardSidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

export function DashboardSidebar({ collapsed = false, onToggle }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { setTheme, theme } = useTheme()
  const [profile, setProfile] = React.useState<any>(null)
  const [email, setEmail] = React.useState("")
  const [score, setScore] = React.useState(0)

  React.useEffect(() => {
    let mounted = true
    async function loadSidebarData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted || !user) return
      setEmail(user.email || "")

      const [{ data: profileData }, { data: latestAnalysis }] = await Promise.all([
        supabase.from("profiles").select("first_name, last_name, full_name, avatar_url, email").eq("id", user.id).maybeSingle(),
        supabase.from("resume_analyses").select("match_score").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ])

      if (!mounted) return
      setProfile(profileData)
      setScore(latestAnalysis?.match_score || 0)
    }
    loadSidebarData()
    return () => { mounted = false }
  }, [])

  const displayName = profile?.full_name
    || [profile?.first_name, profile?.last_name].filter(Boolean).join(" ")
    || email.split("@")[0]
    || "User"
  const initials = displayName.split(/\s+/).map((part: string) => part[0]).join("").slice(0, 2).toUpperCase() || "U"

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-lg shadow-primary/25">
              <Brain className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <span className="text-lg font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                ResumeMatch
              </span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="hidden lg:flex h-8 w-8 rounded-lg"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* User profile */}
        <div className={cn("p-4 border-b border-sidebar-border", collapsed && "px-2")}>
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <div className="relative">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                  {initials}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-sidebar" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-sidebar-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{profile?.email || email}</p>
              </div>
            )}
          </div>

          {/* Match score widget */}
          {!collapsed && (
            <div className="mt-4 p-3 rounded-xl bg-sidebar-accent">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-sidebar-foreground">Match Score</span>
                <span className="text-lg font-bold text-emerald-500">{score}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${score}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/25"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "text-white")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Quick actions */}
        <div className={cn("p-4 border-t border-sidebar-border space-y-2", collapsed && "px-2")}>
          {!collapsed && (
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Quick Actions
            </p>
          )}
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              asChild
              className={cn(
                "w-full justify-start gap-2 border-sidebar-border hover:bg-sidebar-accent",
                collapsed && "justify-center px-2"
              )}
            >
              <Link href={action.href}>
                <action.icon className="h-4 w-4" />
                {!collapsed && <span>{action.label}</span>}
              </Link>
            </Button>
          ))}
        </div>

        {/* Footer */}
        <div className={cn("p-4 border-t border-sidebar-border", collapsed && "px-2")}>
          <div className={cn("flex items-center gap-2", collapsed && "flex-col")}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-lg"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            {!collapsed && (
              <>
                <Button variant="ghost" size="icon" className="rounded-lg" asChild>
                  <Link href="/settings">
                    <User className="h-5 w-5" />
                    <span className="sr-only">Profile</span>
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" className="rounded-lg text-destructive hover:text-destructive">
                  <LogOut className="h-5 w-5" />
                  <span className="sr-only">Logout</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
