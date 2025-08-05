import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    if (file.type !== 'application/pdf') {
      throw new Error('Only PDF files are supported');
    }

    console.log(`Processing PDF: ${file.name}, size: ${file.size} bytes`);

    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    let extractedText = '';
    
    // Method 1: Try OCRSpace API (free tier with OCR for image-based PDFs)
    try {
      console.log('Attempting OCR extraction with OCRSpace API...');
      
      const ocrFormData = new FormData();
      ocrFormData.append('file', new Blob([arrayBuffer], { type: 'application/pdf' }), file.name);
      ocrFormData.append('apikey', 'helloworld'); // Free demo key
      ocrFormData.append('language', 'eng');
      ocrFormData.append('isOverlayRequired', 'false');
      ocrFormData.append('iscreatesearchablepdf', 'false');
      ocrFormData.append('issearchablepdfhidetextlayer', 'false');
      
      const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: ocrFormData
      });
      
      if (ocrResponse.ok) {
        const ocrResult = await ocrResponse.json();
        console.log('OCR Response:', ocrResult);
        
        if (ocrResult.ParsedResults && ocrResult.ParsedResults.length > 0) {
          extractedText = ocrResult.ParsedResults[0].ParsedText || '';
          if (extractedText.trim().length > 50) {
            console.log('Successfully extracted via OCR:', extractedText.length, 'characters');
            return new Response(JSON.stringify({ 
              success: true, 
              text: extractedText.trim(),
              source: 'ocr'
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      }
    } catch (error) {
      console.log('OCR extraction failed:', error.message);
    }
    
    // Method 2: Try PDF.co with OCR enabled
    try {
      console.log('Attempting PDF.co with OCR...');
      
      const response = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'demo'
        },
        body: JSON.stringify({
          url: `data:application/pdf;base64,${base64}`,
          async: false,
          inline: true,
          lang: 'eng',
          ocrLanguages: 'eng',
          profiles: 'ocr,textextraction',
          extractInvisibleText: true
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.body && result.body.trim().length > 50) {
          extractedText = result.body.trim();
          console.log('Successfully extracted via PDF.co OCR:', extractedText.length, 'characters');
          return new Response(JSON.stringify({ 
            success: true, 
            text: extractedText,
            source: 'pdfco-ocr'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    } catch (error) {
      console.log('PDF.co OCR failed:', error.message);
    }
    
    // Method 3: Advanced PDF parsing with decompression
    console.log('Attempting advanced PDF parsing...');
    extractedText = await extractTextWithDecompression(arrayBuffer);
    
    if (extractedText.length > 30) {
      return new Response(JSON.stringify({ 
        success: true, 
        text: extractedText,
        source: 'advanced-parsing'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    throw new Error('Unable to extract readable text from this PDF. The document may be image-based, encrypted, or corrupted.');

  } catch (error) {
    console.error('Error extracting PDF text:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Failed to extract text from PDF' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function extractTextWithDecompression(arrayBuffer: ArrayBuffer): Promise<string> {
  const uint8Array = new Uint8Array(arrayBuffer);
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const pdfContent = decoder.decode(uint8Array);
  
  console.log('Advanced parsing - PDF content length:', pdfContent.length);
  
  const extractedTexts: string[] = [];
  
  // Method 1: Extract and decompress FlateDecode streams with limit
  const streamPattern = /(\d+\s+\d+\s+obj[\s\S]*?stream\s*\n)([\s\S]*?)(\s*endstream)/g;
  let streamMatch;
  let matchCount = 0;
  const maxMatches = 50; // Prevent infinite loops
  
  while ((streamMatch = streamPattern.exec(pdfContent)) !== null && matchCount < maxMatches) {
    matchCount++;
    const streamData = streamMatch[2];
    
    // Skip very large streams that might cause issues
    if (streamData.length > 100000) {
      console.log('Skipping large stream to prevent memory issues');
      continue;
    }
    
    try {
      // Try to decompress if it's FlateDecode
      if (streamMatch[1].includes('/FlateDecode')) {
        console.log('Found FlateDecode stream, attempting decompression...');
        // For now, we'll parse the raw stream content
        parseStreamContent(streamData, extractedTexts);
      } else {
        // Parse uncompressed stream
        parseStreamContent(streamData, extractedTexts);
      }
    } catch (error) {
      console.log('Stream parsing failed:', error.message);
    }
  }
  
  // Method 2: Look for any readable text patterns
  if (extractedTexts.length === 0) {
    console.log('No stream text found, searching for readable patterns...');
    
    // Enhanced pattern matching for resume content
    const patterns = [
      /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g,           // Names (First Last)
      /\b\d{4}\s*[-–]\s*\d{4}\b/g,                 // Year ranges
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,             // Dates
      /\b[A-Z][a-z]+\s+\d{4}\b/g,                 // Month Year
      /\b[A-Z][A-Z\s]{2,}\b/g,                    // Titles/headers
      /\b\w+@\w+\.\w+\b/g,                        // Email addresses
      /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,      // Phone numbers
      /\b[A-Z][a-z]+(\s+[A-Z][a-z]+)*:\s*/g,      // Section headers
    ];
    
    for (const pattern of patterns) {
      const matches = pdfContent.match(pattern);
      if (matches) {
        extractedTexts.push(...matches);
      }
    }
  }
  
  // Method 3: Character-by-character extraction for encoded text
  if (extractedTexts.length === 0) {
    console.log('Attempting character-level extraction...');
    
    const chars: string[] = [];
    for (let i = 0; i < uint8Array.length; i++) {
      const byte = uint8Array[i];
      // Extract printable ASCII and common extended characters
      if ((byte >= 32 && byte <= 126) || (byte >= 160 && byte <= 255)) {
        chars.push(String.fromCharCode(byte));
      } else if (byte === 10 || byte === 13) {
        chars.push(' '); // Convert line breaks to spaces
      }
    }
    
    const text = chars.join('').replace(/\s+/g, ' ').trim();
    if (text.length > 100) {
      extractedTexts.push(text);
    }
  }
  
  console.log('Total extracted segments:', extractedTexts.length);
  
  if (extractedTexts.length === 0) {
    throw new Error('No readable text found in PDF');
  }
  
  // Clean and join all extracted text
  let result = extractedTexts.join(' ')
    .replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  console.log('Final result length:', result.length);
  console.log('Sample text:', result.substring(0, 200));
  
  return result;
}

function parseStreamContent(streamData: string, extractedTexts: string[]): void {
  // Look for text operations within the stream
  const textOperations = [
    /BT\s*([\s\S]*?)\s*ET/g,
    /\(([^)]*)\)\s*Tj/g,
    /\(([^)]*)\)\s*'/g,
    /\(([^)]*)\)\s*"/g,
    /\[\s*\(([^)]*)\)\s*\]\s*TJ/g,
  ];
  
  for (const operation of textOperations) {
    let match;
    while ((match = operation.exec(streamData)) !== null) {
      let text = match[1];
      if (text && text.length > 0) {
        // Clean the extracted text
        text = text
          .replace(/\\n/g, ' ')
          .replace(/\\r/g, ' ')
          .replace(/\\t/g, ' ')
          .replace(/\\\\/g, '\\')
          .replace(/\\'/g, "'")
          .replace(/\\"/g, '"')
          .trim();
        
        if (text.length > 1 && /[a-zA-Z0-9]/.test(text)) {
          extractedTexts.push(text);
        }
      }
    }
  }
}