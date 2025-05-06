
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export interface RoadmapFormData {
  learningGoal: string;
  description: string;
  duration: number[];
  isAIGenerated: boolean;
  includeFlowchart?: boolean;
}

export const useRoadmapGenerator = (userId: string | undefined) => {
  const [isLoading, setIsLoading] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const generateRoadmap = async (formData: RoadmapFormData) => {
    const { learningGoal, description, duration, isAIGenerated, includeFlowchart = true } = formData;
    
    setError(null);
    
    if (!learningGoal.trim()) {
      toast.error("Please enter a learning goal");
      return;
    }

    if (!userId) {
      toast.error("You must be logged in to create a roadmap");
      navigate("/auth");
      return;
    }
    
    setIsLoading(true);
    setGenerationProgress(10);
    
    try {
      let roadmapData: any = null;
      let topicsData: any[] = [];
      
      if (isAIGenerated) {
        // Use AI to generate roadmap
        setGenerationProgress(30);
        console.log("Calling generate-roadmap function with:", { 
          goal: learningGoal, 
          duration: duration[0],
          description: description
        });
        
        // Call the Supabase Edge Function to generate roadmap
        const { data: aiData, error: aiFunctionError } = await supabase.functions.invoke('generate-roadmap', {
          body: { 
            goal: learningGoal, 
            duration: duration[0],
            description: description
          }
        });
        
        if (aiFunctionError) {
          console.error("AI Function Error:", aiFunctionError);
          throw new Error(aiFunctionError.message);
        }
        
        if (!aiData || !aiData.roadmap) {
          console.error("Invalid AI response data:", aiData);
          throw new Error("Failed to generate roadmap data");
        }
        
        console.log("Received AI roadmap data:", aiData);
        setGenerationProgress(70);
        
        // Insert the roadmap into Supabase
        const { data: roadmap, error: roadmapError } = await supabase
          .from('learning_roadmaps')
          .insert({
            user_id: userId,
            title: aiData.roadmap.title || learningGoal,
            description: description,
            duration_days: duration[0],
            mind_map_data: includeFlowchart ? generateInitialFlowchartData(aiData.roadmap.title || learningGoal) : null
          })
          .select()
          .single();
        
        if (roadmapError) {
          console.error("Roadmap insertion error:", roadmapError);
          throw roadmapError;
        }
        
        roadmapData = roadmap;
        setGenerationProgress(80);
        console.log("Created roadmap:", roadmap);
        
        // Generate topics from AI response
        topicsData = aiData.roadmap.topics.map((topic: any, index: number) => ({
          roadmap_id: roadmap.id,
          title: topic.topic,
          description: topic.content,
          day_number: topic.day || index + 1,
          completed: false,
          resources: topic.resources || []
        }));
        
        console.log("Inserting topics:", topicsData);
      } else {
        // Generate simple topics based on the duration
        setGenerationProgress(50);
        
        // Insert the roadmap into Supabase
        const { data: roadmap, error: roadmapError } = await supabase
          .from('learning_roadmaps')
          .insert({
            user_id: userId,
            title: learningGoal,
            description: description,
            duration_days: duration[0],
            mind_map_data: includeFlowchart ? generateInitialFlowchartData(learningGoal) : null
          })
          .select()
          .single();
        
        if (roadmapError) throw roadmapError;
        
        roadmapData = roadmap;
        setGenerationProgress(80);
        
        // Generate simple topics based on the duration
        for (let i = 1; i <= duration[0]; i++) {
          topicsData.push({
            roadmap_id: roadmap.id,
            title: `Day ${i}: ${learningGoal} - Part ${i}`,
            day_number: i,
            completed: false,
            resources: []
          });
        }
      }
      
      // Insert topics
      const { error: topicsError } = await supabase
        .from('learning_topics')
        .insert(topicsData);
      
      if (topicsError) throw topicsError;
      
      setGenerationProgress(100);
      
      if (includeFlowchart) {
        toast.success("Roadmap generated with flowchart! You can view it in the flowchart view.");
      } else {
        toast.success("Roadmap generated successfully!");
      }
      
      // Redirect to dashboard with calendar tab
      navigate("/dashboard?tab=calendar");
    } catch (error: any) {
      console.error("Error creating roadmap:", error);
      setError(error.message || "Failed to generate roadmap. Please try again.");
      toast.error(error.message || "Failed to generate roadmap. Please try again.");
    } finally {
      setIsLoading(false);
      setGenerationProgress(0);
    }
  };

  const generateInitialFlowchartData = (title: string) => {
    // Create simple initial flowchart with just the title node
    return {
      nodes: [
        {
          id: 'root',
          type: 'input',
          data: { label: title },
          position: { x: 250, y: 50 },
        }
      ],
      edges: []
    };
  };

  return {
    isLoading,
    generationProgress,
    error,
    generateRoadmap
  };
};
