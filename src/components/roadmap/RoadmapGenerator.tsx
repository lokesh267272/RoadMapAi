
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRoadmapGenerator } from "@/hooks/useRoadmapGenerator";
import LearningGoalInput from "./LearningGoalInput";
import DetailsInput from "./DetailsInput";
import DurationSlider from "./DurationSlider";
import ScheduleInfo from "./ScheduleInfo";
import GenerationMethodSelector from "./GenerationMethodSelector";
import ErrorDisplay from "./ErrorDisplay";
import ProgressIndicator from "./ProgressIndicator";
import SubmitButton from "./SubmitButton";

const RoadmapGenerator = () => {
  const [learningGoal, setLearningGoal] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState([30]);
  const [isAIGenerated, setIsAIGenerated] = useState(true); // Default to AI generation
  const { user } = useAuth();
  
  const {
    isLoading,
    generationProgress,
    error,
    generateRoadmap
  } = useRoadmapGenerator(user?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await generateRoadmap({
      learningGoal,
      description,
      duration,
      isAIGenerated
    });
  };

  return (
    <div className="max-w-3xl mx-auto animate-fadeInUp">
      <Card className="bg-glass shadow-lg border-2">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <Brain className="mr-2 h-6 w-6 text-primary" />
            Create Learning Roadmap
          </CardTitle>
          <CardDescription>
            Enter your learning goal and preferences to generate a personalized roadmap
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <LearningGoalInput 
              value={learningGoal}
              onChange={setLearningGoal}
            />

            <DetailsInput 
              value={description}
              onChange={setDescription}
            />

            <DurationSlider 
              value={duration}
              onChange={setDuration}
            />

            <ScheduleInfo duration={duration[0]} />

            <GenerationMethodSelector 
              isAIGenerated={isAIGenerated}
              onChange={setIsAIGenerated}
            />

            <ErrorDisplay error={error} />

            <ProgressIndicator 
              isLoading={isLoading}
              value={generationProgress}
            />

            <SubmitButton 
              isLoading={isLoading}
              isAIGenerated={isAIGenerated}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoadmapGenerator;
