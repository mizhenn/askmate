import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, User, FileText, Link, Sparkles } from "lucide-react";
import { toast } from "sonner";

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

export const Chat = ({ uploadedFiles, websiteUrl }: ChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Welcome message when chat starts
  useEffect(() => {
    const welcomeMessage: Message = {
      id: "welcome",
      content: `Hi! I've analyzed your ${uploadedFiles.length > 0 ? `${uploadedFiles.length} document(s)` : ''} ${uploadedFiles.length > 0 && websiteUrl ? 'and ' : ''} ${websiteUrl ? 'website' : ''}. Ask me anything about the content, and I'll give you clear, accurate answers based on what you've shared.`,
      sender: 'assistant',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [uploadedFiles, websiteUrl]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Simulate AI response (replace with actual AI integration)
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateAIResponse(userMessage.content),
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const generateAIResponse = (question: string): string => {
    // This is a mock response - replace with actual AI integration
    const responses = [
      "Based on the document you uploaded, here's what I found...",
      "Great question! According to the content you shared, the answer is...",
      "I can see this information in your document. Let me explain...",
      "From the website you provided, I found relevant information about this topic...",
      "That's an interesting point. The document mentions..."
    ];
    return responses[Math.floor(Math.random() * responses.length)] + " This is a demo response. In the full version, I would analyze your actual documents and provide specific answers based on their content.";
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
            {uploadedFiles.length > 0 && (
              <div className="flex items-center gap-1 px-3 py-1 bg-primary/10 rounded-full">
                <FileText className="w-3 h-3 text-primary" />
                <span className="text-xs text-primary font-medium">{uploadedFiles.length} docs</span>
              </div>
            )}
            {websiteUrl && (
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