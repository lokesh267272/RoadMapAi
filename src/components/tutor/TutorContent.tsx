
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BookOpen } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface TutorContentProps {
  topicId: string;
  topicTitle: string;
}

const TutorContent = ({ topicId, topicTitle }: TutorContentProps) => {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Generate content when topic changes
  useEffect(() => {
    if (topicId && topicTitle) {
      generateContent();
    }
  }, [topicId, topicTitle]);

  const generateContent = async () => {
    if (!topicId || !topicTitle) return;
    
    setIsLoading(true);
    setContent(""); // Clear previous content

    try {
      const { data, error } = await supabase.functions.invoke("generate-tutor-content", {
        body: {
          topicId,
          topicTitle
        },
      });

      if (error) throw error;
      
      setContent(data.content);
    } catch (error) {
      console.error("Error generating tutor content:", error);
      toast.error("Failed to generate tutorial content");
      setContent("Failed to load content. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center mb-1">
          <BookOpen className="w-5 h-5 mr-2 text-primary" />
          <CardTitle className="text-lg">Tutorial</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          {topicTitle || "Select a topic to begin learning"}
        </p>
      </CardHeader>
      <Separator />
      <CardContent className="p-4 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : topicId ? (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown
              components={{
                // Custom table rendering
                table: ({ node, ...props }) => (
                  <div className="my-4 overflow-x-auto">
                    <Table {...props} />
                  </div>
                ),
                thead: ({ node, ...props }) => <TableHeader {...props} />,
                tbody: ({ node, ...props }) => <TableBody {...props} />,
                tr: ({ node, ...props }) => <TableRow {...props} />,
                th: ({ node, ...props }) => <TableHead {...props} />,
                td: ({ node, ...props }) => <TableCell {...props} />,
                
                // Code block with syntax highlighting
                code: ({ node, className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || "");
                  return match ? (
                    <SyntaxHighlighter 
                      style={vscDarkPlus} 
                      language={match[1]} 
                      PreTag="div"
                      className="rounded-md border"
                      {...props}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={cn("bg-muted px-1 py-0.5 rounded text-sm", className)} {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-12">
            Select a topic from the sidebar to view the tutorial content
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TutorContent;
