import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Map, BarChart2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RoadmapCard } from "./RoadmapCard";
import { RoadmapSkeleton } from "./RoadmapSkeleton";
import { EmptyState } from "./EmptyState";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Tables } from "@/integrations/supabase/types";
import RoadmapDetailView from "./roadmap/RoadmapDetailView";
import RoadmapMindMapView from "./roadmap/RoadmapMindMapView";

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [roadmaps, setRoadmaps] = useState<Tables<"learning_roadmaps">[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("roadmaps");
  const [selectedRoadmap, setSelectedRoadmap] = useState<Tables<"learning_roadmaps"> | null>(null);
  const [roadmapToDelete, setRoadmapToDelete] = useState<Tables<"learning_roadmaps"> | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'mindmap'>('list');

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error);
        return null;
      }
      return data.user;
    },
  });

  useEffect(() => {
    const fetchRoadmaps = async () => {
      setIsLoading(true);
      try {
        if (!user) {
          console.warn("User not available, skipping roadmap fetch.");
          return;
        }

        const { data, error } = await supabase
          .from('learning_roadmaps')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching roadmaps:", error);
          toast.error("Failed to load roadmaps.");
        }

        setRoadmaps(data || []);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchRoadmaps();
    }
  }, [user]);

  const deleteRoadmapMutation = useMutation(
    async (id: string) => {
      const { error } = await supabase
        .from('learning_roadmaps')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting roadmap:", error);
        throw new Error("Failed to delete roadmap.");
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['learning_roadmaps']);
        setRoadmaps(roadmaps.filter(roadmap => roadmap.id !== roadmapToDelete?.id));
        setRoadmapToDelete(null);
        toast.success("Roadmap deleted successfully!");
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to delete roadmap.");
      },
    }
  );

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleRoadmapSelect = (roadmap: Tables<"learning_roadmaps">) => {
    setSelectedRoadmap(roadmap);
    setViewMode('detail');
  };

  const handleEditRoadmap = (roadmap: Tables<"learning_roadmaps">) => {
    // Implement edit functionality here
    console.log("Edit roadmap:", roadmap);
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Manage your learning roadmaps and progress.</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={() => navigate("/roadmap/create")} className="whitespace-nowrap">
            <Plus className="w-4 h-4 mr-2" />
            Create Roadmap
          </Button>
        </div>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="roadmaps" className="flex items-center">
            <Map className="w-4 h-4 mr-2" />
            My Roadmaps
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center">
            <BarChart2 className="w-4 h-4 mr-2" />
            Progress
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="roadmaps" className="animate-fadeInUp">
          {viewMode === 'list' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                <RoadmapSkeleton count={3} />
              ) : roadmaps.length > 0 ? (
                roadmaps.map((roadmap) => (
                  <RoadmapCard
                    key={roadmap.id}
                    roadmap={roadmap}
                    onClick={() => handleRoadmapSelect(roadmap)}
                    onEdit={() => handleEditRoadmap(roadmap)}
                    onDelete={() => setRoadmapToDelete(roadmap)}
                  />
                ))
              ) : (
                <EmptyState
                  title="No roadmaps found"
                  description="Create your first learning roadmap to get started."
                  action={{ label: "Create Roadmap", onClick: () => navigate("/roadmap/create") }}
                />
              )}
            </div>
          )}
          
          {viewMode === 'detail' && selectedRoadmap && (
            <RoadmapDetailView 
              roadmap={selectedRoadmap} 
              onBack={() => setViewMode('list')}
              onViewMindMap={() => setViewMode('mindmap')}
            />
          )}
          
          {viewMode === 'mindmap' && selectedRoadmap && (
            <RoadmapMindMapView 
              roadmapId={selectedRoadmap.id} 
              roadmapTitle={selectedRoadmap.title}
              onBack={() => setViewMode('detail')}
            />
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-4 animate-fadeInUp">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-glass shadow">
              <CardContent>
                <h2 className="text-lg font-semibold mb-4">Total Roadmaps</h2>
                <p className="text-3xl font-bold">{roadmaps.length}</p>
              </CardContent>
            </Card>

            <Card className="bg-glass shadow">
              <CardContent>
                <h2 className="text-lg font-semibold mb-4">Completed Roadmaps</h2>
                <p className="text-3xl font-bold">0</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-glass shadow">
            <CardContent>
              <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
              <p className="text-muted-foreground">No recent activity to display.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm" disabled={!roadmapToDelete}>
            Delete Roadmap
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the roadmap and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={deleteRoadmapMutation.isLoading}
            onClick={() => {
              if (roadmapToDelete) {
                deleteRoadmapMutation.mutate(roadmapToDelete.id);
              }
            }}
          >
            {deleteRoadmapMutation.isLoading ? (
              <>Deleting...</>
            ) : (
              <>Delete</>
            )}
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
