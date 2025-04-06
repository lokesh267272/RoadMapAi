
import React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";

interface EditTopicFormProps {
  editTitle: string;
  setEditTitle: (title: string) => void;
  editDescription: string;
  setEditDescription: (description: string) => void;
  isUpdating: boolean;
  onCancel: () => void;
  onSave: () => Promise<void>;
}

const EditTopicForm: React.FC<EditTopicFormProps> = ({
  editTitle,
  setEditTitle,
  editDescription,
  setEditDescription,
  isUpdating,
  onCancel,
  onSave
}) => {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Topic Title</label>
        <Input 
          value={editTitle} 
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Enter topic title"
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Textarea 
          value={editDescription} 
          onChange={(e) => setEditDescription(e.target.value)}
          placeholder="Add details about this topic"
          rows={4}
        />
      </div>
      
      <DialogFooter>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isUpdating}
        >
          Cancel
        </Button>
        <Button
          onClick={onSave}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : "Save Changes"}
        </Button>
      </DialogFooter>
    </div>
  );
};

export default EditTopicForm;
