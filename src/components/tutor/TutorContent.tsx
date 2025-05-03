
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BookOpen } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  // Parse and render content with special formatting
  const renderContent = () => {
    if (!content) return null;

    // Split by code blocks
    const parts = content.split(/```([\s\S]*?)```/);
    
    return parts.map((part, index) => {
      if (index % 2 === 0) {
        // Regular text - look for tables
        if (part.includes("|")) {
          const lines = part.split('\n');
          const tableIndices = [];
          
          // Find table start and end lines
          lines.forEach((line, i) => {
            if (line.trim().startsWith('|') && line.trim().endsWith('|') && line.includes('|')) {
              tableIndices.push(i);
            }
          });
          
          // Process tables and regular text
          let currentPos = 0;
          const renderedParts = [];
          
          for (let i = 0; i < tableIndices.length; i += 3) { // Tables typically have header, separator, and rows
            if (i + 2 < tableIndices.length) {
              // Add text before table
              if (tableIndices[i] > currentPos) {
                renderedParts.push(
                  <div key={`text-${index}-${i}`} className="prose max-w-none mb-4"
                    dangerouslySetInnerHTML={{ __html: lines.slice(currentPos, tableIndices[i]).join('\n') }}
                  />
                );
              }
              
              // Add table
              const tableRows = lines.slice(tableIndices[i], tableIndices[i + 2] + 1);
              renderedParts.push(renderTable(tableRows, `${index}-${i}`));
              
              currentPos = tableIndices[i + 2] + 1;
            }
          }
          
          // Add remaining text
          if (currentPos < lines.length) {
            renderedParts.push(
              <div key={`text-${index}-${currentPos}`} className="prose max-w-none mb-4"
                dangerouslySetInnerHTML={{ __html: lines.slice(currentPos).join('\n') }}
              />
            );
          }
          
          return renderedParts;
        }
        
        // Regular text without tables
        return (
          <div key={`text-${index}`} className="prose max-w-none mb-4"
            dangerouslySetInnerHTML={{ __html: part }}
          />
        );
      } else {
        // Code block
        return (
          <pre key={`code-${index}`} className="bg-muted p-4 rounded-md overflow-x-auto mb-4">
            <code>{part}</code>
          </pre>
        );
      }
    });
  };

  const renderTable = (tableLines: string[], keyPrefix: string) => {
    // Process table rows
    const rows = tableLines.map(line => 
      line.trim()
        .replace(/^\||\|$/g, '') // Remove first and last pipe
        .split('|')
        .map(cell => cell.trim())
    );
    
    // Skip separator row (typically row 1 with ----)
    const headerRow = rows[0];
    const dataRows = rows.slice(2);
    
    return (
      <div className="overflow-x-auto mb-4" key={`table-${keyPrefix}`}>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {headerRow.map((cell, i) => (
                <th key={`th-${keyPrefix}-${i}`} className="border px-4 py-2 text-left bg-muted">
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, rowIndex) => (
              <tr key={`tr-${keyPrefix}-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`td-${keyPrefix}-${rowIndex}-${cellIndex}`} className="border px-4 py-2">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
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
      <CardContent className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : topicId ? (
          <div className="prose max-w-none">
            {renderContent()}
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
