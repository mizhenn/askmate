import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { UploadSection } from "@/components/UploadSection";
import { Features } from "@/components/Features";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <UploadSection />
      <Features />
    </div>
  );
};

export default Index;
