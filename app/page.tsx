"use client"

import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { FeaturesGrid } from "@/components/features-grid"
import { FileUpload } from "@/components/file-upload"
import { Footer } from "@/components/footer"
import { useState } from "react"

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyze = () => {
    setIsAnalyzing(true)
    // Simulate analysis
    setTimeout(() => {
      setIsAnalyzing(false)
    }, 4000)
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <FeaturesGrid />
      <FileUpload onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
      <Footer />
    </main>
  )
}
