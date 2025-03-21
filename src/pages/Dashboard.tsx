
import { useEffect } from "react";
import DashboardComponent from "@/components/Dashboard";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";

const Dashboard = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");

  useEffect(() => {
    if (!isLoading && !user) {
      toast.error("Please sign in to view your dashboard");
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen w-full pt-16 pb-8">
      <DashboardComponent initialTab={tabParam} />
    </div>
  );
};

export default Dashboard;
