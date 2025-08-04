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
      // Use Supabase Edge Function for better PDF processing
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('https://ncpifmvfijbtecwwymou.supabase.co/functions/v1/extract-pdf-text', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('PDF processing service unavailable');
      }

      const result = await response.json();
      
      if (result.success && result.text && result.text.length > 20) {
        return result.text;
      }
      
      throw new Error('No readable text found in PDF');
      
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      throw new Error("Unable to extract text from this PDF. Please try converting it to a Word document (.docx) or text file (.txt) for better results.");
    }
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