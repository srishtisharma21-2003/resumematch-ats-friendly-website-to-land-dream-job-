import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'
import PDFParser from 'pdf2json'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = file.name.toLowerCase()
    const fileType = file.type

    // ---------- TXT ----------
    if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      const text = buffer.toString('utf-8')
      return NextResponse.json({ text })
    }

    // ---------- PDF ----------
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      // pdf2json works with buffers directly
      const pdfParser = new PDFParser()
      
      const text = await new Promise<string>((resolve, reject) => {
        pdfParser.on('pdfParser_dataError', (err: any) => reject(err))
        pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
          // pdfParser.getRawTextContent() returns raw text
          const rawText = pdfParser.getRawTextContent()
          resolve(rawText.trim())
        })
        pdfParser.parseBuffer(buffer)
      })

      if (!text) {
        return NextResponse.json(
          { error: 'PDF appears to be scanned – no extractable text' },
          { status: 400 }
        )
      }
      return NextResponse.json({ text })
    }

    // ---------- DOCX ----------
    if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      const result = await mammoth.extractRawText({ buffer })
      return NextResponse.json({ text: result.value.trim() })
    }

    return NextResponse.json(
      { error: `Unsupported file type: ${fileName.split('.').pop() || 'unknown'}` },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('[parse-file] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to parse file' },
      { status: 500 }
    )
  }
}