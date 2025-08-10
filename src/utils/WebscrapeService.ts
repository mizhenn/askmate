import { supabase } from "@/integrations/supabase/client";

const isLocalMode = import.meta.env.VITE_APP_MODE === 'local';
const FIRECRAWL_API_KEY = import.meta.env.VITE_FIRECRAWL_API_KEY;

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
    if (isLocalMode) {
      return !!FIRECRAWL_API_KEY;
    }
    // In production, API key is stored in Supabase secrets
    return true;
  }

  static async scrapeWebsite(url: string): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      if (isLocalMode) {
        return await this.scrapeWebsiteLocal(url);
      } else {
        return await this.scrapeWebsiteSupabase(url);
      }
    } catch (error) {
      console.error('Error scraping website:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to website scraping service' 
      };
    }
  }

  private static async scrapeWebsiteSupabase(url: string) {
    
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

    return {
      success: true,
      data: response.data
    };
  }

  private static async scrapeWebsiteLocal(url: string) {
    if (!FIRECRAWL_API_KEY) {
      throw new Error('Firecrawl API key not found. Please add VITE_FIRECRAWL_API_KEY to your .env.local file.');
    }

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        includeTags: ['title'],
        onlyMainContent: true
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Firecrawl API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to scrape website');
    }

    const scrapedData = {
      content: data.data?.markdown || data.data?.html || '',
      title: data.data?.metadata?.title || '',
      url: data.data?.metadata?.sourceURL || url
    };

    return {
      success: true,
      data: scrapedData
    };
  }
}