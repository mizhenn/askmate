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
  
  // Look for text within PDF content streams
  const extractedText: string[] = [];
  
  // Method 1: Look for content between BT (Begin Text) and ET (End Text) markers
  const textObjectMatches = text.match(/BT\s*([\s\S]*?)\s*ET/g);
  if (textObjectMatches) {
    for (const match of textObjectMatches) {
      const content = match.replace(/^BT\s*/, '').replace(/\s*ET$/, '');
      // Look for text strings in parentheses or brackets
      const stringMatches = content.match(/\((.*?)\)/g) || content.match(/\[(.*?)\]/g);
      if (stringMatches) {
        for (const str of stringMatches) {
          const cleanStr = str.replace(/[\(\)\[\]]/g, '').trim();
          if (cleanStr.length > 2 && /[a-zA-Z]/.test(cleanStr)) {
            extractedText.push(cleanStr);
          }
        }
      }
    }
  }
  
  // Method 2: Look for Tj and TJ operators (show text)
  const tjMatches = text.match(/\((.*?)\)\s*Tj/g);
  if (tjMatches) {
    for (const match of tjMatches) {
      const content = match.replace(/\s*Tj$/, '').replace(/^\(/, '').replace(/\)$/, '');
      if (content.length > 2 && /[a-zA-Z]/.test(content)) {
        extractedText.push(content);
      }
    }
  }
  
  // Method 3: Look for readable text patterns (fallback)
  if (extractedText.length === 0) {
    const segments = text.split(/[\r\n]+/);
    
    for (const segment of segments) {
      const cleanText = segment
        .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Only keep segments that look like real text
      if (cleanText.length > 5 && /[a-zA-Z]/.test(cleanText) && cleanText.split(' ').length > 1) {
        // Filter out PDF structure elements
        if (!cleanText.match(/^(obj|endobj|stream|endstream|xref|trailer|startxref|\/Type|\/Font|\/Page|<<|>>)/i)) {
          extractedText.push(cleanText);
        }
      }
    }
  }
  
  const result = extractedText.join(' ').trim();
  
  if (result.length < 50) {
    throw new Error('Unable to extract readable text from this PDF. It may be image-based or heavily formatted.');
  }
  
  return result;
}
