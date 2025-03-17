
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { AlertCircle, Brain, Calendar, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Progress } from "@/components/ui/progress";

const RoadmapGenerator = () => {
  const [learningGoal, setLearningGoal] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState([30]);
  const [isLoading, setIsLoading] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isAIGenerated, setIsAIGenerated] = useState(true); // Default to AI generation
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!learningGoal.trim()) {
      toast.error("Please enter a learning goal");
      return;
    }

    if (!user) {
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
            user_id: user.id,
            title: aiData.roadmap.title || learningGoal,
            description: description,
            duration_days: duration[0]
          })
          .select()
          .single();
        
        if (roadmapError) {
          console.error("Roadmap insertion error:", roadmapError);
          throw roadmapError;
        }
        
        setGenerationProgress(80);
        console.log("Created roadmap:", roadmap);
        
        // Generate topics from AI response
        const topics = aiData.roadmap.topics.map((topic: any, index: number) => ({
          roadmap_id: roadmap.id,
          title: topic.topic,
          description: topic.content,
          day_number: topic.day || index + 1,
          completed: false
        }));
        
        console.log("Inserting topics:", topics);
        
        // Insert topics
        const { error: topicsError } = await supabase
          .from('learning_topics')
          .insert(topics);
        
        if (topicsError) {
          console.error("Topics insertion error:", topicsError);
          throw topicsError;
        }
        
        setGenerationProgress(100);
        toast.success("AI-generated roadmap created successfully!");
      } else {
        // Generate simple topics based on the duration
        setGenerationProgress(50);
        
        // Insert the roadmap into Supabase
        const { data: roadmap, error: roadmapError } = await supabase
          .from('learning_roadmaps')
          .insert({
            user_id: user.id,
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
            <div className="space-y-2">
              <Label htmlFor="learning-goal">Learning Goal</Label>
              <Input
                id="learning-goal"
                placeholder="e.g., Learn JavaScript in 30 days"
                value={learningGoal}
                onChange={(e) => setLearningGoal(e.target.value)}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Additional Details (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Include any specific topics or areas you want to focus on"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] bg-background/50"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Duration (days)</Label>
                <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-sm font-medium">
                  {duration[0]} days
                </span>
              </div>
              <Slider
                value={duration}
                onValueChange={setDuration}
                max={90}
                min={7}
                step={1}
                className="py-2"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>1 week</span>
                <span>90 days</span>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 border">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium">Planning your schedule</h3>
                  <p className="text-muted-foreground text-sm">
                    Your roadmap will include {duration[0]} daily learning topics. You can adjust your schedule later if needed.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant={isAIGenerated ? "default" : "outline"}
                className="flex-1"
                onClick={() => setIsAIGenerated(true)}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Use AI Generation
              </Button>
              <Button
                type="button"
                variant={!isAIGenerated ? "default" : "outline"}
                className="flex-1"
                onClick={() => setIsAIGenerated(false)}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Basic Schedule
              </Button>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="text-sm text-destructive">{error}</div>
              </div>
            )}

            {isLoading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Generating your roadmap...</span>
                  <span>{generationProgress}%</span>
                </div>
                <Progress value={generationProgress} />
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isAIGenerated ? "AI is creating your roadmap..." : "Generating Roadmap..."}
                </>
              ) : (
                <>
                  {isAIGenerated ? (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate AI Learning Roadmap
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Generate Basic Roadmap
                    </>
                  )}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoadmapGenerator;
