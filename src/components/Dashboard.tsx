
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, Clock, Plus, Target } from "lucide-react";
import RoadmapGenerator from "./RoadmapGenerator";
import CalendarView from "./Calendar";
import ProgressTracker from "./ProgressTracker";

// Mock data
const mockRoadmaps = [
  {
    id: "1",
    title: "Learn JavaScript in 30 Days",
    progress: 75,
    nextTopic: "Asynchronous JavaScript",
    totalTopics: 30,
    completedTopics: 22,
  },
  {
    id: "2",
    title: "Master React in 60 Days",
    progress: 45,
    nextTopic: "React Hooks",
    totalTopics: 60,
    completedTopics: 27,
  },
];

const DashboardComponent = () => {
  const [isCreatingRoadmap, setIsCreatingRoadmap] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const handleCreateRoadmap = () => {
    setIsCreatingRoadmap(true);
    setActiveTab("create");
  };

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
                <div className="text-2xl font-bold">{mockRoadmaps.length}</div>
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
                  {mockRoadmaps.reduce((acc, roadmap) => acc + roadmap.completedTopics, 0)}
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
                <div className="text-2xl font-bold">12 days</div>
              </CardContent>
            </Card>
          </div>

          <h2 className="text-xl font-semibold mt-8 mb-4">Your Roadmaps</h2>
          
          {mockRoadmaps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockRoadmaps.map((roadmap) => (
                <Card key={roadmap.id} className="bg-glass overflow-hidden card-hover">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{roadmap.title}</h3>
                    <div className="flex items-center text-muted-foreground mb-4">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Next: {roadmap.nextTopic}</span>
                    </div>
                    
                    <div className="mb-2 flex justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">{roadmap.progress}%</span>
                    </div>
                    
                    <div className="w-full bg-muted rounded-full h-2 mb-4">
                      <div
                        className="bg-primary rounded-full h-2 transition-all duration-500"
                        style={{ width: `${roadmap.progress}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between mt-4">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      <Button size="sm">
                        Continue Learning
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
          <CalendarView />
        </TabsContent>

        <TabsContent value="progress">
          <ProgressTracker />
        </TabsContent>

        <TabsContent value="create">
          <RoadmapGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardComponent;
