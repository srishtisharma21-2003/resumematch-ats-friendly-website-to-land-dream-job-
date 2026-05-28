"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, Sparkles, FileText, Search, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

const stats = [
  { value: "10,000+", label: "Jobs Matched" },
  { value: "95%", label: "Success Rate" },
  { value: "500+", label: "Companies" },
]

export function HeroSection() {
  const [counts, setCounts] = React.useState(stats.map(() => 0))

  React.useEffect(() => {
    const targets = [10000, 95, 500]
    const duration = 2000
    const steps = 60
    const interval = duration / steps

    let currentStep = 0
    const timer = setInterval(() => {
      currentStep++
      const progress = currentStep / steps
      setCounts(targets.map((target) => Math.floor(target * Math.min(progress, 1))))
      if (currentStep >= steps) clearInterval(timer)
    }, interval)

    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Animated background */}
      <div className="absolute inset-0 gradient-bg" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pulse-ring" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pulse-ring" style={{ animationDelay: "1s" }} />
      
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-fade-in-up">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Resume Optimization</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 animate-fade-in-up stagger-1 text-balance">
              Land Your Dream Job with{" "}
              <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                AI-Powered
              </span>{" "}
              Resume Optimization
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 animate-fade-in-up stagger-2 text-pretty">
              Get instant match scores, keyword suggestions, and personalized job recommendations. 
              Our AI analyzes your resume against job descriptions to maximize your chances of success.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up stagger-3">
              <Button asChild size="lg" className="gradient-primary text-white border-0 shadow-lg shadow-primary/25 hover:opacity-90 group">
                <Link href="/dashboard">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="group">
                <Link href="#features">
                  See How It Works
                  <Sparkles className="ml-2 h-4 w-4 text-primary" />
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-border/50 animate-fade-in-up stagger-4">
              {stats.map((stat, index) => (
                <div key={stat.label} className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                    {counts[index].toLocaleString()}{stat.value.includes("+") ? "+" : stat.value.includes("%") ? "%" : ""}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right illustration */}
          <div className="relative hidden lg:block animate-fade-in-up stagger-5">
            <div className="relative">
              {/* Main card */}
              <div className="relative bg-card rounded-2xl shadow-2xl border border-border p-6 transform rotate-2 hover:rotate-0 transition-transform duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold">Resume Analysis</div>
                    <div className="text-sm text-muted-foreground">Processing complete</div>
                  </div>
                </div>
                
                {/* Match score */}
                <div className="flex items-center justify-center my-6">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-muted"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${85 * 2.83} ${100 * 2.83}`}
                        className="transition-all duration-1000"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#8B5CF6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold">85%</span>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="space-y-3">
                  {[
                    { skill: "Technical Skills", value: 90 },
                    { skill: "Experience", value: 75 },
                    { skill: "Education", value: 85 },
                  ].map((item) => (
                    <div key={item.skill}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{item.skill}</span>
                        <span className="font-medium">{item.value}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full gradient-primary transition-all duration-1000"
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating cards */}
              <div className="absolute -top-4 -left-8 bg-card rounded-xl shadow-lg border border-border p-3 animate-bounce" style={{ animationDuration: "3s" }}>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  <span className="text-sm font-medium">Keywords Added</span>
                </div>
              </div>

              <div className="absolute -bottom-4 -right-8 bg-card rounded-xl shadow-lg border border-border p-3 animate-bounce" style={{ animationDuration: "4s", animationDelay: "1s" }}>
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium">12 Jobs Found</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
