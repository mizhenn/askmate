import { Shield, Zap, Users, Download } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your documents stay private. Choose local processing or secure cloud analysis—you're always in control.",
    highlight: "100% Private"
  },
  {
    icon: Zap,
    title: "Instant Answers",
    description: "Get clear, accurate responses in seconds. No need to search through pages—just ask and get answers.",
    highlight: "Lightning Fast"
  },
  {
    icon: Users,
    title: "Made for Everyone",
    description: "Designed for employees who aren't tech experts. Simple, intuitive, and feels like talking to a helpful colleague.",
    highlight: "User Friendly"
  },
  {
    icon: Download,
    title: "Works Offline",
    description: "Coming soon: Run everything locally on your computer. No internet required, complete data privacy.",
    highlight: "Local Mode"
  }
];

export const Features = () => {
  return (
    <section className="py-20 px-6 lg:px-8 bg-gradient-subtle">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Built for privacy and simplicity
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            We designed this tool specifically for employees who want to understand documents better, 
            without worrying about data privacy or complex AI interfaces.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="p-6 hover:shadow-medium transition-all duration-300 hover:scale-[1.02] bg-background border-border"
            >
              <div className="space-y-4">
                {/* Icon */}
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>

                {/* Highlight badge */}
                <div className="inline-block">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                    {feature.highlight}
                  </span>
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Privacy callout */}
        <div className="mt-16 text-center">
          <Card className="p-8 bg-primary/5 border-primary/20 max-w-3xl mx-auto">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                Your privacy is our priority
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Unlike other AI tools, we're building this specifically for employees who are concerned 
                about data privacy. Local processing means your sensitive documents never leave your computer.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};