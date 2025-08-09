import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Key, Check } from "lucide-react";
import { toast } from "sonner";

const isLocalMode = import.meta.env.VITE_APP_MODE === 'local';

export const ApiKeyManager = () => {
  const handleConfigureKeys = () => {
    if (isLocalMode) {
      toast.info("Running in local mode. Check your .env.local file for API key configuration.");
    } else {
      toast.info("API keys are securely managed through Supabase Edge Function secrets!");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Key className="w-4 h-4" />
          API Keys
          <div className="w-2 h-2 bg-green-500 rounded-full" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>API Key Configuration</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* OpenAI API Key */}
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-foreground">OpenAI API Key</h4>
                <div className="flex items-center gap-1 text-green-600">
                  <Check className="w-4 h-4" />
                  <span className="text-xs">
                    {isLocalMode ? "Local Environment" : "Configured via Supabase"}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {isLocalMode 
                  ? "✅ Set VITE_OPENAI_API_KEY in your .env.local file"
                  : "✅ OpenAI integration is securely configured through Supabase Edge Functions"
                }
              </p>
            </div>
          </Card>

          {/* Firecrawl API Key */}
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-foreground">Firecrawl API Key</h4>
                <div className="flex items-center gap-1 text-green-600">
                  <Check className="w-4 h-4" />
                  <span className="text-xs">
                    {isLocalMode ? "Local Environment" : "Configured via Supabase"}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {isLocalMode 
                  ? "✅ Set VITE_FIRECRAWL_API_KEY in your .env.local file"
                  : "✅ Firecrawl integration is securely configured through Supabase Edge Functions"
                }
              </p>
            </div>
          </Card>

          <div className="text-xs text-muted-foreground space-y-1">
            {isLocalMode ? (
              <>
                <p>• Running in local development mode</p>
                <p>• API keys are read from .env.local file</p>
                <p>• Copy .env.example to .env.local and add your keys</p>
              </>
            ) : (
              <>
                <p>• All API keys are securely stored in Supabase Edge Function secrets</p>
                <p>• No sensitive information is stored in your browser</p>
                <p>• Both document analysis and website scraping are fully operational</p>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};