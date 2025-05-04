
import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fetchRoadmapData } from "@/components/flowchart/FlowchartUtils";
import { RoadmapNode, RoadmapEdge } from "@/components/flowchart/FlowchartTypes";
import TutorSidebar from "@/components/tutor/TutorSidebar";
import TutorContent from "@/components/tutor/TutorContent";
import TutorChat from "@/components/tutor/TutorChat";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

const AiTutor = () => {
  const { user } = useAuth();
  const { roadmapId } = useParams<{ roadmapId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const topicId = searchParams.get("topicId");
  const topicTitle = searchParams.get("title");

  const [isLoading, setIsLoading] = useState(true);
  const [roadmapTitle, setRoadmapTitle] = useState("");
  const [nodes, setNodes] = useState<RoadmapNode[]>([]);
  const [edges, setEdges] = useState<RoadmapEdge[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  useEffect(() => {
    if (roadmapId) {
      fetchRoadmapData(
        roadmapId,
        setRoadmapTitle,
        setNodes,
        setEdges,
        setIsLoading
      );
    }
  }, [roadmapId]);

  const handleBackToCalendar = () => {
    navigate(`/calendar`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full pt-16 pb-8 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-3 animate-fadeInUp h-full">
        {/* Header with Back Button - Always visible on both mobile and desktop */}
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleBackToCalendar}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to Calendar</span>
          </Button>
          <h2 className="text-lg font-medium truncate flex-1 mx-2">
            {topicTitle || "AI Tutor"}
          </h2>
          {/* Topics button - only show on mobile */}
          {isMobile && topicId && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  Topics
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] sm:w-[350px] p-0">
                <div className="h-full overflow-hidden">
                  <TutorSidebar 
                    roadmapId={roadmapId || ""} 
                    roadmapTitle={roadmapTitle}
                    nodes={nodes}
                    currentTopicId={topicId || ""}
                  />
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>

        <div className="flex flex-col md:flex-row h-[calc(100vh-10rem)] gap-5">
          {/* Left Panel - Topics (hidden on mobile) */}
          {!isMobile && (
            <div className="w-full md:w-1/4 h-full overflow-hidden shrink-0">
              <TutorSidebar 
                roadmapId={roadmapId || ""} 
                roadmapTitle={roadmapTitle}
                nodes={nodes}
                currentTopicId={topicId || ""}
              />
            </div>
          )}
          
          {/* Center Panel - Content */}
          <div className="w-full md:w-[40%] h-full overflow-y-auto">
            <TutorContent 
              topicId={topicId || ""} 
              topicTitle={topicTitle || ""} 
            />
          </div>
          
          {/* Right Panel - Chat (full width on desktop, drawer on mobile) */}
          {isMobile ? (
            <>
              <Drawer>
                <DrawerTrigger asChild>
                  <Button
                    className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-50 flex items-center justify-center"
                    size="icon"
                  >
                    <MessageSquare className="h-6 w-6" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="h-[80vh]">
                  <div className="h-full p-1 pt-6">
                    <TutorChat 
                      topicId={topicId || ""} 
                      topicTitle={topicTitle || ""} 
                    />
                  </div>
                </DrawerContent>
              </Drawer>
            </>
          ) : (
            <div className="w-full md:w-[35%] h-full flex flex-col overflow-hidden">
              <TutorChat 
                topicId={topicId || ""} 
                topicTitle={topicTitle || ""} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiTutor;
