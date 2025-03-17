
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Brain, Calendar, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const RoadmapGenerator = () => {
  const [learningGoal, setLearningGoal] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState([30]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
    
    try {
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
      
      toast.success("Roadmap generated successfully!");
      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error creating roadmap:", error);
      toast.error(error.message || "Failed to generate roadmap. Please try again.");
    } finally {
      setIsLoading(false);
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

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Roadmap...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Generate Learning Roadmap
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
