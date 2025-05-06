
import { Loader2 } from "lucide-react";

const TutorLoading = () => {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="sr-only">Loading tutor content...</span>
    </div>
  );
};

export default TutorLoading;
