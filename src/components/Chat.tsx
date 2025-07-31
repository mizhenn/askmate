import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, User, FileText, Link, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { DocumentProcessor } from "@/utils/DocumentProcessor";
import { WebscrapeService } from "@/utils/WebscrapeService";
import { AIService } from "@/utils/AIService";
import { ApiKeyManager } from "./ApiKeyManager";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatProps {
  uploadedFiles: File[];
  websiteUrl?: string;
}

interface ProcessedContent {
  documents: Array<{ name: string; content: string; summary: string }>;
  website?: { url: string; content: string; title?: string };
}

export const Chat = ({ uploadedFiles, websiteUrl }: ChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedContent, setProcessedContent] = useState<ProcessedContent>({ documents: [] });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Process documents and website content when component mounts
  useEffect(() => {
    processContent();
  }, [uploadedFiles, websiteUrl]);

  const processContent = async () => {
    setIsProcessing(true);
    const processed: ProcessedContent = { documents: [] };

    try {
      // Process uploaded documents
      for (const file of uploadedFiles) {
        try {
          const content = await DocumentProcessor.extractTextFromFile(file);
          const summary = DocumentProcessor.summarizeText(content);
          processed.documents.push({
            name: file.name,
            content,
            summary
          });
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          toast.error(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Process website content
      if (websiteUrl) {
        try {
          const result = await WebscrapeService.scrapeWebsite(websiteUrl);
          if (result.success && result.data) {
            processed.website = {
              url: websiteUrl,
              content: result.data.content,
              title: result.data.title
            };
          } else {
            toast.error(`Failed to scrape website: ${result.error}`);
          }
        } catch (error) {
          console.error('Error scraping website:', error);
          toast.error('Failed to scrape website content');
        }
      }

      setProcessedContent(processed);

      // Generate welcome message based on processed content
      const welcomeContent = generateWelcomeMessage(processed);
      const welcomeMessage: Message = {
        id: "welcome",
        content: welcomeContent,
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);

    } catch (error) {
      console.error('Error processing content:', error);
      toast.error('Failed to process content');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateWelcomeMessage = (content: ProcessedContent): string => {
    let message = "Hi! I've analyzed your content:\n\n";
    
    if (content.documents.length > 0) {
      message += `📄 **Documents (${content.documents.length}):**\n`;
      content.documents.forEach(doc => {
        message += `• ${doc.name}\n`;
      });
      message += "\n";
    }

    if (content.website) {
      message += `🌐 **Website:** ${content.website.title || content.website.url}\n\n`;
    }

    message += "Ask me anything about the content, and I'll provide accurate answers based on what I've analyzed!";
    return message;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Check if AI service is configured
    if (!AIService.hasApiKey()) {
      toast.error("Please configure your OpenAI API key first to use AI features.");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Combine all processed content for context
      let context = "";
      
      if (processedContent.documents.length > 0) {
        context += "Documents:\n";
        processedContent.documents.forEach(doc => {
          context += `\n--- ${doc.name} ---\n${doc.content}\n`;
        });
      }

      if (processedContent.website) {
        context += `\n\nWebsite (${processedContent.website.url}):\n${processedContent.website.content}`;
      }

      if (!context.trim()) {
        throw new Error("No content available to answer questions about.");
      }

      const result = await AIService.answerQuestion(
        userMessage.content, 
        context,
        processedContent.website ? 'website' : 'document'
      );

      if (result.success && result.answer) {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: result.answer,
          sender: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiResponse]);
      } else {
        throw new Error(result.error || 'Failed to get AI response');
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to get AI response');
    } finally {
      setIsLoading(false);
    }
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "What are the main points in this document?",
    "Can you summarize the key findings?",
    "What does this say about...?",
    "Are there any important dates or numbers mentioned?"
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* API Key Manager */}
      {(!AIService.hasApiKey() || !WebscrapeService.hasApiKey()) && (
        <Card className="p-4 mb-6 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-amber-800">API Keys Required</h4>
              <p className="text-sm text-amber-700 mt-1">
                Configure your API keys to enable document analysis and website scraping.
              </p>
              <div className="mt-3">
                <ApiKeyManager />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <Card className="p-6 mb-6 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
            <div>
              <p className="font-medium text-foreground">Processing your content...</p>
              <p className="text-sm text-muted-foreground">
                Extracting text from documents and analyzing website content
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Chat Header */}
      <Card className="p-6 mb-6 bg-gradient-subtle border-primary/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">AI Document Assistant</h3>
            <p className="text-sm text-muted-foreground">
              Ask questions about your {uploadedFiles.length > 0 && `${uploadedFiles.length} uploaded file(s)`}
              {uploadedFiles.length > 0 && websiteUrl && ' and '}
              {websiteUrl && 'website content'}
            </p>
          </div>
          <div className="flex gap-2">
            <ApiKeyManager />
            {processedContent.documents.length > 0 && (
              <div className="flex items-center gap-1 px-3 py-1 bg-primary/10 rounded-full">
                <FileText className="w-3 h-3 text-primary" />
                <span className="text-xs text-primary font-medium">{processedContent.documents.length} docs</span>
              </div>
            )}
            {processedContent.website && (
              <div className="flex items-center gap-1 px-3 py-1 bg-primary/10 rounded-full">
                <Link className="w-3 h-3 text-primary" />
                <span className="text-xs text-primary font-medium">Website</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Messages Container */}
      <Card className="mb-6 border-border">
        <div className="h-96 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.sender === 'assistant' && (
                <Avatar className="w-8 h-8 bg-primary/10">
                  <AvatarFallback className="bg-primary/10">
                    <Bot className="w-4 h-4 text-primary" />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div
                className={`max-w-[70%] p-3 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-gradient-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {message.sender === 'user' && (
                <Avatar className="w-8 h-8 bg-muted">
                  <AvatarFallback className="bg-muted">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <Avatar className="w-8 h-8 bg-primary/10">
                <AvatarFallback className="bg-primary/10">
                  <Bot className="w-4 h-4 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-secondary p-3 rounded-2xl">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-100"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-200"></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </Card>

      {/* Suggested Questions */}
      {messages.length === 1 && (
        <Card className="p-4 mb-6 bg-muted/30">
          <p className="text-sm font-medium text-foreground mb-3">Try asking:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {suggestedQuestions.map((question, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="justify-start text-left h-auto p-2 text-muted-foreground hover:text-foreground"
                onClick={() => setInputValue(question)}
              >
                {question}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Chat Input */}
      <Card className="p-4">
        <div className="flex gap-3">
          <Input
            placeholder="Ask a question about your document or website..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="sm"
            className="px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </Card>
    </div>
  );
};