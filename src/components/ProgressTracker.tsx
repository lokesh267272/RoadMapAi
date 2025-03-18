
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  Circle, 
  Loader2, 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, parseISO, startOfWeek, endOfWeek, isSameDay } from "date-fns";

interface Topic {
  id: string;
  title: string;
  completed: boolean;
  day_number: number;
  roadmap_id: string;
  description?: string | null;
  created_at: string;
}

interface Roadmap {
  id: string;
  title: string;
  duration_days: number;
  created_at: string;
}

interface ProgressTrackerProps {
  selectedRoadmapId: string | null;
}

const ProgressTracker = ({ selectedRoadmapId }: ProgressTrackerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [weeklyProgress, setWeeklyProgress] = useState<Record<string, number>>({}); 
  const [streak, setStreak] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const { user } = useAuth();
  
  useEffect(() => {
    if (!selectedRoadmapId) return;
    
    const fetchRoadmapAndTopics = async () => {
      setIsLoading(true);
      try {
        // Fetch the roadmap
        const { data: roadmapData, error: roadmapError } = await supabase
          .from('learning_roadmaps')
          .select('*')
          .eq('id', selectedRoadmapId)
          .single();
        
        if (roadmapError) throw roadmapError;
        setRoadmap(roadmapData);
        
        // Fetch topics for this roadmap
        const { data: topicsData, error: topicsError } = await supabase
          .from('learning_topics')
          .select('*')
          .eq('roadmap_id', selectedRoadmapId)
          .order('day_number', { ascending: true });
        
        if (topicsError) throw topicsError;
        setTopics(topicsData || []);
        
        // Calculate completion percentage
        const total = topicsData?.length || 0;
        const completed = topicsData?.filter(topic => topic.completed).length || 0;
        setTotalCount(total);
        setCompletedCount(completed);
        setCompletionPercentage(total > 0 ? Math.round((completed / total) * 100) : 0);
        
        // Calculate weekly progress
        const weekProgress: Record<string, number> = {};
        const today = new Date();
        const startOfCurrentWeek = startOfWeek(today);
        const endOfCurrentWeek = endOfWeek(today);
        
        for (let day = new Date(startOfCurrentWeek); day <= endOfCurrentWeek; day.setDate(day.getDate() + 1)) {
          const dayStr = format(day, 'E');
          const topicsForDay = topicsData?.filter(topic => {
            const startDate = new Date();
            const topicDate = new Date(startDate);
            topicDate.setDate(startDate.getDate() + (topic.day_number - 1));
            return isSameDay(topicDate, day);
          }) || [];
          
          if (topicsForDay.length > 0) {
            const dayCompletion = topicsForDay.filter(t => t.completed).length / topicsForDay.length;
            weekProgress[dayStr] = Math.round(dayCompletion * 100);
          } else {
            weekProgress[dayStr] = 0;
          }
        }
        setWeeklyProgress(weekProgress);
        
        // Calculate streak
        const sortedTopics = [...topicsData || []].sort((a, b) => {
          const dateA = new Date();
          dateA.setDate(dateA.getDate() + (a.day_number - 1));
          const dateB = new Date();
          dateB.setDate(dateB.getDate() + (b.day_number - 1));
          return dateB.getTime() - dateA.getTime(); // Sort in reverse chronological order
        });
        
        let currentStreak = 0;
        for (const topic of sortedTopics) {
          const topicDate = new Date();
          topicDate.setDate(topicDate.getDate() + (topic.day_number - 1));
          
          if (isSameDay(topicDate, today) || topicDate < today) {
            if (topic.completed) {
              currentStreak++;
            } else {
              break;
            }
          }
        }
        
        setStreak(currentStreak);
      } catch (error) {
        console.error("Error fetching roadmap and topics:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRoadmapAndTopics();
    
    // Set up real-time subscription for updates
    const topicsChannel = supabase
      .channel('learning_topics_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'learning_topics',
          filter: `roadmap_id=eq.${selectedRoadmapId}`
        }, 
        (payload) => {
          console.log('Change received!', payload);
          // Refresh data when changes occur
          fetchRoadmapAndTopics();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(topicsChannel);
    };
  }, [selectedRoadmapId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!selectedRoadmapId || !roadmap) {
    return (
      <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium mb-2">No roadmap selected</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Select a roadmap from your dashboard to view detailed progress
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="md:w-2/3 bg-glass shadow">
          <CardHeader>
            <CardTitle>{roadmap.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm font-medium">{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
                <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                  <span>{completedCount} of {totalCount} topics completed</span>
                  <span>{Math.max(0, totalCount - completedCount)} remaining</span>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3 flex items-center">
                  <TrendingUp className="mr-2 h-4 w-4 text-primary" />
                  Weekly Progress
                </h3>
                <div className="grid grid-cols-7 gap-1">
                  {Object.entries(weeklyProgress).map(([day, value]) => (
                    <div key={day} className="flex flex-col items-center">
                      <span className="text-xs font-medium mb-1">{day}</span>
                      <div className="w-full bg-muted rounded-full h-24 relative">
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-primary rounded-b-full transition-all"
                          style={{ height: `${value}%` }}
                        ></div>
                      </div>
                      <span className="text-xs mt-1">{value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:w-1/3 bg-glass shadow">
          <CardHeader>
            <CardTitle className="text-base">Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Completion</div>
                    <div className="text-2xl font-bold">{completionPercentage}%</div>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Learning Streak</div>
                    <div className="text-2xl font-bold">{streak} days</div>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Topics</div>
                    <div className="text-2xl font-bold">{totalCount}</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-glass shadow">
        <CardHeader>
          <CardTitle>Learning Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">All Topics</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="incomplete">Incomplete</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              {topics.map((topic) => (
                <TopicItem key={topic.id} topic={topic} />
              ))}
            </TabsContent>
            
            <TabsContent value="completed" className="space-y-4">
              {topics.filter(t => t.completed).map((topic) => (
                <TopicItem key={topic.id} topic={topic} />
              ))}
            </TabsContent>
            
            <TabsContent value="incomplete" className="space-y-4">
              {topics.filter(t => !t.completed).map((topic) => (
                <TopicItem key={topic.id} topic={topic} />
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper component for topic display
const TopicItem = ({ topic }: { topic: Topic }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  
  const handleToggleStatus = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('learning_topics')
        .update({ completed: !topic.completed })
        .eq('id', topic.id);
      
      if (error) throw error;
    } catch (error) {
      console.error("Error updating topic status:", error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  const startDate = new Date();
  const topicDate = new Date(startDate);
  topicDate.setDate(startDate.getDate() + (topic.day_number - 1));
  
  return (
    <div className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-accent/10 transition-colors">
      <button
        onClick={handleToggleStatus}
        disabled={isUpdating}
        className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isUpdating ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : topic.completed ? (
          <CheckCircle className="h-4 w-4 fill-primary text-primary-foreground" />
        ) : (
          <Circle className="h-4 w-4 text-primary" />
        )}
      </button>
      
      <div className="flex-1 space-y-1">
        <div className="flex items-center space-x-2">
          <p className={`text-sm font-medium ${topic.completed ? "line-through text-muted-foreground" : ""}`}>
            {topic.title}
          </p>
          <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
            Day {topic.day_number}
          </span>
        </div>
        {topic.description && (
          <p className="text-xs text-muted-foreground">{topic.description}</p>
        )}
      </div>
      
      <div className="text-xs text-muted-foreground whitespace-nowrap">
        {format(topicDate, "MMM d, yyyy")}
      </div>
    </div>
  );
};

export default ProgressTracker;
