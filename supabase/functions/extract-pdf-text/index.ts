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
    
    // Method 3: Simple but effective text extraction
    console.log('Attempting simple text extraction...');
    extractedText = extractSimpleText(arrayBuffer);
    
    if (extractedText.length > 50) {
      return new Response(JSON.stringify({ 
        success: true, 
        text: extractedText,
        source: 'simple-extraction'
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

function extractSimpleText(arrayBuffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(arrayBuffer);
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const content = decoder.decode(uint8Array);
  
  console.log('Simple extraction - content length:', content.length);
  
  // Extract text between BT and ET (text blocks)
  const textBlocks: string[] = [];
  const btPattern = /BT\s*([\s\S]*?)\s*ET/g;
  let btMatch;
  
  while ((btMatch = btPattern.exec(content)) !== null) {
    const block = btMatch[1];
    // Extract text from Tj operations
    const tjPattern = /\(([^)]*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjPattern.exec(block)) !== null) {
      const text = tjMatch[1]
        .replace(/\\n/g, ' ')
        .replace(/\\r/g, ' ')
        .replace(/\\t/g, ' ')
        .replace(/\\\\/g, '\\')
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"')
        .trim();
      
      if (text.length > 1 && /[a-zA-Z0-9]/.test(text)) {
        textBlocks.push(text);
      }
    }
  }
  
  // Also try to extract from TJ array operations
  const tjArrayPattern = /\[\s*\(([^)]*)\)\s*\]\s*TJ/g;
  let tjArrayMatch;
  while ((tjArrayMatch = tjArrayPattern.exec(content)) !== null) {
    const text = tjArrayMatch[1]
      .replace(/\\n/g, ' ')
      .replace(/\\r/g, ' ')
      .replace(/\\t/g, ' ')
      .replace(/\\\\/g, '\\')
      .trim();
    
    if (text.length > 1 && /[a-zA-Z0-9]/.test(text)) {
      textBlocks.push(text);
    }
  }
  
  // If BT/ET extraction didn't work, try basic pattern matching
  if (textBlocks.length === 0) {
    console.log('BT/ET extraction failed, trying basic patterns...');
    
    const lines = content.split(/[\r\n]+/);
    for (const line of lines) {
      // Look for readable text patterns
      const cleaned = line
        .replace(/[^\x20-\x7E]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Only keep lines that look like real text
      if (cleaned.length > 3 && 
          /[a-zA-Z]/.test(cleaned) && 
          !cleaned.match(/^(obj|endobj|stream|endstream|xref|trailer|startxref|\/[A-Z])/i)) {
        textBlocks.push(cleaned);
      }
    }
  }
  
  console.log('Extracted text blocks:', textBlocks.length);
  
  if (textBlocks.length === 0) {
    throw new Error('No readable text found in PDF');
  }
  
  // Join all text blocks and clean up
  let result = textBlocks.join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  console.log('Final result length:', result.length);
  console.log('Sample text:', result.substring(0, 200));
  
  return result;
}