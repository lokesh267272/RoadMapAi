
import { useEffect, useState } from "react";
import DashboardComponent from "@/components/Dashboard";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";

const Dashboard = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [initialTabSet, setInitialTabSet] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      toast.error("Please sign in to view your dashboard");
      navigate("/auth");
      return;
    }
    
    // Set initialTabSet to true once we process the initial tab parameter
    if (tabParam && !initialTabSet) {
      setInitialTabSet(true);
    }
  }, [user, isLoading, navigate, tabParam, initialTabSet]);

  return (
    <div className="min-h-screen w-full pt-16 pb-8">
      <DashboardComponent initialTab={tabParam} />
    </div>
  );
};

export default Dashboard;
