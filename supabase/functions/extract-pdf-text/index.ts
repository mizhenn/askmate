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
