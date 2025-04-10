
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, Clock, Plus, Target, Loader2, ArrowLeft, Trash2, Share, GitBranch } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import RoadmapGenerator from "./RoadmapGenerator";
import CalendarView from "./calendar";
import ProgressTracker from "./ProgressTracker";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { isToday, subDays, isBefore, isAfter, formatDistance } from "date-fns";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface Roadmap {
  id: string;
  title: string;
  duration_days: number;
  created_at: string;
}

interface Topic {
  id: string;
  title: string;
  completed: boolean;
  day_number: number;
  roadmap_id: string;
  created_at: string;
  updated_at: string;
}

interface DashboardProps {
  initialTab?: string | null;
}

const DashboardComponent = ({ initialTab }: DashboardProps) => {
  const [isCreatingRoadmap, setIsCreatingRoadmap] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [topics, setTopics] = useState<Record<string, Topic[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoadmap, setSelectedRoadmap] = useState<string | null>(null);
  const [selectedRoadmapForProgress, setSelectedRoadmapForProgress] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const [roadmapToDelete, setRoadmapToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (activeTab !== "overview") {
      setSearchParams({ tab: activeTab });
    } else {
      setSearchParams({});
    }
  }, [activeTab, setSearchParams]);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      toast.error("Please sign in to view your dashboard");
      navigate("/auth");
      return;
    }

    const fetchRoadmaps = async () => {
      try {
        const { data, error } = await supabase
          .from('learning_roadmaps')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setRoadmaps(data || []);
        
        if (data && data.length > 0) {
          const topicsData: Record<string, Topic[]> = {};
          
          for (const roadmap of data) {
            const { data: roadmapTopics, error: topicsError } = await supabase
              .from('learning_topics')
              .select('*')
              .eq('roadmap_id', roadmap.id)
              .order('day_number', { ascending: true });
            
            if (topicsError) throw topicsError;
            
            topicsData[roadmap.id] = roadmapTopics || [];
          }
          
          setTopics(topicsData);
          calculateStreak(topicsData);
        }
      } catch (error: any) {
        console.error("Error fetching roadmaps:", error);
        toast.error("Failed to load your roadmaps");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRoadmaps();
    
    const roadmapsChannel = supabase
      .channel('roadmaps_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'learning_roadmaps'
        }, 
        (payload) => {
          console.log('Roadmaps change received!', payload);
          fetchRoadmaps();
        }
      )
      .subscribe();
      
    const topicsChannel = supabase
      .channel('topics_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'learning_topics'
        }, 
        (payload) => {
          console.log('Topics change received!', payload);
          fetchRoadmaps();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(roadmapsChannel);
      supabase.removeChannel(topicsChannel);
    };
  }, [user, authLoading, navigate, setSearchParams]);

  const calculateStreak = (topicsData: Record<string, Topic[]>) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const allCompletedTopics: Topic[] = [];
    Object.values(topicsData).forEach(roadmapTopics => {
      allCompletedTopics.push(...roadmapTopics.filter(topic => topic.completed));
    });
    
    allCompletedTopics.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    
    if (allCompletedTopics.length === 0) {
      setStreak(0);
      return;
    }
    
    const hasCompletedToday = allCompletedTopics.some(topic => 
      isToday(new Date(topic.updated_at))
    );
    
    if (!hasCompletedToday) {
      const yesterday = subDays(today, 1);
      const hasCompletedYesterday = allCompletedTopics.some(topic => {
        const completedDate = new Date(topic.updated_at);
        completedDate.setHours(0, 0, 0, 0);
        return completedDate.getTime() === yesterday.getTime();
      });
      
      if (!hasCompletedYesterday) {
        setStreak(0);
        return;
      }
    }
    
    let currentStreak = 0;
    let currentDate = new Date(today);
    
    while (true) {
      const hasCompletedOnDate = allCompletedTopics.some(topic => {
        const completedDate = new Date(topic.updated_at);
        completedDate.setHours(0, 0, 0, 0);
        return completedDate.getTime() === currentDate.getTime();
      });
      
      if (hasCompletedOnDate) {
        currentStreak++;
        currentDate = subDays(currentDate, 1);
      } else {
        break;
      }
    }
    
    setStreak(currentStreak);
  };

  const handleCreateRoadmap = () => {
    setIsCreatingRoadmap(true);
    setActiveTab("create");
  };

  const calculateProgress = (roadmapId: string) => {
    const roadmapTopics = topics[roadmapId] || [];
    if (roadmapTopics.length === 0) return 0;
    
    const completedTopics = roadmapTopics.filter(topic => topic.completed).length;
    return Math.round((completedTopics / roadmapTopics.length) * 100);
  };

  const getNextTopic = (roadmapId: string) => {
    const roadmapTopics = topics[roadmapId] || [];
    const nextTopic = roadmapTopics.find(topic => !topic.completed);
    return nextTopic?.title || "All topics completed!";
  };

  const getTotalCompletedTopics = () => {
    let total = 0;
    Object.values(topics).forEach(roadmapTopics => {
      total += roadmapTopics.filter(topic => topic.completed).length;
    });
    return total;
  };

  const handleViewDetails = (roadmapId: string) => {
    setSelectedRoadmap(roadmapId);
    setSelectedRoadmapForProgress(roadmapId);
    setActiveTab("progress");
  };

  const handleBackToRoadmapList = () => {
    setSelectedRoadmapForProgress(null);
  };

  const handleContinueLearning = (roadmapId: string) => {
    const roadmapTopics = topics[roadmapId] || [];
    const nextTopic = roadmapTopics.find(topic => !topic.completed);
    
    if (nextTopic) {
      setSelectedRoadmap(roadmapId);
      setActiveTab("progress");
      
      toast.info(`Next topic: ${nextTopic.title}`);
    } else {
      toast.success("Congratulations! You've completed all topics in this roadmap.");
    }
  };

  const handleDeleteClick = (roadmapId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRoadmapToDelete(roadmapId);
  };

  const handleViewFlowchart = (roadmapId: string) => {
    navigate(`/flowchart/${roadmapId}`);
  };

  const confirmDelete = async () => {
    if (!roadmapToDelete) return;
    
    setIsDeleting(true);
    try {
      // First, get all topics related to this roadmap
      const { data: topicsData, error: topicsQueryError } = await supabase
        .from('learning_topics')
        .select('id')
        .eq('roadmap_id', roadmapToDelete);
      
      if (topicsQueryError) throw topicsQueryError;
      
      const topicIds = topicsData.map(topic => topic.id);
      
      // If there are topics with potential flashcards, delete the flashcards first
      if (topicIds.length > 0) {
        const { error: flashcardsError } = await supabase
          .from('flashcards')
          .delete()
          .in('topic_id', topicIds);
        
        if (flashcardsError) throw flashcardsError;
      }
      
      // Now delete the topics
      const { error: topicsError } = await supabase
        .from('learning_topics')
        .delete()
        .eq('roadmap_id', roadmapToDelete);
      
      if (topicsError) throw topicsError;
      
      // Finally delete the roadmap
      const { error: roadmapError } = await supabase
        .from('learning_roadmaps')
        .delete()
        .eq('id', roadmapToDelete);
      
      if (roadmapError) throw roadmapError;
      
      toast.success("Roadmap deleted successfully");
      setRoadmapToDelete(null);
      
      setRoadmaps(prevRoadmaps => 
        prevRoadmaps.filter(roadmap => roadmap.id !== roadmapToDelete)
      );
      
      if (selectedRoadmap === roadmapToDelete) {
        setSelectedRoadmap(null);
      }
      
      if (selectedRoadmapForProgress === roadmapToDelete) {
        setSelectedRoadmapForProgress(null);
      }
    } catch (error: any) {
      console.error("Error deleting roadmap:", error);
      toast.error("Failed to delete roadmap: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setRoadmapToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderRoadmapCard = (roadmap: Roadmap) => (
    <Card key={roadmap.id} className="bg-glass overflow-hidden card-hover">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold">{roadmap.title}</h3>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={(e) => handleDeleteClick(roadmap.id, e)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center text-muted-foreground mb-4">
          <Calendar className="h-4 w-4 mr-2" />
          <span>Next: {getNextTopic(roadmap.id)}</span>
        </div>
        
        <div className="mb-2 flex justify-between text-sm">
          <span>Progress</span>
          <span className="font-medium">{calculateProgress(roadmap.id)}%</span>
        </div>
        
        <div className="w-full bg-muted rounded-full h-2 mb-4">
          <div
            className="bg-primary rounded-full h-2 transition-all duration-500"
            style={{ width: `${calculateProgress(roadmap.id)}%` }}
          ></div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleViewDetails(roadmap.id)}
          >
            View Details
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => handleViewFlowchart(roadmap.id)}
          >
            <GitBranch className="h-4 w-4 mr-1" /> View Flowchart
          </Button>
          <Button 
            size="sm"
            onClick={() => handleContinueLearning(roadmap.id)}
          >
            Continue Learning
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8 animate-fadeInUp">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Your Learning Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track your progress and manage your learning roadmaps
          </p>
        </div>
        <Button
          onClick={handleCreateRoadmap}
          className="mt-4 sm:mt-0 shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" /> Create New Roadmap
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50 border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="create">Create</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Target className="mr-2 h-4 w-4 text-primary" />
                  Active Roadmaps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{roadmaps.length}</div>
              </CardContent>
            </Card>
            
            <Card className="bg-glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                  Completed Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {getTotalCompletedTopics()}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-glass">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-primary" />
                  Daily Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{streak} days</div>
              </CardContent>
            </Card>
          </div>

          <h2 className="text-xl font-semibold mt-8 mb-4">Your Roadmaps</h2>
          
          {roadmaps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {roadmaps.map(roadmap => renderRoadmapCard(roadmap))}
            </div>
          ) : (
            <div className="bg-glass rounded-lg p-8 text-center">
              <h3 className="text-xl font-medium mb-2">No roadmaps yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first learning roadmap to get started
              </p>
              <Button onClick={handleCreateRoadmap}>
                <Plus className="mr-2 h-4 w-4" /> Create Roadmap
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <CalendarView selectedRoadmapId={selectedRoadmap} topics={topics} />
        </TabsContent>

        <TabsContent value="progress">
          {!selectedRoadmapForProgress ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Select a Roadmap</h2>
              <p className="text-muted-foreground">Choose a roadmap to view detailed progress information</p>
              
              {roadmaps.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {roadmaps.map(roadmap => renderRoadmapCard(roadmap))}
                </div>
              ) : (
                <div className="bg-glass rounded-lg p-8 text-center">
                  <h3 className="text-xl font-medium mb-2">No roadmaps yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first learning roadmap to get started
                  </p>
                  <Button onClick={handleCreateRoadmap}>
                    <Plus className="mr-2 h-4 w-4" /> Create Roadmap
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div>
              <Button 
                variant="outline" 
                className="mb-6"
                onClick={handleBackToRoadmapList}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Roadmaps
              </Button>
              <ProgressTracker selectedRoadmapId={selectedRoadmapForProgress} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="create">
          <RoadmapGenerator />
        </TabsContent>
      </Tabs>

      <Dialog open={roadmapToDelete !== null} onOpenChange={(open) => !open && cancelDelete()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Roadmap</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this roadmap? This action cannot be undone, and all topics and progress will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-between sm:justify-between gap-2">
            <Button variant="outline" onClick={cancelDelete} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Roadmap"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardComponent;
