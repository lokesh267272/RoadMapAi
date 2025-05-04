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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
interface TutorContentProps {
  topicId: string;
  topicTitle: string;
}
const TutorContent = ({
  topicId,
  topicTitle
}: TutorContentProps) => {
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
      const {
        data,
        error
      } = await supabase.functions.invoke("generate-tutor-content", {
        body: {
          topicId,
          topicTitle
        }
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
  return <Card className="h-full flex flex-col shadow-md">
      <CardHeader className="p-4 pb-3 sm:p-5 sm:pb-3">
        <div className="flex items-center">
          <BookOpen className="w-5 h-5 mr-2.5 text-primary" />
          <CardTitle className="text-xl font-semibold tracking-tight">Tutorial</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {topicTitle || "Select a topic to begin learning"}
        </p>
      </CardHeader>
      <Separator />
      <CardContent className="p-0 flex-1 overflow-auto">
        {isLoading ? <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div> : topicId ? <div className="prose prose-sm max-w-none dark:prose-invert p-3 sm:p-6">
            <ReactMarkdown components={{
          // Custom table rendering
          table: ({
            node,
            ...props
          }) => <div className="my-4 sm:my-6 overflow-x-auto">
                    <Table {...props} className="border rounded-md text-sm" />
                  </div>,
          thead: ({
            node,
            ...props
          }) => <TableHeader {...props} />,
          tbody: ({
            node,
            ...props
          }) => <TableBody {...props} />,
          tr: ({
            node,
            ...props
          }) => <TableRow {...props} />,
          th: ({
            node,
            ...props
          }) => <TableHead className="font-semibold bg-muted/50" {...props} />,
          td: ({
            node,
            ...props
          }) => <TableCell className="p-2 sm:p-4" {...props} />,
          // Code block with syntax highlighting
          code: ({
            node,
            className,
            children,
            ...props
          }) => {
            const match = /language-(\w+)/.exec(className || "");
            return match ? <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" className="rounded-md border my-4 sm:my-6 text-sm sm:text-[14px] leading-relaxed" showLineNumbers={true} {...props}>
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter> : <code className={cn("bg-muted px-1.5 py-1 rounded-md text-sm font-mono", className)} {...props}>
                      {children}
                    </code>;
          },
          // Enhanced headings
          h1: ({
            node,
            ...props
          }) => <h1 className="text-xl sm:text-2xl font-bold mt-6 sm:mt-8 mb-3 sm:mb-4 text-primary-foreground/90" {...props} />,
          h2: ({
            node,
            ...props
          }) => <h2 className="text-lg sm:text-xl font-bold mt-5 sm:mt-6 mb-2 sm:mb-3 text-primary-foreground" />,
          h3: ({
            node,
            ...props
          }) => <h3 className="text-base sm:text-lg font-semibold mt-4 sm:mt-5 mb-2 sm:mb-2.5 text-primary-foreground/90" {...props} />,
          // Enhanced paragraphs and lists
          p: ({
            node,
            ...props
          }) => <p className="my-3 sm:my-4 leading-relaxed text-base" {...props} />,
          ul: ({
            node,
            ...props
          }) => <ul className="my-3 sm:my-4 ml-4 sm:ml-6 space-y-1.5 sm:space-y-2 list-disc" {...props} />,
          ol: ({
            node,
            ...props
          }) => <ol className="my-3 sm:my-4 ml-4 sm:ml-6 space-y-1.5 sm:space-y-2 list-decimal" {...props} />,
          li: ({
            node,
            ...props
          }) => <li className="leading-relaxed" {...props} />
        }}>
              {content}
            </ReactMarkdown>
          </div> : <div className="text-center text-muted-foreground p-6 sm:p-12 flex flex-col items-center justify-center h-64">
            <BookOpen className="w-8 sm:w-10 h-8 sm:h-10 mb-3 sm:mb-4 text-muted-foreground/60" />
            <p className="text-base sm:text-lg font-medium mb-2">No topic selected</p>
            <p>Select a topic to view the tutorial content</p>
          </div>}
      </CardContent>
    </Card>;
};
export default TutorContent;