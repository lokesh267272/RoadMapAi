
import { FC } from "react";
import { Brain, GitBranch, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GenerationAnimationProps {
  isLoading: boolean;
  progress: number;
  isAIGenerated: boolean;
}

const GenerationAnimation: FC<GenerationAnimationProps> = ({ 
  isLoading, 
  progress, 
  isAIGenerated 
}) => {
  if (!isLoading) return null;
  
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 text-center">
        <motion.div 
          className="relative mx-auto"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative">
            {/* Background pulsing circle */}
            <motion.div 
              className="absolute inset-0 rounded-full bg-primary/10"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.7, 0.3]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                repeatType: "loop"
              }}
            />
            
            {/* Mid circle */}
            <motion.div 
              className="absolute inset-0 rounded-full bg-primary/20"
              animate={{ 
                scale: [0.8, 1, 0.8],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "loop",
                delay: 0.2
              }}
            />
            
            {/* Inner circle with icon */}
            <div className={cn(
              "relative h-24 w-24 rounded-full flex items-center justify-center",
              "bg-primary text-primary-foreground"
            )}>
              {isAIGenerated ? (
                <>
                  <Brain className="h-10 w-10 animate-pulse" />
                  <motion.div 
                    className="absolute inset-0 rounded-full border-4 border-primary-foreground" 
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: progress / 100 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    style={{
                      clipPath: `polygon(50% 50%, 50% 0%, ${progress * 3.6}deg, 50% 50%)`,
                      rotate: `-90deg`,
                      transformOrigin: "center"
                    }}
                  />
                </>
              ) : (
                <GitBranch className="h-10 w-10 animate-pulse" />
              )}
            </div>
          </div>
        </motion.div>
        
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-2xl font-bold tracking-tight">
            {isAIGenerated ? "AI is crafting your roadmap" : "Generating your roadmap"}
          </h3>
          
          <div className="text-muted-foreground max-w-sm mx-auto">
            <p>{isAIGenerated 
              ? "Our AI is analyzing your learning goals and designing a personalized learning path..." 
              : "Creating your learning roadmap..."}
            </p>
          </div>
          
          <motion.div 
            className="flex items-center justify-center gap-2 text-primary"
            animate={{ 
              opacity: [0.5, 1, 0.5], 
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity,
              repeatType: "loop"
            }}
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{progress}% complete</span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default GenerationAnimation;
