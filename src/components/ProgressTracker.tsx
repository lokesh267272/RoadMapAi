
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { CheckCheck, Trophy, Calendar, ArrowUpRight, Clock } from "lucide-react";

// Mock data for the charts
const weeklyProgress = [
  { day: "Mon", topics: 3 },
  { day: "Tue", topics: 2 },
  { day: "Wed", topics: 4 },
  { day: "Thu", topics: 1 },
  { day: "Fri", topics: 3 },
  { day: "Sat", topics: 5 },
  { day: "Sun", topics: 2 },
];

const roadmapCompletion = [
  { name: "Completed", value: 65 },
  { name: "Remaining", value: 35 },
];

const COLORS = ["#3b82f6", "#e2e8f0"];

const ProgressTracker = () => {
  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-glass shadow-sm">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-primary/10 p-3 mb-3">
              <CheckCheck className="h-6 w-6 text-primary" />
            </div>
            <div className="text-2xl font-bold">68%</div>
            <p className="text-sm text-muted-foreground">Overall Completion</p>
          </CardContent>
        </Card>
        
        <Card className="bg-glass shadow-sm">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-primary/10 p-3 mb-3">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div className="text-2xl font-bold">12</div>
            <p className="text-sm text-muted-foreground">Day Streak</p>
          </CardContent>
        </Card>
        
        <Card className="bg-glass shadow-sm">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-primary/10 p-3 mb-3">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div className="text-2xl font-bold">49</div>
            <p className="text-sm text-muted-foreground">Topics Completed</p>
          </CardContent>
        </Card>
        
        <Card className="bg-glass shadow-sm">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-primary/10 p-3 mb-3">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div className="text-2xl font-bold">32h</div>
            <p className="text-sm text-muted-foreground">Time Spent Learning</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-glass shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Weekly Progress</span>
              <Button size="sm" variant="ghost" className="p-0 h-8 w-8">
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyProgress} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="day" />
                  <YAxis allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '8px',
                      borderColor: '#e2e8f0',
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="topics" name="Completed Topics" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-glass shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Roadmap Completion</span>
              <Button size="sm" variant="ghost" className="p-0 h-8 w-8">
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roadmapCompletion}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {roadmapCompletion.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-glass shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Learning Journey Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
              <h3 className="font-medium flex items-center">
                <Trophy className="text-primary mr-2 h-5 w-5" />
                You're making excellent progress!
              </h3>
              <p className="text-muted-foreground mt-1">
                You've maintained a 12-day learning streak. Keep up the good work to achieve your goals faster.
              </p>
            </div>
            
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <h3 className="font-medium flex items-center text-amber-700 dark:text-amber-300">
                <ArrowUpRight className="mr-2 h-5 w-5" />
                Recommendation
              </h3>
              <p className="text-amber-600 dark:text-amber-400 mt-1">
                Based on your progress, we recommend focusing more on weekend learning to accelerate your roadmap completion.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressTracker;
