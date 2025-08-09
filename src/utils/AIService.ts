import { supabase } from '@/integrations/supabase/client';

const isLocalMode = import.meta.env.VITE_APP_MODE === 'local';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export class AIService {
  static async answerQuestion(
    question: string, 
    context: string, 
    contentType: 'document' | 'website' = 'document'
  ): Promise<{ success: boolean; answer?: string; error?: string }> {
    try {
      if (isLocalMode) {
        return await this.answerQuestionLocal(question, context, contentType);
      } else {
        return await this.answerQuestionSupabase(question, context, contentType);
      }
    } catch (error) {
      console.error('Error getting AI answer:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get AI response' 
      };
    }
  }

  private static async answerQuestionSupabase(
    question: string, 
    context: string, 
    contentType: 'document' | 'website'
  ) {
    const { data, error } = await supabase.functions.invoke('answer-question', {
      body: {
        question,
        context,
        contentType
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  private static async answerQuestionLocal(
    question: string, 
    context: string, 
    contentType: 'document' | 'website'
  ) {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not found. Please add VITE_OPENAI_API_KEY to your .env.local file.');
    }

    const systemPrompt = contentType === 'website' 
      ? "You are a helpful assistant that answers questions based on website content. Provide accurate, helpful responses based on the provided context. If the context doesn't contain enough information to answer the question, say so clearly."
      : "You are a helpful assistant that answers questions based on document content. Provide accurate, helpful responses based on the provided context. If the context doesn't contain enough information to answer the question, say so clearly.";

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Context: ${context}\n\nQuestion: ${question}` }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;

    if (!answer) {
      throw new Error('No answer received from OpenAI');
    }

    return { success: true, answer };
  }
}