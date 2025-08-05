import { supabase } from "@/integrations/supabase/client";

interface ScrapeResponse {
  success: boolean;
  data?: {
    content: string;
    title?: string;
    url: string;
  };
  error?: string;
}

export class WebscrapeService {
  static hasApiKey(): boolean {
    // Since API key is now stored in Supabase secrets, always return true
    return true;
  }

  static async scrapeWebsite(url: string): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      console.log('Scraping website via edge function:', url);
      
      const { data, error } = await supabase.functions.invoke('scrape-website', {
        body: { url }
      });

      if (error) {
        console.error('Edge function error:', error);
        return { 
          success: false, 
          error: error.message || 'Failed to connect to scraping service' 
        };
      }

      const response = data as ScrapeResponse;
      
      if (!response.success) {
        return { 
          success: false, 
          error: response.error || 'Failed to scrape website' 
        };
      }

      console.log('Successfully scraped website:', response.data?.title || url);
      return { 
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error scraping website:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to website scraping service' 
      };
    }
  }
}