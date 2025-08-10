/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
 // Vite-friendly worker URL for PDF.js (resolves to a URL string at build time)
 // @ts-ignore - This import relies on Vite's ?url handling
 import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure PDF.js worker to use the bundled version to avoid mismatches
if (typeof window !== 'undefined' && (pdfjsLib as any).GlobalWorkerOptions) {
  (pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerSrc as unknown as string;
}

export class DocumentProcessor {
  static async extractTextFromFile(file: File): Promise<string> {
    const fileType = file.type || this.getFileTypeFromName(file.name);
    
    // DIAGNOSTIC LOGS
    try {
      let extractedText = '';
      switch (fileType) {
        case 'application/pdf':
          extractedText = await this.extractTextFromPDF(file);
          break;
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          extractedText = await this.extractTextFromDOCX(file);
          break;
        case 'text/plain':
          extractedText = await this.extractTextFromTXT(file);
          break;
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
      
      if (extractedText.length < 10) {
        }
      
      return extractedText;
    } catch (error) {
      console.error('❌ Error extracting text from file:', error);
      throw error;
    }
  }

  private static getFileTypeFromName(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'txt':
        return 'text/plain';
      default:
        return 'unknown';
    }
  }

  private static async extractTextFromPDF(file: File): Promise<string> {
    try {
      // Check if we're in local mode - skip Supabase function call
      const isLocalMode = import.meta.env.VITE_APP_MODE === 'local';
      
      if (!isLocalMode) {
        // Try Edge Function first for reliable PDF text extraction (production only)
        try {
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch('https://ncpifmvfijbtecwwymou.supabase.co/functions/v1/extract-pdf-text', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success && result.text && result.text.length > 20) {
              const cleanText = this.cleanExtractedText(result.text);
              return cleanText;
            } else {
              }
          } else {
            const errorText = await response.text();
            }
        } catch (edgeFunctionError) {
          }
      } else {
        }
      
      // Try PDF.js extraction first (works in both local and production when worker is configured)
      try {
        const pdfText = await this.extractTextWithPDFJS(file);
        if (pdfText && pdfText.length > 50) {
          return pdfText;
        }
      } catch (pdfJsError) {
        }
      
      // Use enhanced client-side extraction for local mode or as fallback
      const extractedText = await this.extractTextFromPDFClientSide(file);
      
      // If extraction still returns garbled text, try a simple text-only approach
      if (extractedText.length < 100 || !this.isReadableText(extractedText)) {
        return await this.extractSimpleTextFromPDF(file);
      }
      
      return extractedText;
      
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      throw new Error("Unable to extract text from this PDF. The document may be image-based, encrypted, or corrupted. Please try converting it to a Word document (.docx) or text file (.txt) for better results.");
    }
  }

  private static async extractTextWithPDFJS(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const textContent: string[] = [];
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContentObj = await page.getTextContent();
        
        // Combine all text items from the page
        const pageText = textContentObj.items
          .map((item: any) => {
            // Handle both string items and objects with 'str' property
            return typeof item === 'string' ? item : (item.str || '');
          })
          .filter((text: string) => text.trim().length > 0)
          .join(' ');
        
        if (pageText.trim()) {
          textContent.push(pageText.trim());
          }
      } catch (pageError) {
        }
    }
    
    if (textContent.length === 0) {
      throw new Error('No text content found in PDF pages');
    }
    
    const fullText = textContent.join('\n\n').trim();
    return fullText;
  }

  private static cleanExtractedText(text: string): string {
    return text
      // Remove excessive whitespace but preserve line breaks
      .replace(/[ \t]+/g, ' ')
      // Remove multiple consecutive line breaks
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Remove PDF artifacts and control characters
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Trim whitespace from each line
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n')
      .trim();
  }

  private static async extractTextFromPDFClientSide(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Check if this is actually a PDF file
    const pdfHeader = String.fromCharCode(...uint8Array.slice(0, 4));
    if (pdfHeader !== '%PDF') {
      throw new Error('Invalid PDF file - missing PDF header');
    }
    
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const content = decoder.decode(uint8Array);
    
    const textBlocks: string[] = [];
    
    // Method 1: Extract text from PDF text objects (BT...ET blocks)
    const btPattern = /BT\s+([\s\S]*?)\s+ET/g;
    let btMatch;
    
    while ((btMatch = btPattern.exec(content)) !== null) {
      const block = btMatch[1];
      
      // Extract text from Tj operations: (text) Tj
      const tjPattern = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*Tj/g;
      let tjMatch;
      while ((tjMatch = tjPattern.exec(block)) !== null) {
        const text = this.cleanPdfText(tjMatch[1]);
        if (text.length > 0 && /[a-zA-Z0-9]/.test(text)) {
          textBlocks.push(text);
        }
      }
      
      // Extract from TJ array operations: [(text)] TJ
      const tjArrayPattern = /\[\s*\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*\]\s*TJ/g;
      let tjArrayMatch;
      while ((tjArrayMatch = tjArrayPattern.exec(block)) !== null) {
        const text = this.cleanPdfText(tjArrayMatch[1]);
        if (text.length > 0 && /[a-zA-Z0-9]/.test(text)) {
          textBlocks.push(text);
        }
      }
      
      // Extract from complex TJ arrays: [(text1) num (text2) num ...] TJ
      const complexTjPattern = /\[\s*((?:\([^)\\]*(?:\\.[^)\\]*)*\)\s*(?:-?\d+(?:\.\d+)?\s*)?)+)\]\s*TJ/g;
      let complexMatch;
      while ((complexMatch = complexTjPattern.exec(block)) !== null) {
        const arrayContent = complexMatch[1];
        const textInArrayPattern = /\(([^)\\]*(?:\\.[^)\\]*)*)\)/g;
        let textMatch;
        while ((textMatch = textInArrayPattern.exec(arrayContent)) !== null) {
          const text = this.cleanPdfText(textMatch[1]);
          if (text.length > 0 && /[a-zA-Z0-9]/.test(text)) {
            textBlocks.push(text);
          }
        }
      }
    }
    
    // Method 2: If no text blocks found, try stream content extraction
    if (textBlocks.length === 0) {
      // Look for stream objects that might contain text
      const streamPattern = /stream\s+([\s\S]*?)\s+endstream/g;
      let streamMatch;
      
      while ((streamMatch = streamPattern.exec(content)) !== null) {
        const streamContent = streamMatch[1];
        
        // Try to find readable text in streams
        const readableText = streamContent
          .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Keep only printable ASCII + whitespace
          .replace(/\s+/g, ' ')
          .trim();
        
        if (readableText.length > 10 && /[a-zA-Z]{3,}/.test(readableText)) {
          // Split into words and filter meaningful ones
          const words = readableText.split(/\s+/).filter(word =>
            word.length > 2 &&
            /^[a-zA-Z0-9.,!?;:'"()-]+$/.test(word) &&
            !word.match(/^(obj|endobj|stream|endstream|xref|trailer|startxref)$/i)
          );
          
          if (words.length > 5) {
            textBlocks.push(words.join(' '));
          }
        }
      }
    }
    
    // Method 3: Last resort - scan for any readable text patterns
    if (textBlocks.length === 0) {
      // Look for sequences of readable characters
      const readablePattern = /[a-zA-Z][a-zA-Z0-9\s.,!?;:'"()-]{10,}/g;
      let patternMatch;
      
      while ((patternMatch = readablePattern.exec(content)) !== null) {
        const text = patternMatch[0].trim();
        if (text.length > 15 &&
            !text.match(/^(obj|endobj|stream|endstream|xref|trailer|startxref)/i) &&
            text.split(/\s+/).length > 3) {
          textBlocks.push(text);
        }
      }
    }
    
    if (textBlocks.length === 0) {
      throw new Error('Unable to extract readable text from this PDF. The document may be:\n• Image-based (scanned document)\n• Password-protected\n• Heavily formatted with complex layouts\n• Corrupted\n\nTry converting it to a Word document (.docx) or text file (.txt) for better results.');
    }
    
    // Join and clean up the result
    const result = textBlocks
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (result.length < 50) {
      throw new Error('Extracted text is too short. The PDF may not contain readable text content.');
    }
    
    return result;
  }

  private static cleanPdfText(text: string): string {
    return text
      .replace(/\\n/g, ' ')
      .replace(/\\r/g, ' ')
      .replace(/\\t/g, ' ')
      .replace(/\\\\/g, '\\')
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\([0-9a-fA-F]{3})/g, (match, octal) => {
        // Convert octal escape sequences to characters
        return String.fromCharCode(parseInt(octal, 8));
      })
      .trim();
  }

  private static isReadableText(text: string): boolean {
    // Check if text contains mostly readable characters
    const readableChars = text.match(/[a-zA-Z0-9\s.,!?;:'"()-]/g) || [];
    const readableRatio = readableChars.length / text.length;
    return readableRatio > 0.7; // At least 70% readable characters
  }

  private static async extractSimpleTextFromPDF(file: File): Promise<string> {
    // For local development, return a message indicating manual conversion is needed
    const message = `Unable to extract text from this PDF file automatically.

The PDF appears to be:
• Image-based (scanned document)
• Using complex encoding
• Password-protected
• Or heavily formatted

For best results, please:
1. Convert the PDF to a Word document (.docx) using an online converter
2. Or save it as a plain text file (.txt)
3. Then upload the converted file

Alternatively, you can try:
• Using a different PDF file
• Copying and pasting the text content directly into a text file`;

    throw new Error(message);
  }

  private static extractReadableLines(text: string): string[] {
    const lines: string[] = [];
    const segments = text.split(/[\r\n]+/);
    
    for (const segment of segments) {
      // Clean and normalize the segment
      const cleanText = segment
        .replace(/[^\x20-\x7E\u00A0-\u00FF≥≤±°µ§]/g, ' ') // Keep printable chars + common symbols
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      // Only keep segments that look like real text
      if (cleanText.length > 2 && /[a-zA-Z]/.test(cleanText)) {
        // Filter out PDF metadata and structure
        if (!cleanText.match(/^(obj|endobj|stream|endstream|xref|trailer|startxref|\/[A-Z])/i)) {
          lines.push(cleanText);
        }
      }
    }
    
    return lines;
  }

  private static scoreExtractedText(text: string): number {
    let score = 0;
    
    // Score based on common resume/document patterns
    if (/\b\d{4}\b/.test(text)) score += 10; // Years
    if (/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/.test(text)) score += 10; // Dates
    if (/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/.test(text)) score += 15; // Names
    if (/\b\w+@\w+\.\w+\b/.test(text)) score += 20; // Email
    if (/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(text)) score += 15; // Phone
    if (/\b(experience|education|skills|work|job|university|degree)\b/i.test(text)) score += 25; // Resume keywords
    
    // Penalty for too much garbage
    const garbageRatio = (text.match(/[^\w\s.,-]/g) || []).length / text.length;
    if (garbageRatio > 0.3) score -= 50;
    
    return score;
  }

  private static async extractTextFromDOCX(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (error) {
      console.error('Error extracting DOCX text:', error);
      throw new Error('Failed to extract text from Word document.');
    }
  }

  private static async extractTextFromTXT(file: File): Promise<string> {
    try {
      return await file.text();
    } catch (error) {
      console.error('Error reading text file:', error);
      throw new Error('Failed to read text file.');
    }
  }

  static summarizeText(text: string, maxLength: number = 500): string {
    if (text.length <= maxLength) return text;
    
    // Simple summarization by taking first few sentences
    const sentences = text.split(/[.!?]+/);
    let summary = '';
    
    for (const sentence of sentences) {
      if (summary.length + sentence.length > maxLength) break;
      summary += sentence.trim() + '. ';
    }
    
    return summary.trim() || text.substring(0, maxLength) + '...';
  }
}
