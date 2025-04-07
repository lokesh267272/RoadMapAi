
import React from "react";
import { Calendar } from "@/components/ui/calendar";
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { isBefore, isToday } from "date-fns";

interface RescheduleFormProps {
  rescheduleDate: Date | undefined;
  setRescheduleDate: (date: Date | undefined) => void;
  isUpdating: boolean;
  onCancel: () => void;
  onReschedule: () => void;
}

const RescheduleForm: React.FC<RescheduleFormProps> = ({
  rescheduleDate,
  setRescheduleDate,
  isUpdating,
  onCancel,
  onReschedule
}) => {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Select New Date</label>
        <div className="border rounded-md p-3">
          <Calendar
            mode="single"
            selected={rescheduleDate}
            onSelect={setRescheduleDate}
            disabled={(date) => isBefore(date, new Date()) && !isToday(date)}
            initialFocus
          />
        </div>
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
          onClick={onReschedule}
          disabled={isUpdating || !rescheduleDate}
        >
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : "Reschedule Topic"}
        </Button>
      </DialogFooter>
    </div>
  );
};

export default RescheduleForm;
