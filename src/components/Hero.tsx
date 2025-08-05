import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Zap } from "lucide-react";
import heroImage from "@/assets/hero-illustration-new.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-hero overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-subtle opacity-60" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary-glow/5 rounded-full blur-3xl" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
                Ask questions about any
                <span className="bg-gradient-primary bg-clip-text text-transparent"> document</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                Upload documents or share website links, then chat with AI to get instant answers. 
                Private, secure, and designed for everyone—no AI experience needed.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 text-primary" />
                Privacy-first approach
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="w-4 h-4 text-primary" />
                Instant answers
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="hero" 
                size="lg" 
                className="group"
                onClick={() => {
                  const uploadSection = document.querySelector('#upload-section');
                  uploadSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Start analyzing documents
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-2"
                onClick={() => {
                  const featuresSection = document.querySelector('#features');
                  featuresSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Learn more
              </Button>
            </div>

            {/* Trust indicator */}
            <p className="text-sm text-muted-foreground">
              Everything stays private. No data stored online unless you choose.
            </p>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative z-10">
              <img
                src={heroImage}
                alt="Document analysis illustration"
                className="w-full max-w-lg mx-auto rounded-2xl shadow-large"
              />
            </div>
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-2xl blur-xl animate-pulse" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary-glow/10 rounded-2xl blur-xl animate-pulse delay-1000" />
          </div>
        </div>
      </div>
    </section>
  );
};