import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Key, Check, X, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { AIService } from "@/utils/AIService";
import { WebscrapeService } from "@/utils/WebscrapeService";

export const ApiKeyManager = () => {
  const [openaiKey, setOpenaiKey] = useState("");
  const [firecrawlKey, setFirecrawlKey] = useState("");
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showFirecrawlKey, setShowFirecrawlKey] = useState(false);
  const [isTestingOpenai, setIsTestingOpenai] = useState(false);
  const [isTestingFirecrawl, setIsTestingFirecrawl] = useState(false);

  const hasOpenaiKey = AIService.hasApiKey();
  const hasFirecrawlKey = WebscrapeService.hasApiKey();

  const handleSaveOpenaiKey = async () => {
    if (!openaiKey.trim()) {
      toast.error("Please enter your OpenAI API key");
      return;
    }

    setIsTestingOpenai(true);
    const isValid = await AIService.testApiKey(openaiKey);
    
    if (isValid) {
      AIService.saveApiKey(openaiKey);
      toast.success("OpenAI API key saved successfully!");
      setOpenaiKey("");
    } else {
      toast.error("Invalid OpenAI API key. Please check and try again.");
    }
    setIsTestingOpenai(false);
  };

  const handleSaveFirecrawlKey = async () => {
    if (!firecrawlKey.trim()) {
      toast.error("Please enter your Firecrawl API key");
      return;
    }

    setIsTestingFirecrawl(true);
    const isValid = await WebscrapeService.testApiKey(firecrawlKey);
    
    if (isValid) {
      WebscrapeService.saveApiKey(firecrawlKey);
      toast.success("Firecrawl API key saved successfully!");
      setFirecrawlKey("");
    } else {
      toast.error("Invalid Firecrawl API key. Please check and try again.");
    }
    setIsTestingFirecrawl(false);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Key className="w-4 h-4" />
          API Keys
          {(hasOpenaiKey || hasFirecrawlKey) && (
            <div className="w-2 h-2 bg-green-500 rounded-full" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configure API Keys</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* OpenAI API Key */}
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-foreground">OpenAI API Key</h4>
                {hasOpenaiKey ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <Check className="w-4 h-4" />
                    <span className="text-xs">Configured</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <X className="w-4 h-4" />
                    <span className="text-xs">Not set</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Required for AI-powered document analysis and Q&A
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showOpenaiKey ? "text" : "password"}
                    placeholder="sk-..."
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-6 w-6 p-0"
                    onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                  >
                    {showOpenaiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                </div>
                <Button 
                  onClick={handleSaveOpenaiKey}
                  disabled={isTestingOpenai || !openaiKey.trim()}
                  size="sm"
                >
                  {isTestingOpenai ? "Testing..." : "Save"}
                </Button>
              </div>
            </div>
          </Card>

          {/* Firecrawl API Key */}
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-foreground">Firecrawl API Key</h4>
                {hasFirecrawlKey ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <Check className="w-4 h-4" />
                    <span className="text-xs">Configured</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <X className="w-4 h-4" />
                    <span className="text-xs">Not set</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Required for website content extraction and analysis
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showFirecrawlKey ? "text" : "password"}
                    placeholder="fc-..."
                    value={firecrawlKey}
                    onChange={(e) => setFirecrawlKey(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-6 w-6 p-0"
                    onClick={() => setShowFirecrawlKey(!showFirecrawlKey)}
                  >
                    {showFirecrawlKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                </div>
                <Button 
                  onClick={handleSaveFirecrawlKey}
                  disabled={isTestingFirecrawl || !firecrawlKey.trim()}
                  size="sm"
                >
                  {isTestingFirecrawl ? "Testing..." : "Save"}
                </Button>
              </div>
            </div>
          </Card>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• API keys are stored locally in your browser</p>
            <p>• Get OpenAI key: <a href="https://platform.openai.com/api-keys" target="_blank" className="text-primary hover:underline">platform.openai.com</a></p>
            <p>• Get Firecrawl key: <a href="https://firecrawl.dev" target="_blank" className="text-primary hover:underline">firecrawl.dev</a></p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};