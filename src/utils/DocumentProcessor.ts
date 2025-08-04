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
      // First try the Edge Function for PDF processing
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('https://ncpifmvfijbtecwwymou.supabase.co/functions/v1/extract-pdf-text', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.text && result.text.length > 20) {
          console.log('PDF processed successfully via Edge Function');
          return result.text;
        }
      }
      
      // Fallback to client-side extraction if Edge Function fails
      console.log('Edge Function failed, trying client-side extraction');
      return await this.extractTextFromPDFClientSide(file);
      
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      // Try client-side fallback
      try {
        return await this.extractTextFromPDFClientSide(file);
      } catch (fallbackError) {
        throw new Error("Unable to extract text from this PDF. Please try converting it to a Word document (.docx) or text file (.txt) for better results.");
      }
    }
  }

  private static async extractTextFromPDFClientSide(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('utf-8', { fatal: false });
    let text = decoder.decode(uint8Array);
    
    // Extract readable text patterns from PDF
    const lines: string[] = [];
    
    // Split by common PDF patterns and clean
    const segments = text.split(/[\r\n]+/);
    
    for (const segment of segments) {
      // Look for readable text (letters, numbers, common punctuation)
      const cleanText = segment
        .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, ' ') // Keep printable chars
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      // Only keep segments that look like real text
      if (cleanText.length > 3 && /[a-zA-Z]/.test(cleanText)) {
        // Filter out PDF metadata and structure
        if (!cleanText.match(/^(obj|endobj|stream|endstream|xref|trailer|startxref)/i)) {
          lines.push(cleanText);
        }
      }
    }
    
    const result = lines.join('\n').trim();
    
    if (result.length < 50) {
      throw new Error('Unable to extract readable text from this PDF. It may be image-based or heavily formatted.');
    }
    
    return result;
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