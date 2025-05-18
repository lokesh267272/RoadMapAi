import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Roadmap {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

const AiTutorSelection = () => {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchRoadmaps = async () => {
      try {
        const { data, error } = await supabase
          .from('learning_roadmaps')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRoadmaps(data || []);
      } catch (error) {
        console.error('Error fetching roadmaps:', error);
        toast.error('Failed to load roadmaps');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchRoadmaps();
    }
  }, [user]);

  const handleRoadmapSelect = (roadmapId: string) => {
    navigate(`/ai-tutor/${roadmapId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-muted rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">AI Tutor</h1>
          <p className="text-muted-foreground mb-8">
            Select a roadmap to start learning with your AI tutor
          </p>

          {roadmaps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roadmaps.map((roadmap) => (
                <Card 
                  key={roadmap.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleRoadmapSelect(roadmap.id)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      {roadmap.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {roadmap.description}
                    </p>
                    <Button className="w-full">
                      Start Learning <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">No roadmaps available</h3>
              <p className="text-muted-foreground mb-4">
                Create a roadmap first to start learning with the AI tutor
              </p>
              <Button onClick={() => navigate('/dashboard?tab=create')}>
                Create Roadmap
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiTutorSelection; 