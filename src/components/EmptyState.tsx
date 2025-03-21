
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
}

export const EmptyState = ({ 
  title, 
  description, 
  action,
  icon = <FileQuestion className="h-12 w-12 text-muted-foreground/70" />
}: EmptyStateProps) => {
  return (
    <div className="col-span-full flex flex-col items-center justify-center text-center p-8 rounded-lg border-2 border-dashed">
      <div className="space-y-3 max-w-md">
        <div className="flex justify-center">{icon}</div>
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
        
        {action && (
          <div className="pt-3">
            <Button onClick={action.onClick}>
              {action.label}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
