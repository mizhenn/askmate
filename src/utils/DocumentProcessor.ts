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
      // Simple text extraction approach that works for most PDFs
      const arrayBuffer = await file.arrayBuffer();
      const text = new TextDecoder('utf-8').decode(arrayBuffer);
      
      // Extract text content using regex patterns for PDF structure
      const textContent = this.extractPDFTextContent(text);
      
      if (textContent && textContent.length > 20) {
        return textContent;
      }
      
      // If no meaningful content found, inform user
      throw new Error('This PDF appears to be image-based or encrypted. Please try converting it to text or using a different document format.');
      
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      throw new Error('Unable to extract text from this PDF. Please try a text file or Word document instead.');
    }
  }

  private static extractPDFTextContent(pdfText: string): string {
    // Look for text patterns in PDF
    const patterns = [
      /BT\s*.*?ET/gs, // Text blocks
      /\((.*?)\)/g,   // Text in parentheses
      /\[(.*?)\]/g,   // Text in brackets
    ];
    
    let extractedText = '';
    
    for (const pattern of patterns) {
      const matches = pdfText.match(pattern);
      if (matches) {
        for (const match of matches) {
          let text = match
            .replace(/BT|ET/g, '') // Remove text block markers
            .replace(/[()[\]]/g, '') // Remove brackets and parentheses
            .replace(/\\[rnt]/g, ' ') // Replace escape sequences
            .replace(/[^\x20-\x7E]/g, ' ') // Keep only printable ASCII
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
          
          if (text.length > 2) {
            extractedText += text + ' ';
          }
        }
      }
    }
    
    return extractedText.trim();
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