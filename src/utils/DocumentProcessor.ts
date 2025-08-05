// @ts-ignore  
import * as mammoth from 'mammoth';

export class DocumentProcessor {
  static async extractTextFromFile(file: File): Promise<string> {
    const fileType = file.type || this.getFileTypeFromName(file.name);
    
    try {
      switch (fileType) {
        case 'application/pdf':
          return this.extractTextFromPDF(file);
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return this.extractTextFromDOCX(file);
        case 'text/plain':
          return this.extractTextFromTXT(file);
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      console.error('Error extracting text from file:', error);
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
      console.log(`Starting PDF extraction for: ${file.name}, size: ${file.size} bytes`);
      
      // Try Edge Function first for reliable PDF text extraction
      try {
        const formData = new FormData();
        formData.append('file', file);

        console.log('Attempting Edge Function extraction...');
        const response = await fetch('https://ncpifmvfijbtecwwymou.supabase.co/functions/v1/extract-pdf-text', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Edge Function response:', result);
          
          if (result.success && result.text && result.text.length > 20) {
            console.log('PDF processed successfully via Edge Function');
            const cleanText = this.cleanExtractedText(result.text);
            console.log(`Clean text length: ${cleanText.length}, preview: ${cleanText.substring(0, 200)}`);
            return cleanText;
          } else {
            console.log('Edge Function returned insufficient text:', result);
          }
        } else {
          const errorText = await response.text();
          console.log('Edge Function failed with status:', response.status, errorText);
        }
      } catch (edgeFunctionError) {
        console.log('Edge Function failed:', edgeFunctionError);
      }
      
      // Fallback to enhanced client-side extraction
      console.log('Trying enhanced client-side extraction...');
      return await this.extractTextFromPDFClientSide(file);
      
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      throw new Error("Unable to extract text from this PDF. The document may be image-based, encrypted, or corrupted. Please try converting it to a Word document (.docx) or text file (.txt) for better results.");
    }
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
    console.log('Starting PROPER client-side PDF extraction...');
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const content = decoder.decode(uint8Array);
    
    console.log('PDF content length:', content.length);
    
    // Method 1: Extract text from PDF text objects
    const textBlocks: string[] = [];
    
    // Look for BT...ET text blocks
    const btPattern = /BT\s*([\s\S]*?)\s*ET/g;
    let btMatch;
    
    while ((btMatch = btPattern.exec(content)) !== null) {
      const block = btMatch[1];
      console.log('Found BT block:', block.substring(0, 100));
      
      // Extract text from Tj operations
      const tjPattern = /\(([^)]*)\)\s*Tj/g;
      let tjMatch;
      while ((tjMatch = tjPattern.exec(block)) !== null) {
        const text = this.cleanPdfText(tjMatch[1]);
        if (text.length > 1 && /[a-zA-Z0-9]/.test(text)) {
          textBlocks.push(text);
          console.log('Extracted from Tj:', text);
        }
      }
      
      // Extract from TJ array operations
      const tjArrayPattern = /\[\s*\(([^)]*)\)\s*\]\s*TJ/g;
      let tjArrayMatch;
      while ((tjArrayMatch = tjArrayPattern.exec(block)) !== null) {
        const text = this.cleanPdfText(tjArrayMatch[1]);
        if (text.length > 1 && /[a-zA-Z0-9]/.test(text)) {
          textBlocks.push(text);
          console.log('Extracted from TJ:', text);
        }
      }
    }
    
    console.log(`Extracted ${textBlocks.length} text blocks from BT/ET`);
    
    // Method 2: If no text blocks found, try basic extraction
    if (textBlocks.length === 0) {
      console.log('No BT/ET blocks found, trying basic extraction...');
      const lines = content.split(/[\r\n]+/);
      
      for (const line of lines.slice(0, 1000)) { // Limit to first 1000 lines
        const cleaned = line
          .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (cleaned.length > 3 && 
            /[a-zA-Z]/.test(cleaned) && 
            !cleaned.match(/^(obj|endobj|stream|endstream|xref|trailer|startxref|\/[A-Z])/i)) {
          textBlocks.push(cleaned);
        }
      }
    }
    
    if (textBlocks.length === 0) {
      throw new Error('Unable to extract readable text from this PDF. It may be image-based, password-protected, or heavily formatted.');
    }
    
    const result = textBlocks.join(' ').replace(/\s+/g, ' ').trim();
    console.log(`Final extraction result: ${result.length} characters`);
    console.log('Sample:', result.substring(0, 200));
    
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
      .trim();
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
