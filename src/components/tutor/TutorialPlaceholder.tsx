
import { BookOpen } from "lucide-react";

const TutorialPlaceholder = () => {
  return (
    <div className="text-center text-muted-foreground p-6 sm:p-12 flex flex-col items-center justify-center h-64">
      <BookOpen className="w-8 sm:w-10 h-8 sm:h-10 mb-3 sm:mb-4 text-muted-foreground/60" />
      <p className="text-base sm:text-lg font-medium mb-2">No topic selected</p>
      <p>Select a topic to view the tutorial content</p>
    </div>
  );
};

export default TutorialPlaceholder;
