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

    // Convert file to base64 for external API
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Use an external PDF processing service
    const response = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'demo' // Using demo key - user should replace with their own
      },
      body: JSON.stringify({
        url: `data:application/pdf;base64,${base64}`,
        inline: true
      })
    });

    if (!response.ok) {
      // Fallback: simple text extraction
      const text = await extractTextFallback(arrayBuffer);
      return new Response(JSON.stringify({ 
        success: true, 
        text: text,
        source: 'fallback'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await response.json();
    
    if (result.body && result.body.length > 20) {
      return new Response(JSON.stringify({ 
        success: true, 
        text: result.body,
        source: 'api'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If API extraction failed, use fallback
    const fallbackText = await extractTextFallback(arrayBuffer);
    
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

async function extractTextFallback(arrayBuffer: ArrayBuffer): Promise<string> {
  const uint8Array = new Uint8Array(arrayBuffer);
  const decoder = new TextDecoder('utf-8', { fatal: false });
  let rawText = decoder.decode(uint8Array);
  
  console.log('PDF raw text length:', rawText.length);
  
  // Method 1: Extract text from content streams using more aggressive parsing
  const extractedTexts: string[] = [];
  
  // Look for actual readable text between stream boundaries
  const streamMatches = rawText.match(/stream\s*\n([\s\S]*?)\s*endstream/gi);
  if (streamMatches) {
    console.log('Found', streamMatches.length, 'content streams');
    
    for (const stream of streamMatches) {
      const content = stream.replace(/^stream\s*\n/i, '').replace(/\s*endstream$/i, '');
      
      // Try to find text operations in the stream
      const textOperations = [
        /\((.*?)\)\s*Tj/g,           // Simple text show
        /\[(.*?)\]\s*TJ/g,          // Array text show  
        /\((.*?)\)\s*'/g,           // Text with quote
        /\((.*?)\)\s*"/g,           // Text with double quote
        /"(.*?)"/g,                 // Quoted strings
        /'(.*?)'/g                  // Single quoted strings
      ];
      
      for (const regex of textOperations) {
        let match;
        while ((match = regex.exec(content)) !== null) {
          let text = match[1];
          if (text && text.length > 1) {
            // Clean up escaped characters
            text = text
              .replace(/\\n/g, ' ')
              .replace(/\\r/g, ' ')
              .replace(/\\t/g, ' ')
              .replace(/\\\\/g, '\\')
              .replace(/\\'/g, "'")
              .replace(/\\"/g, '"')
              .trim();
            
            if (text.length > 2 && /[a-zA-Z]/.test(text)) {
              extractedTexts.push(text);
            }
          }
        }
      }
    }
  }
  
  // Method 2: Look for readable text patterns in the entire document
  if (extractedTexts.length === 0) {
    console.log('No text found in streams, trying direct extraction');
    
    // Split by lines and look for readable content
    const lines = rawText.split(/[\r\n]+/);
    
    for (const line of lines) {
      // Clean the line and keep only printable characters
      let cleanLine = line
        .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Skip PDF structure elements
      if (cleanLine.match(/^(obj|endobj|stream|endstream|xref|trailer|startxref|\/[A-Z]|<<|>>|\d+\s+\d+\s+R)/i)) {
        continue;
      }
      
      // Keep lines that look like real text
      if (cleanLine.length > 5 && /[a-zA-Z]/.test(cleanLine)) {
        const words = cleanLine.split(/\s+/);
        if (words.length > 1 && words.some(word => word.length > 3)) {
          extractedTexts.push(cleanLine);
        }
      }
    }
  }
  
  // Method 3: Last resort - look for any readable strings
  if (extractedTexts.length === 0) {
    console.log('Still no text found, trying string extraction');
    
    const stringMatches = rawText.match(/[a-zA-Z][a-zA-Z0-9\s,.!?;:()]{10,}/g);
    if (stringMatches) {
      for (const str of stringMatches) {
        const clean = str.trim();
        if (clean.length > 10 && clean.split(/\s+/).length > 2) {
          extractedTexts.push(clean);
        }
      }
    }
  }
  
  console.log('Extracted', extractedTexts.length, 'text segments');
  
  const result = extractedTexts.join(' ').trim();
  
  if (result.length < 50) {
    console.log('Final result too short:', result.length, 'characters');
    throw new Error('Unable to extract readable text from this PDF. The document may be image-based, encrypted, or heavily formatted.');
  }
  
  console.log('Successfully extracted', result.length, 'characters of text');
  return result;
}
