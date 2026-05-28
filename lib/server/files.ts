import mammoth from 'mammoth'

export async function extractTextFromUploadedFile(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer())
  const fileName = file.name.toLowerCase()
  const fileType = file.type

  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    const { PDFParse } = await import('pdf-parse')
    const parser = new PDFParse({ data: buffer })
    const data = await parser.getText()
    await parser.destroy()
    const text = data.text.trim()
    if (!text) throw new Error('PDF appears to be scanned - no extractable text')
    return text
  }

  if (
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileName.endsWith('.docx')
  ) {
    const result = await mammoth.extractRawText({ buffer })
    return result.value.trim()
  }

  if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
    return buffer.toString('utf-8').trim()
  }

  throw new Error('Unsupported file type. Please upload PDF, DOCX, or TXT.')
}
