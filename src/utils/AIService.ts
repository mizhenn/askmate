import { supabase } from '@/integrations/supabase/client';

export class AIService {
  static async answerQuestion(
    question: string, 
    context: string, 
    contentType: 'document' | 'website' = 'document'
  ): Promise<{ success: boolean; answer?: string; error?: string }> {
    try {
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
    } catch (error) {
      console.error('Error getting AI answer:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get AI response' 
      };
    }
  }
}