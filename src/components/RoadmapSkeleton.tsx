
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface RoadmapSkeletonProps {
  count?: number;
}

export const RoadmapSkeleton = ({ count = 3 }: RoadmapSkeletonProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="overflow-hidden border animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="h-6 bg-muted rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
                <div className="h-4 bg-muted rounded w-4/6"></div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="px-6 py-4 bg-muted/30 flex justify-between">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-4 bg-muted rounded w-1/4"></div>
          </CardFooter>
        </Card>
      ))}
    </>
  );
};
