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

    const systemPrompt = `You are a helpful assistant that answers questions about ${contentType}s. 
      You should provide accurate, helpful answers based only on the provided content. 
      If the question cannot be answered from the content, say so clearly.
      Keep your answers concise but informative.`;

    const userPrompt = `Based on this ${contentType} content:

${context}

Question: ${question}

Please provide a clear, accurate answer based only on the content above.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
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