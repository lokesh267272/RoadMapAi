
import { Card, CardContent } from "@/components/ui/card";
import AuthForm from "@/components/AuthForm";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const Auth = () => {
  const { user, isLoading } = useAuth();

  // Redirect if user is already logged in
  if (user && !isLoading) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-32">
      <AuthForm />
    </div>
  );
};

export default Auth;
