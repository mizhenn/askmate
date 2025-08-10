import { Button } from "@/components/ui/button";
import { FileQuestion, Menu, X, User, LogOut } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
// import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "./ThemeToggle";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";

export const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <FileQuestion className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground font-heading">AskMate</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How it works
            </a>
            <ThemeToggle />
            {/* {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    {user.email}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/auth")}
                >
                  Sign in
                </Button> */}
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    const uploadSection = document.querySelector('#upload-section');
                    uploadSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Get started
                </Button>
              {/* </>
            )} */}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                How it works
              </a>
               <div className="flex flex-col gap-2 pt-2">
                 {/* {user ? (
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => {
                       signOut();
                       setIsMenuOpen(false);
                     }}
                   >
                     <LogOut className="w-4 h-4 mr-2" />
                     Sign out
                   </Button>
                 ) : (
                   <>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => {
                         navigate("/auth");
                         setIsMenuOpen(false);
                       }}
                     >
                       Sign in
                     </Button> */}
                     <Button
                       variant="default"
                       size="sm"
                       onClick={() => {
                         const uploadSection = document.querySelector('#upload-section');
                         uploadSection?.scrollIntoView({ behavior: 'smooth' });
                         setIsMenuOpen(false);
                       }}
                     >
                       Get started
                     </Button>
                   {/* </>
                 )} */}
               </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};