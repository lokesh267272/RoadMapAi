
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";

interface TutorialRendererProps {
  content: string;
}

const TutorialRenderer = ({ content }: TutorialRendererProps) => {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert p-3 sm:p-6">
      <ReactMarkdown
        components={{
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
          h1: ({ node, ...props }) => <h1 className="text-xl sm:text-2xl font-bold mt-6 sm:mt-8 mb-3 sm:mb-4 text-foreground" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-lg sm:text-xl font-bold mt-5 sm:mt-6 mb-2 sm:mb-3 text-foreground" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-base sm:text-lg font-semibold mt-4 sm:mt-5 mb-2 sm:mb-2.5 text-foreground" {...props} />,
          // Enhanced paragraphs and lists
          p: ({ node, ...props }) => <p className="my-3 sm:my-4 leading-relaxed text-base text-foreground" {...props} />,
          ul: ({ node, ...props }) => <ul className="my-3 sm:my-4 ml-4 sm:ml-6 space-y-1.5 sm:space-y-2 list-disc" {...props} />,
          ol: ({ node, ...props }) => <ol className="my-3 sm:my-4 ml-4 sm:ml-6 space-y-1.5 sm:space-y-2 list-decimal" {...props} />,
          li: ({ node, ...props }) => <li className="leading-relaxed text-foreground" {...props} />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default TutorialRenderer;
