
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, RefreshCw } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import TutorMarkdown from "./TutorMarkdown";
import TutorEmptyState from "./TutorEmptyState";
import TutorLoading from "./TutorLoading";
import { useTutorContent } from "./hooks/useTutorContent";

interface TutorContentProps {
  topicId: string;
  topicTitle: string;
}

const TutorContent = ({
  topicId,
  topicTitle
}: TutorContentProps) => {
  const { content, isLoading, isFromCache, generateContent } = useTutorContent(topicId, topicTitle);

  const handleRefresh = () => {
    generateContent();
  };

  return (
    <Card className="h-full flex flex-col shadow-md">
      <CardHeader className="p-4 pb-3 sm:p-5 sm:pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BookOpen className="w-5 h-5 mr-2.5 text-primary" />
            <CardTitle className="text-xl font-semibold tracking-tight">Tutorial</CardTitle>
          </div>
          {isFromCache && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh} 
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Refresh content"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="sr-only">Refresh content</span>
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {topicTitle || "Select a topic to begin learning"}
          {isFromCache && <span className="text-xs ml-2 text-muted-foreground">(cached)</span>}
        </p>
      </CardHeader>
      <Separator />
      <CardContent className="p-0 flex-1 overflow-auto">
        {isLoading ? (
          <TutorLoading />
        ) : topicId ? (
          <div className="prose prose-sm max-w-none dark:prose-invert p-3 sm:p-6">
            <TutorMarkdown content={content} />
          </div>
        ) : (
          <TutorEmptyState />
        )}
      </CardContent>
    </Card>
  );
};

export default TutorContent;
