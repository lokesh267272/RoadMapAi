
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
      }
      setIsPageLoading(false);
    }
  }, [user, authLoading, navigate]);

  if (isPageLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
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
