"use client"

import * as React from "react"
import { 
  Target, 
  Lightbulb, 
  Search, 
  TrendingUp, 
  Shield, 
  Zap,
  ArrowRight 
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const features = [
  {
    icon: Target,
    title: "Match Score Analysis",
    description: "Get real-time scoring with detailed breakdown by skill categories. See exactly how your resume stacks up against job requirements.",
    color: "from-blue-500 to-cyan-500",
    href: "/match",
  },
  {
    icon: Lightbulb,
    title: "AI Keyword Suggester",
    description: "Receive intelligent keyword suggestions with importance badges. Our AI identifies missing keywords that can boost your match score.",
    color: "from-purple-500 to-pink-500",
    href: "/dashboard",
  },
  {
    icon: Search,
    title: "Multi-Platform Job Scanner",
    description: "Scan jobs across LinkedIn, Naukri, Instahire, and more. Filter by match percentage and find your perfect opportunities.",
    color: "from-emerald-500 to-teal-500",
    href: "/jobs",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description: "Monitor your improvement over time with historical graphs. Track applications from submission to offer.",
    color: "from-amber-500 to-orange-500",
    href: "/dashboard",
  },
  {
    icon: Shield,
    title: "ATS Optimization",
    description: "Ensure your resume passes Applicant Tracking Systems. Get formatting tips and keyword density analysis.",
    color: "from-rose-500 to-red-500",
    href: "/match",
  },
  {
    icon: Zap,
    title: "Instant Analysis",
    description: "Upload your resume and job description for immediate results. No waiting - get actionable insights in seconds.",
    color: "from-indigo-500 to-violet-500",
    href: "/match",
  },
]

export function FeaturesGrid() {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-balance">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              Land Your Dream Job
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Our comprehensive suite of AI-powered tools helps you optimize your resume, 
            find matching jobs, and track your application progress.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={feature.title}
              className="group relative overflow-hidden border-border/50 bg-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="ghost" className="group/btn p-0 h-auto font-medium text-primary hover:bg-transparent">
                  <Link href={feature.href}>
                    Learn more
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
              
              {/* Decorative gradient */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.color} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`} />
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
