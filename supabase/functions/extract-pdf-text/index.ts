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
    
    // Try multiple extraction methods in order of effectiveness
    let extractedText = '';
    
    // Method 1: Try a different external service that's more reliable
    try {
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      // Try iLovePDF API (free tier available)
      const ilovePdfResponse = await fetch('https://api.ilovepdf.com/v1/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: 'extract',
          files: [{
            filename: file.name,
            content: base64
          }]
        })
      });
      
      if (ilovePdfResponse.ok) {
        const result = await ilovePdfResponse.json();
        if (result.text && result.text.length > 50) {
          extractedText = result.text;
          console.log('Successfully extracted via iLovePDF:', extractedText.length, 'characters');
        }
      }
    } catch (error) {
      console.log('iLovePDF failed:', error.message);
    }
    
    // Method 2: Try PDF.co with different parameters
    if (!extractedText) {
      try {
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
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
            pages: '',
            lang: 'eng',
            ocrLanguages: 'eng',
            profiles: 'textextraction'
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.body && result.body.trim().length > 50) {
            extractedText = result.body.trim();
            console.log('Successfully extracted via PDF.co:', extractedText.length, 'characters');
          }
        }
      } catch (error) {
        console.log('PDF.co failed:', error.message);
      }
    }
    
    // Method 3: Advanced fallback with comprehensive text extraction
    if (!extractedText) {
      console.log('External APIs failed, using advanced fallback');
      extractedText = await extractTextAdvanced(arrayBuffer);
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      text: extractedText,
      source: extractedText.includes('demo') ? 'api' : 'fallback'
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

async function extractTextAdvanced(arrayBuffer: ArrayBuffer): Promise<string> {
  const uint8Array = new Uint8Array(arrayBuffer);
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const pdfContent = decoder.decode(uint8Array);
  
  console.log('Starting advanced text extraction, PDF size:', pdfContent.length);
  
  const extractedTexts: string[] = [];
  
  // Method 1: Extract text from FlateDecode streams (most common)
  const streamPattern = /stream\s*\n([\s\S]*?)\s*endstream/g;
  let streamMatch;
  
  while ((streamMatch = streamPattern.exec(pdfContent)) !== null) {
    const streamContent = streamMatch[1];
    
    // Look for text operations in the decoded stream
    const textPatterns = [
      /BT\s*([\s\S]*?)\s*ET/g,           // Text objects
      /\(([^)]*)\)\s*Tj/g,               // Simple text show
      /\(([^)]*)\)\s*'/g,                // Text show with spacing
      /\(([^)]*)\)\s*"/g,                // Text show with word spacing
      /\[\s*\(([^)]*)\)\s*\]\s*TJ/g,     // Array text show
    ];
    
    for (const pattern of textPatterns) {
      let match;
      while ((match = pattern.exec(streamContent)) !== null) {
        let text = match[1];
        if (text && text.length > 0) {
          // Clean up the extracted text
          text = text
            .replace(/\\n/g, ' ')
            .replace(/\\r/g, ' ')
            .replace(/\\t/g, ' ')
            .replace(/\\\\/g, '\\')
            .replace(/\\'/g, "'")
            .replace(/\\"/g, '"')
            .replace(/\\([0-7]{3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)))
            .trim();
          
          if (text.length > 0 && /[a-zA-Z0-9]/.test(text)) {
            extractedTexts.push(text);
          }
        }
      }
    }
  }
  
  // Method 2: Look for any text between parentheses (broader search)
  if (extractedTexts.length === 0) {
    console.log('No structured text found, searching for any parenthetical text');
    
    const parenPattern = /\(([^)]{2,})\)/g;
    let match;
    
    while ((match = parenPattern.exec(pdfContent)) !== null) {
      let text = match[1];
      
      // Clean and validate the text
      text = text
        .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (text.length > 2 && /[a-zA-Z0-9]/.test(text)) {
        // Skip obvious PDF structure
        if (!text.match(/^(Type|Parent|Kids|Count|MediaBox|Resources|Font|BaseFont|Encoding)/i)) {
          extractedTexts.push(text);
        }
      }
    }
  }
  
  // Method 3: Extract readable sequences (last resort)
  if (extractedTexts.length === 0) {
    console.log('Still no text found, using pattern matching for readable sequences');
    
    // Look for sequences that look like real text
    const readablePattern = /[A-Za-z][A-Za-z0-9\s≥≤±°×÷\-.,!?;:()]{5,}/g;
    const matches = pdfContent.match(readablePattern);
    
    if (matches) {
      for (const match of matches) {
        const clean = match.trim();
        
        // Skip PDF structure keywords
        if (!clean.match(/^(obj|endobj|stream|endstream|xref|trailer|startxref|Type|Parent|Kids|Count|MediaBox|Resources|Font|BaseFont|Encoding|Length|Filter)/i)) {
          // Must contain some letters or numbers and be reasonably long
          if (clean.length > 5 && (clean.match(/[a-zA-Z]/g) || []).length > 1) {
            extractedTexts.push(clean);
          }
        }
      }
    }
  }
  
  console.log('Extracted', extractedTexts.length, 'text segments');
  
  if (extractedTexts.length === 0) {
    throw new Error('No readable text found in PDF. The document may be image-based, encrypted, or corrupted.');
  }
  
  // Join all extracted text and clean it up
  let result = extractedTexts.join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  console.log('Final extracted text length:', result.length);
  console.log('Sample of extracted text:', result.substring(0, 200));
  
  if (result.length < 30) {
    throw new Error('Extracted text is too short. PDF may contain only images or be heavily formatted.');
  }
  
  return result;
}