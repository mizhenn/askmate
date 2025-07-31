export class AIService {
  private static OPENAI_API_KEY_STORAGE_KEY = 'openai_api_key';

  static saveApiKey(apiKey: string): void {
    localStorage.setItem(this.OPENAI_API_KEY_STORAGE_KEY, apiKey);
  }

  static getApiKey(): string | null {
    return localStorage.getItem(this.OPENAI_API_KEY_STORAGE_KEY);
  }

  static hasApiKey(): boolean {
    return !!this.getApiKey();
  }

  static async testApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Error testing OpenAI API key:', error);
      return false;
    }
  }

  static async answerQuestion(
    question: string, 
    context: string, 
    contentType: 'document' | 'website' = 'document'
  ): Promise<{ success: boolean; answer?: string; error?: string }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { 
        success: false, 
        error: 'OpenAI API key not found. Please set your API key first.' 
      };
    }

    try {
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
          'Authorization': `Bearer ${apiKey}`,
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

      return { success: true, answer };
    } catch (error) {
      console.error('Error getting AI answer:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get AI response' 
      };
    }
  }
}