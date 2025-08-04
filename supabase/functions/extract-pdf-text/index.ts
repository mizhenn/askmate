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

    // Convert file to base64 for external API
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    console.log('Converted to base64, length:', base64.length);

    // Try external PDF processing service with better settings
    try {
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
          ocrLanguages: 'eng'
        })
      });

      console.log('PDF.co API response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('PDF.co result keys:', Object.keys(result));
        
        if (result.body && result.body.trim().length > 50) {
          const cleanText = result.body
            .replace(/\s+/g, ' ')
            .trim();
          
          console.log('Successfully extracted via API, length:', cleanText.length);
          return new Response(JSON.stringify({ 
            success: true, 
            text: cleanText,
            source: 'api'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          console.log('API returned insufficient text:', result.body?.length || 0);
        }
      } else {
        console.log('API request failed:', response.status, response.statusText);
      }
    } catch (apiError) {
      console.log('API error:', apiError.message);
    }

    // Fallback: Simple but effective text extraction
    console.log('Using fallback extraction method');
    const fallbackText = await extractTextSimple(arrayBuffer);
    
    return new Response(JSON.stringify({ 
      success: true, 
      text: fallbackText,
      source: 'fallback'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

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

async function extractTextSimple(arrayBuffer: ArrayBuffer): Promise<string> {
  const uint8Array = new Uint8Array(arrayBuffer);
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const pdfContent = decoder.decode(uint8Array);
  
  console.log('PDF content length:', pdfContent.length);
  
  const extractedTexts: string[] = [];
  
  // Method 1: Look for text between parentheses in PDF content streams
  // This is the most common way text is stored in PDFs: (Text content) Tj
  const textInParens = pdfContent.match(/\(([^)]+)\)\s*Tj/g);
  if (textInParens) {
    console.log('Found', textInParens.length, 'text operations');
    for (const match of textInParens) {
      const text = match.replace(/^\(/, '').replace(/\)\s*Tj$/, '');
      if (text.length > 1 && /[a-zA-Z]/.test(text)) {
        extractedTexts.push(text);
      }
    }
  }
  
  // Method 2: Look for text in bracket arrays: [(Text)] TJ
  const textInBrackets = pdfContent.match(/\[\s*\(([^)]+)\)\s*\]\s*TJ/g);
  if (textInBrackets) {
    console.log('Found', textInBrackets.length, 'array text operations');
    for (const match of textInBrackets) {
      const text = match.replace(/^\[\s*\(/, '').replace(/\)\s*\]\s*TJ$/, '');
      if (text.length > 1 && /[a-zA-Z]/.test(text)) {
        extractedTexts.push(text);
      }
    }
  }
  
  // Method 3: Simple pattern matching for readable text
  if (extractedTexts.length === 0) {
    console.log('No structured text found, trying pattern matching');
    
    // Look for sequences of readable characters
    const readablePattern = /[A-Za-z][A-Za-z0-9\s,.!?;:\-()]{8,}/g;
    const matches = pdfContent.match(readablePattern);
    
    if (matches) {
      for (const match of matches) {
        const clean = match.trim();
        // Skip obvious PDF structure
        if (!clean.match(/^(obj|endobj|stream|endstream|xref|trailer)/i) && 
            !clean.match(/^\/[A-Z]/i) && 
            clean.split(' ').length > 2) {
          extractedTexts.push(clean);
        }
      }
    }
  }
  
  console.log('Extracted', extractedTexts.length, 'text segments');
  
  if (extractedTexts.length === 0) {
    throw new Error('No readable text found in PDF. The document may be image-based or encrypted.');
  }
  
  // Join and clean up the extracted text
  let result = extractedTexts.join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  console.log('Final text length:', result.length);
  
  if (result.length < 50) {
    throw new Error('Extracted text is too short. PDF may contain only images or be corrupted.');
  }
  
  return result;
}