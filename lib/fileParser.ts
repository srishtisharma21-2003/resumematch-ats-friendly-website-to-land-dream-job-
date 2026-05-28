// Why this file: Users upload PDF/DOCX/TXT files.
// The AI needs plain text. This file converts any format → plain string.
import { apiClient } from '@/lib/api'

/**
 * Extracts plain text from an uploaded File object.
 * Supports: PDF, DOCX, TXT
 * 
 * @param file - The File object from a file input
 * @returns Plain text string
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type
  const fileName = file.name.toLowerCase()

  // ── Plain text files ─────────────────────────────────────────────────────
  if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
    return await file.text()
  }

  // ── PDF files ────────────────────────────────────────────────────────────
  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    // We send the file to our own API route for server-side parsing
    // (pdf-parse is a Node.js library, can't run in browser)
    const formData = new FormData()
    formData.append('file', file)

    const { text } = await apiClient<{ text: string }>('/api/parse-file', {
      method: 'POST',
      body: formData,
    })
    return text
  }

  // ── DOCX files ───────────────────────────────────────────────────────────
  if (
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileName.endsWith('.docx')
  ) {
    const formData = new FormData()
    formData.append('file', file)

    const { text } = await apiClient<{ text: string }>('/api/parse-file', {
      method: 'POST',
      body: formData,
    })
    return text
  }

  throw new Error(`Unsupported file type: ${fileType}. Please upload PDF, DOCX, or TXT.`)
}
