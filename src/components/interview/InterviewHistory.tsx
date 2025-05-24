
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Award, Clock, Eye, TrendingUp, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InterviewHistoryProps {
  userId: string;
}

const InterviewHistory = ({ userId }: InterviewHistoryProps) => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, [userId]);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('interview-ai', {
        body: {
          action: 'get_session_history',
          sessionData: { userId }
        }
      });

      if (error) throw error;
      setSessions(data.sessions || []);
    } catch (error) {
      toast.error("Failed to load interview history");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      active: 'secondary',
      paused: 'outline'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const formatDuration = (startedAt: string, completedAt?: string) => {
    if (!completedAt) return 'In Progress';
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    const duration = Math.round((end.getTime() - start.getTime()) / 1000 / 60);
    return `${duration} minutes`;
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="animate-pulse">Loading interview history...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedSession) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Button 
            variant="outline" 
            onClick={() => setSelectedSession(null)}
          >
            ← Back to History
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {selectedSession.target_role} Interview
            </CardTitle>
            <CardDescription>
              {new Date(selectedSession.created_at).toLocaleDateString()} • 
              {formatDuration(selectedSession.started_at, selectedSession.completed_at)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Session Details */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Interview Details</h4>
                  <div className="space-y-2 text-sm">
                    <div>Type: {selectedSession.interview_type}</div>
                    <div>Experience Level: {selectedSession.experience_level}</div>
                    <div>Company Focus: {selectedSession.company_focus || 'General'}</div>
                    <div>Questions Asked: {selectedSession.total_questions}</div>
                    {selectedSession.overall_score && (
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Overall Score: {selectedSession.overall_score}/5.0
                      </div>
                    )}
                  </div>
                </div>

                {selectedSession.focus_areas && selectedSession.focus_areas.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Focus Areas</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSession.focus_areas.map((area, index) => (
                        <Badge key={index} variant="outline">{area}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Performance Metrics */}
              <div className="space-y-4">
                <h4 className="font-semibold">Performance Overview</h4>
                {selectedSession.interview_responses?.length > 0 ? (
                  <div className="space-y-3">
                    {selectedSession.interview_responses.map((response, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Question {index + 1}</span>
                          <Badge variant="outline">
                            {response.response_score || 'N/A'}/5.0
                          </Badge>
                        </div>
                        {response.positive_points && response.positive_points.length > 0 && (
                          <div className="text-xs text-green-600">
                            ✓ {response.positive_points[0]}
                          </div>
                        )}
                        {response.improvement_suggestions && response.improvement_suggestions.length > 0 && (
                          <div className="text-xs text-amber-600">
                            → {response.improvement_suggestions[0]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No detailed responses available</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Interview History</h2>
        <p className="text-gray-600">
          Review your past interview sessions and track your progress
        </p>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              No Interview History
            </h3>
            <p className="text-gray-500">
              Start your first mock interview to see your progress here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <Card key={session.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{session.target_role}</h3>
                    <p className="text-gray-600 capitalize">
                      {session.interview_type} Interview • {session.experience_level} Level
                    </p>
                  </div>
                  {getStatusBadge(session.status)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    {new Date(session.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    {formatDuration(session.started_at, session.completed_at)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <TrendingUp className="h-4 w-4" />
                    {session.total_questions || 0} Questions
                  </div>
                  {session.overall_score && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Award className="h-4 w-4" />
                      {session.overall_score}/5.0
                    </div>
                  )}
                </div>

                {session.focus_areas && session.focus_areas.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {session.focus_areas.slice(0, 3).map((area, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                      {session.focus_areas.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{session.focus_areas.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedSession(session)}
                  className="w-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default InterviewHistory;
