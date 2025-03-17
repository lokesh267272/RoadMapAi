
import { AlertCircle } from "lucide-react";
import { FC } from "react";

interface ErrorDisplayProps {
  error: string | null;
}

const ErrorDisplay: FC<ErrorDisplayProps> = ({ error }) => {
  if (!error) return null;

  return (
    <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 flex items-start gap-2">
      <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
      <div className="text-sm text-destructive">{error}</div>
    </div>
  );
};

export default ErrorDisplay;
