export function createResumeFromText(text: string) {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean)
  const email = text.match(/\b[\w.-]+@[\w.-]+\.\w+\b/)?.[0] || ''
  const phone = text.match(/(?:\+\d{1,3}[-\s]?)?\d{10,13}/)?.[0] || ''
  const name = lines.find((line) => /^[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)+$/.test(line)) || lines[0] || ''
  const summary = text.match(/(?:summary|profile|objective)\s*:?\s*([\s\S]*?)(?=\n\s*(?:experience|education|skills|projects)\b|$)/i)?.[1]?.trim() || ''
  const skillsText = text.match(/(?:technical skills|skills)\s*:?\s*([\s\S]*?)(?=\n\s*(?:experience|education|projects|certifications)\b|$)/i)?.[1] || ''
  const skills = skillsText
    .split(/[,\n•|]/)
    .map((skill) => skill.trim())
    .filter((skill) => skill.length > 1 && skill.length < 50)
    .slice(0, 30)

  return {
    personal: { name, title: '', email, phone, city: '', linkedin: '' },
    summary,
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    skills,
    languages: [],
    rawText: text,
  }
}

export function resumeToText(resume: unknown) {
  if (typeof resume === 'string') return resume
  if (!resume || typeof resume !== 'object') return ''
  return JSON.stringify(resume, null, 2)
}
