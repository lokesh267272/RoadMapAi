
import RoadmapGenerator from "@/components/roadmap/RoadmapGenerator";
import { useEffect } from "react";

const RoadmapCreate = () => {
  useEffect(() => {
    // Set page title
    document.title = "Create Learning Roadmap | LearningPath";
  }, []);

  return (
    <div className="container max-w-5xl mx-auto py-16 px-4">
      <RoadmapGenerator />
    </div>
  );
};

export default RoadmapCreate;
