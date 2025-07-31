// @ts-ignore
import * as pdfjsLib from 'pdf-parse';
// @ts-ignore  
import * as mammoth from 'mammoth';

export class DocumentProcessor {
  static async extractTextFromFile(file: File): Promise<string> {
    const fileType = file.type || this.getFileTypeFromName(file.name);
    
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
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Use a simpler approach for browser environment
      const text = await this.extractPDFTextFallback(uint8Array);
      return text;
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      throw new Error('Failed to extract text from PDF. This file might be password protected or corrupted.');
    }
  }

  private static async extractPDFTextFallback(data: Uint8Array): Promise<string> {
    // Simple PDF text extraction fallback
    const text = new TextDecoder().decode(data);
    // Very basic PDF text extraction - look for text between stream markers
    const textMatches = text.match(/\(([^)]+)\)/g);
    if (textMatches) {
      return textMatches.map(match => match.slice(1, -1)).join(' ');
    }
    
    // Fallback: just inform user that PDF processing needs server-side support
    throw new Error('PDF text extraction requires server-side processing. Please try a text or Word document instead.');
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