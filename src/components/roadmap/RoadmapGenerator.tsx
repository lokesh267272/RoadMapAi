
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain, GitBranch } from "lucide-react";
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
import GenerationAnimation from "./GenerationAnimation";

const RoadmapGenerator = () => {
  const [learningGoal, setLearningGoal] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState([30]);
  const [isAIGenerated, setIsAIGenerated] = useState(true); // Default to AI generation
  const [includeFlowchart, setIncludeFlowchart] = useState(true); // Default to create flowchart
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
      isAIGenerated,
      includeFlowchart
    });
  };

  return (
    <div className="max-w-3xl mx-auto animate-fadeInUp">
      <GenerationAnimation 
        isLoading={isLoading} 
        progress={generationProgress} 
        isAIGenerated={isAIGenerated} 
      />
      
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
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="include-flowchart"
                checked={includeFlowchart}
                onChange={(e) => setIncludeFlowchart(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="include-flowchart" className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                <GitBranch className="mr-1.5 h-4 w-4 text-primary" />
                Generate visual flowchart
              </label>
            </div>

            <ErrorDisplay error={error} />

            {!isLoading && (
              <ProgressIndicator 
                isLoading={isLoading}
                value={generationProgress}
              />
            )}

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
