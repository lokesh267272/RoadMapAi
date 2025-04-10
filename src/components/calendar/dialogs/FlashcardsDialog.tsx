
import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flashcard } from "../types";
import { Card } from "@/components/ui/card";
import { Check, X, RotateCw, Brain, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface FlashcardItemProps {
  flashcard: Flashcard;
  onToggleLearn: (id: string, isLearned: boolean) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  isUpdating: boolean;
}

const FlashcardItem: React.FC<FlashcardItemProps> = ({ flashcard, onToggleLearn, onDelete, isUpdating }) => {
  const [flipped, setFlipped] = useState(false);

  return (
    <div 
      className="relative mb-4 h-48 perspective" 
    >
      <div 
        className={`w-full h-full transition-transform duration-500 ${flipped ? 'rotate-y-180' : ''}`}
        style={{ transformStyle: 'preserve-3d' }}
        onClick={() => setFlipped(!flipped)}
      >
        {/* Front side */}
        <Card className="absolute w-full h-full flex flex-col p-4 cursor-pointer" style={{ backfaceVisibility: 'hidden' }}>
          <div className="text-xl font-semibold flex-1 flex items-center justify-center">
            {flashcard.term}
          </div>
          <div className="text-xs text-muted-foreground text-center">Click to flip</div>
        </Card>
        
        {/* Back side */}
        <Card 
          className="absolute w-full h-full flex flex-col p-4 cursor-pointer" 
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="text-md flex-1 flex items-center justify-center overflow-auto">
            {flashcard.definition}
          </div>
          <div className="text-xs text-muted-foreground text-center">Click to flip back</div>
        </Card>
      </div>
      
      {/* Control buttons */}
      <div className="absolute bottom-2 right-2 z-10 flex space-x-2">
        {/* Mark as learned button */}
        {flashcard.id && (
          <Button
            size="sm"
            variant={flashcard.is_learned ? "default" : "outline"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleLearn(flashcard.id!, !flashcard.is_learned!);
            }}
            disabled={isUpdating}
          >
            {flashcard.is_learned ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Learned
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-1" />
                Mark Learned
              </>
            )}
          </Button>
        )}
        
        {/* Delete button - only for saved flashcards */}
        {flashcard.id && onDelete && (
          <Button
            size="sm"
            variant="outline"
            className="text-destructive border-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(flashcard.id!);
            }}
            disabled={isUpdating}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

interface FlashcardsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicId: string;
  topicTitle: string;
  topicDescription?: string | null;
  generatedFlashcards: Flashcard[];
  savedFlashcards: Flashcard[];
  onSaveFlashcards: () => Promise<void>;
  isGenerating: boolean;
  isUpdating: boolean;
  onRegenerateFlashcards: () => Promise<void>;
}

const FlashcardsDialog: React.FC<FlashcardsDialogProps> = ({ 
  open, 
  onOpenChange, 
  topicId,
  topicTitle,
  topicDescription,
  generatedFlashcards,
  savedFlashcards,
  onSaveFlashcards,
  isGenerating,
  isUpdating,
  onRegenerateFlashcards
}) => {
  const { user } = useAuth();
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  
  const handleToggleLearn = async (id: string, isLearned: boolean) => {
    if (!user) return;
    
    try {
      // Use type casting to access the 'flashcards' table
      const { error } = await supabase
        .from('flashcards')
        .update({ is_learned: isLearned, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Update the local state in the parent component
      const updatedFlashcards = savedFlashcards.map(card => 
        card.id === id ? { ...card, is_learned: isLearned } : card
      );
      
      toast.success(`Flashcard marked as ${isLearned ? 'learned' : 'not learned'}`);
    } catch (error) {
      console.error("Error updating flashcard:", error);
      toast.error("Failed to update flashcard");
    }
  };
  
  const handleDeleteFlashcard = async (id: string) => {
    if (!user) return;
    
    try {
      setDeletingCardId(id);
      
      // Delete the flashcard from the database
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Update the local state - filter out the deleted flashcard
      const updatedFlashcards = savedFlashcards.filter(card => card.id !== id);
      
      toast.success("Flashcard deleted successfully");
    } catch (error) {
      console.error("Error deleting flashcard:", error);
      toast.error("Failed to delete flashcard");
    } finally {
      setDeletingCardId(null);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Flashcards: {topicTitle}
          </DialogTitle>
          <DialogDescription>
            Flip cards to see definitions. Mark cards as learned to track your progress.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="generated" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generated">Generated ({generatedFlashcards.length})</TabsTrigger>
            <TabsTrigger value="saved">Saved ({savedFlashcards.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="generated" className="mt-4">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center h-64">
                <RotateCw className="h-8 w-8 animate-spin text-primary mb-4" />
                <p>Generating flashcards...</p>
              </div>
            ) : generatedFlashcards.length > 0 ? (
              <>
                <div className="space-y-2">
                  {generatedFlashcards.map((flashcard, index) => (
                    <FlashcardItem 
                      key={index} 
                      flashcard={flashcard} 
                      onToggleLearn={handleToggleLearn}
                      isUpdating={isUpdating}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-4">
                  <Button 
                    variant="outline" 
                    onClick={onRegenerateFlashcards} 
                    disabled={isGenerating}
                  >
                    <RotateCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                  <Button 
                    onClick={onSaveFlashcards} 
                    disabled={isUpdating || generatedFlashcards.length === 0}
                  >
                    Save Flashcards
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No flashcards generated yet.</p>
                <Button 
                  onClick={onRegenerateFlashcards} 
                  disabled={isGenerating}
                >
                  Generate Flashcards
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="saved" className="mt-4">
            {savedFlashcards.length > 0 ? (
              <div className="space-y-2">
                {savedFlashcards.map((flashcard) => (
                  <FlashcardItem 
                    key={flashcard.id} 
                    flashcard={flashcard} 
                    onToggleLearn={handleToggleLearn}
                    onDelete={handleDeleteFlashcard}
                    isUpdating={isUpdating || deletingCardId === flashcard.id}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No saved flashcards yet.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Generate and save flashcards to see them here.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default FlashcardsDialog;
