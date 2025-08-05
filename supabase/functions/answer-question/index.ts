import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { question, context, contentType = 'document' } = await req.json();

    if (!question || !context) {
      throw new Error('Question and context are required');
    }

    // Truncate context if it's too long to avoid token limits
    const maxContextLength = 15000; // Conservative limit to stay under 30k tokens
    let truncatedContext = context;
    
    if (context.length > maxContextLength) {
      console.log(`Context too long (${context.length} chars), truncating to ${maxContextLength}`);
      // Keep the beginning and end of the context for better analysis
      const halfLength = maxContextLength / 2;
      truncatedContext = context.substring(0, halfLength) + 
        "\n\n[... content truncated for length ...]\n\n" + 
        context.substring(context.length - halfLength);
    }

    const systemPrompt = `You are an intelligent document analysis assistant. Your task is to provide accurate, detailed answers based ONLY on the content provided to you.

IMPORTANT INSTRUCTIONS:
- Read the content carefully and thoroughly
- Answer questions directly and specifically based on what you find
- If you see numbers, dates, symbols (like ≥, ≤, etc.), or specific text, mention them explicitly
- Be precise and quote relevant parts when answering
- If information exists in the document, provide it confidently
- Only say you cannot find information if it's truly not present in the content
- Look for patterns, numbers, mathematical expressions, dates, and technical terms
- Pay special attention to numerical values, ranges, and mathematical symbols`;

    const userPrompt = `Here is the ${contentType} content to analyze:

=== DOCUMENT CONTENT ===
${truncatedContext}
=== END CONTENT ===

User Question: ${question}

Please provide a thorough, accurate answer based on the content above. If you find relevant information, quote it directly. Be specific about numbers, dates, symbols, or any technical terms you see.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',  // Using mini model to reduce token usage and costs
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1000,  // Reduced tokens to stay within limits
        temperature: 0.1,  // Lower temperature for more factual responses
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to get AI response');
    }

    const data = await response.json();
    const answer = data.choices[0]?.message?.content;

    if (!answer) {
      throw new Error('No answer received from AI');
    }

    return new Response(JSON.stringify({ success: true, answer }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in answer-question function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Failed to get AI response' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});