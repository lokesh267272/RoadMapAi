
import { useEffect } from "react";
import DashboardComponent from "@/components/Dashboard";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      toast.error("Please sign in to view your dashboard");
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen pt-16 pb-8 px-2 sm:px-4 max-w-screen-xl mx-auto">
      <DashboardComponent />
    </div>
  );
};

export default Dashboard;
