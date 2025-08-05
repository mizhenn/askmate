// @ts-ignore  
import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js`;

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
      
      // Try client-side PDF parsing first with pdf-parse library
      const arrayBuffer = await file.arrayBuffer();
      console.log('File converted to array buffer');
      
      // Try browser-compatible PDF.js for reliable PDF text extraction
      try {
        console.log('Attempting PDF.js extraction...');
        const loadingTask = pdfjsLib.getDocument(arrayBuffer);
        const pdf = await loadingTask.promise;
        console.log(`PDF loaded successfully, ${pdf.numPages} pages`);
        
        let fullText = '';
        
        // Extract text from each page
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          // Combine all text items from the page
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          
          fullText += pageText + '\n';
          console.log(`Page ${pageNum} extracted: ${pageText.length} characters`);
        }
        
        if (fullText && fullText.trim().length > 20) {
          const cleanText = this.cleanExtractedText(fullText);
          console.log(`PDF.js extraction successful: ${cleanText.length} characters`);
          console.log(`Preview: ${cleanText.substring(0, 200)}`);
          return cleanText;
        }
      } catch (pdfjsError) {
        console.log('PDF.js failed, trying Edge Function:', pdfjsError);
      }

      // Fallback to Edge Function if pdf-parse fails
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
            console.log('PDF processed successfully via Edge Function');
            const cleanText = this.cleanExtractedText(result.text);
            return cleanText;
          }
        }
      } catch (edgeFunctionError) {
        console.log('Edge Function failed:', edgeFunctionError);
      }
      
      // Final fallback to basic client-side extraction
      console.log('All methods failed, trying basic client-side extraction');
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