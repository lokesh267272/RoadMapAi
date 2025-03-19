
import { useEffect, useState } from "react";
import DashboardComponent from "@/components/Dashboard";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [isPageLoading, setIsPageLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        toast.error("Please sign in to view your dashboard");
        navigate("/auth");
      } else {
        // Give a little time to load components
        const timer = setTimeout(() => {
          setIsPageLoading(false);
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [user, authLoading, navigate]);

  return (
    <div className="min-h-screen pt-20 pb-10">
      {isPageLoading || authLoading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>
      ) : (
        <DashboardComponent />
      )}
    </div>
  );
};

export default Dashboard;
