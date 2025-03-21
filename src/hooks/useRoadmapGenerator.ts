
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { RoadmapMindMapData, Node } from '@/components/mindmap/types';

export interface RoadmapFormData {
  learningGoal: string;
  description: string;
  duration: number[];
  isAIGenerated: boolean;
}

export const useRoadmapGenerator = (userId: string | undefined) => {
  const [isLoading, setIsLoading] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const generateRoadmap = async (formData: RoadmapFormData) => {
    const { learningGoal, description, duration, isAIGenerated } = formData;
    
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
      if (isAIGenerated) {
        // Use AI to generate roadmap
        setGenerationProgress(30);
        console.log("Calling generate-roadmap function with:", { goal: learningGoal, duration: duration[0] });
        
        // Call the Supabase Edge Function to generate roadmap
        const { data: aiData, error: aiFunctionError } = await supabase.functions.invoke('generate-roadmap', {
          body: { goal: learningGoal, duration: duration[0] }
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
            mind_map_data: aiData.roadmap
          })
          .select()
          .single();
        
        if (roadmapError) {
          console.error("Roadmap insertion error:", roadmapError);
          throw roadmapError;
        }
        
        setGenerationProgress(80);
        console.log("Created roadmap:", roadmap);
        
        // Process the hierarchical data to generate topics
        await processTopics(aiData.roadmap.topics, roadmap.id);
        
        setGenerationProgress(100);
        toast.success("AI-generated roadmap created successfully!");
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
            duration_days: duration[0]
          })
          .select()
          .single();
        
        if (roadmapError) throw roadmapError;
        
        setGenerationProgress(80);
        
        // Generate simple topics based on the duration
        const topics = [];
        for (let i = 1; i <= duration[0]; i++) {
          topics.push({
            roadmap_id: roadmap.id,
            title: `Day ${i}: ${learningGoal} - Part ${i}`,
            day_number: i,
            completed: false
          });
        }
        
        // Insert topics
        const { error: topicsError } = await supabase
          .from('learning_topics')
          .insert(topics);
        
        if (topicsError) throw topicsError;
        
        setGenerationProgress(100);
        toast.success("Roadmap generated successfully!");
      }
      
      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error creating roadmap:", error);
      setError(error.message || "Failed to generate roadmap. Please try again.");
      toast.error(error.message || "Failed to generate roadmap. Please try again.");
    } finally {
      setIsLoading(false);
      setGenerationProgress(0);
    }
  };

  // Helper function to process hierarchical topics
  const processTopics = async (topics: Node[], roadmapId: string, parentId: string | null = null) => {
    for (const topic of topics) {
      // Insert the current topic
      const { data: insertedTopic, error } = await supabase
        .from('learning_topics')
        .insert({
          roadmap_id: roadmapId,
          title: topic.topic,
          description: topic.content,
          day_number: topic.day || 1,
          completed: false,
          parent_topic_id: parentId,
          resources: topic.resources || [],
          node_position: topic.position || null
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error inserting topic:", error);
        throw error;
      }
      
      // Process children if any
      if (topic.children && topic.children.length > 0) {
        await processTopics(topic.children, roadmapId, insertedTopic.id);
      }
    }
  };

  return {
    isLoading,
    generationProgress,
    error,
    generateRoadmap
  };
};
