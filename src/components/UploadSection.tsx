import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Upload, FileText, Link, X, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const UploadSection = () => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => 
      file.type === 'application/pdf' || 
      file.type.startsWith('text/') ||
      file.name.endsWith('.docx') ||
      file.name.endsWith('.txt')
    );
    
    if (validFiles.length !== files.length) {
      toast.error("Some files were skipped. Only PDF, DOC, DOCX, and TXT files are supported.");
    }
    
    setUploadedFiles(prev => [...prev, ...validFiles]);
    if (validFiles.length > 0) {
      toast.success(`${validFiles.length} file(s) uploaded successfully!`);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
    if (files.length > 0) {
      toast.success(`${files.length} file(s) uploaded successfully!`);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleWebsiteSubmit = () => {
    if (!websiteUrl) return;
    
    try {
      new URL(websiteUrl);
      toast.success("Website added for analysis!");
      setWebsiteUrl("");
    } catch {
      toast.error("Please enter a valid website URL");
    }
  };

  return (
    <section id="upload-section" className="py-20 px-6 lg:px-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Upload your documents or add a website
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Drag and drop files, or paste a URL. Our AI will analyze the content so you can ask questions about it.
          </p>
        </div>

        <div className="space-y-8">
          {/* File Upload Area */}
          <Card 
            className={`relative p-8 border-2 border-dashed transition-all duration-300 hover:shadow-medium ${
              isDragging 
                ? "border-primary bg-primary/5 shadow-glow" 
                : "border-border hover:border-primary/50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Drop files here or click to browse
                </h3>
                <p className="text-sm text-muted-foreground">
                  Supports PDF, DOC, DOCX, TXT files up to 10MB each
                </p>
              </div>

              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                className="mt-4"
              >
                Choose Files
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </Card>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <Card className="p-6">
              <h4 className="font-semibold text-foreground mb-4">Uploaded Files</h4>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        {file.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* URL Input */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Link className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Add Website URL</h4>
                  <p className="text-sm text-muted-foreground">
                    Paste a website link to analyze its content
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Input
                  placeholder="https://example.com/article"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleWebsiteSubmit}
                  disabled={!websiteUrl}
                  variant="default"
                >
                  Add Website
                </Button>
              </div>
            </div>
          </Card>

          {/* Start Analysis Button */}
          {(uploadedFiles.length > 0 || websiteUrl) && (
            <div className="text-center">
              <Button 
                variant="hero" 
                size="lg" 
                className="group"
                onClick={() => {
                  toast.success("Analysis started! Chat interface coming soon...");
                }}
              >
                Start asking questions
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};