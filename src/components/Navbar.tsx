
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, Calendar, Menu, Target, X, User, LogOut, MessageSquare, Mic } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Check if user is on landing page
  const isLandingPage = location.pathname === "/";
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out");
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || !isLandingPage
          ? "bg-glass shadow-sm py-2"
          : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link 
          to="/" 
          className="flex items-center gap-2 transition-transform hover:scale-105"
        >
          <Brain className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">LearningPath</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            to="/" 
            className={`text-foreground/80 hover:text-foreground transition-colors ${
              location.pathname === "/" ? "font-medium text-foreground" : ""
            }`}
          >
            Home
          </Link>
          <Link 
            to="/dashboard" 
            className={`text-foreground/80 hover:text-foreground transition-colors ${
              location.pathname === "/dashboard" ? "font-medium text-foreground" : ""
            }`}
          >
            Dashboard
          </Link>
          <Link 
            to="/dashboard?tab=progress" 
            className={`text-foreground/80 hover:text-foreground transition-colors ${
              location.pathname === "/dashboard" && location.search.includes("tab=progress") ? "font-medium text-foreground" : ""
            }`}
          >
            Progress
          </Link>
          <Link 
            to="/ai-tutor" 
            className={`text-foreground/80 hover:text-foreground transition-colors ${
              location.pathname.startsWith("/ai-tutor") ? "font-medium text-foreground" : ""
            }`}
          >
            <MessageSquare className="h-4 w-4 mr-1 inline" />
            AI Tutor
          </Link>
          <Link 
            to="/voice-agent" 
            className={`text-foreground/80 hover:text-foreground transition-colors ${
              location.pathname === "/voice-agent" ? "font-medium text-foreground" : ""
            }`}
          >
            <Mic className="h-4 w-4 mr-1 inline" />
            Voice Agent
          </Link>
          {user ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/dashboard">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          ) : (
            isLandingPage ? (
              <Button asChild className="animate-fadeInUp shadow-md">
                <Link to="/auth">Get Started</Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link to="/auth">Sign In</Link>
              </Button>
            )
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden flex items-center text-foreground"
          onClick={toggleMenu}
          aria-label="Toggle Menu"
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-glass shadow-lg md:hidden animate-fadeInDown">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <Link
              to="/"
              className="py-2 text-foreground/80 hover:text-foreground transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/dashboard"
              className="py-2 text-foreground/80 hover:text-foreground transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              to="/dashboard?tab=progress"
              className="py-2 text-foreground/80 hover:text-foreground transition-colors flex items-center gap-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <Target className="h-4 w-4" />
              Progress
            </Link>
            <Link
              to="/ai-tutor"
              className="py-2 text-foreground/80 hover:text-foreground transition-colors flex items-center gap-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <MessageSquare className="h-4 w-4" />
              AI Tutor
            </Link>
            <Link
              to="/voice-agent"
              className="py-2 text-foreground/80 hover:text-foreground transition-colors flex items-center gap-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <Mic className="h-4 w-4" />
              Voice Agent
            </Link>
            {user ? (
              <>
                <Button 
                  asChild 
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Link to="/dashboard">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Link>
                </Button>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Button 
                asChild 
                className="w-full"
                onClick={() => setIsMenuOpen(false)}
              >
                <Link to="/auth">Get Started</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
