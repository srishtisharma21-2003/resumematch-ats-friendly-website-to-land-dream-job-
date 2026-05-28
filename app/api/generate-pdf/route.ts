import { NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'

function flattenResumeData(value: unknown): string[] {
  if (!value) return ['No resume data provided.']

  if (typeof value === 'string') {
    return value.split('\n').filter(Boolean)
  }

  if (Array.isArray(value)) {
    return value.flatMap(flattenResumeData)
  }

  if (typeof value === 'object') {
    return Object.entries(value).flatMap(([key, nested]) => {
      const lines = flattenResumeData(nested)
      return [`${key}:`, ...lines.map((line) => `  ${line}`)]
    })
  }

  return [String(value)]
}

export async function POST(req: Request) {
  try {
    const { resumeData } = await req.json()
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const margin = 40
    const pageHeight = doc.internal.pageSize.getHeight()
    const pageWidth = doc.internal.pageSize.getWidth()
    const maxWidth = pageWidth - margin * 2
    let y = margin

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)

    for (const line of flattenResumeData(resumeData)) {
      const wrapped = doc.splitTextToSize(line, maxWidth)

      for (const textLine of wrapped) {
        if (y > pageHeight - margin) {
          doc.addPage()
          y = margin
        }

        doc.text(textLine, margin, y)
        y += 16
      }

      y += 4
    }

    const pdf = Buffer.from(doc.output('arraybuffer'))

    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="resume.pdf"',
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
