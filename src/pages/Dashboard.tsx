
import { useEffect, useState } from "react";
import DashboardComponent from "@/components/Dashboard";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        toast.error("Please sign in to view your dashboard");
        navigate("/auth");
      }
      // Add a small delay to allow components to initialize
      const timer = setTimeout(() => {
        setIsPageLoading(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [user, authLoading, navigate]);

  if (authLoading || isPageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-10">
      <DashboardComponent />
    </div>
  );
};

export default Dashboard;
