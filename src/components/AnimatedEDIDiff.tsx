import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut,
  GitCompare,
  CheckCircle2,
  XCircle,
  ArrowRight
} from "lucide-react";
import { EDIFile } from "@/pages/Index";
import { parseEDIContent } from "@/utils/ediParser";
import { useToast } from "@/hooks/use-toast";

interface AnimatedEDIDiffProps {
  leftFile?: EDIFile;
  rightFile?: EDIFile;
}

interface DiffSegment {
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  leftTag?: string;
  rightTag?: string;
  leftContent?: string;
  rightContent?: string;
  index: number;
}

export const AnimatedEDIDiff = ({ leftFile, rightFile }: AnimatedEDIDiffProps) => {
  const { toast } = useToast();
  const [isAnimating, setIsAnimating] = useState(false);
  const [diffSegments, setDiffSegments] = useState<DiffSegment[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate diff between two files
  useEffect(() => {
    if (!leftFile || !rightFile) {
      setDiffSegments([]);
      return;
    }

    const leftParsed = parseEDIContent(leftFile.content);
    const rightParsed = parseEDIContent(rightFile.content);
    
    const diffs: DiffSegment[] = [];
    const maxLength = Math.max(leftParsed.segments.length, rightParsed.segments.length);

    for (let i = 0; i < maxLength; i++) {
      const leftSeg = leftParsed.segments[i];
      const rightSeg = rightParsed.segments[i];

      if (!leftSeg && rightSeg) {
        diffs.push({
          type: 'added',
          rightTag: rightSeg.tag,
          rightContent: rightSeg.raw,
          index: i
        });
      } else if (leftSeg && !rightSeg) {
        diffs.push({
          type: 'removed',
          leftTag: leftSeg.tag,
          leftContent: leftSeg.raw,
          index: i
        });
      } else if (leftSeg && rightSeg) {
        if (leftSeg.raw === rightSeg.raw) {
          diffs.push({
            type: 'unchanged',
            leftTag: leftSeg.tag,
            rightTag: rightSeg.tag,
            leftContent: leftSeg.raw,
            rightContent: rightSeg.raw,
            index: i
          });
        } else {
          diffs.push({
            type: 'modified',
            leftTag: leftSeg.tag,
            rightTag: rightSeg.tag,
            leftContent: leftSeg.raw,
            rightContent: rightSeg.raw,
            index: i
          });
        }
      }
    }

    setDiffSegments(diffs);
    setCurrentFrame(0);
  }, [leftFile, rightFile]);

  const startAnimation = () => {
    if (!containerRef.current || diffSegments.length === 0) return;
    
    setIsAnimating(true);
    let frame = 0;

    const segments = containerRef.current.querySelectorAll('.diff-segment') as NodeListOf<HTMLElement>;
    
    // Stagger animation using CSS transitions
    segments.forEach((segment, index) => {
      setTimeout(() => {
        segment.style.opacity = '1';
        segment.style.transform = 'translateX(0) scale(1)';
        setCurrentFrame(index);
        
        if (index === segments.length - 1) {
          setTimeout(() => {
            setIsAnimating(false);
            toast({
              title: "Animation Complete",
              description: `Visualized ${diffSegments.length} segments`,
            });
          }, 300);
        }
      }, index * 50);
    });
  };

  const resetAnimation = () => {
    if (!containerRef.current) return;
    
    const segments = containerRef.current.querySelectorAll('.diff-segment') as NodeListOf<HTMLElement>;
    segments.forEach(segment => {
      segment.style.opacity = '0';
      segment.style.transform = 'translateX(-100px) scale(0.8)';
    });
    
    setCurrentFrame(0);
    setIsAnimating(false);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };

  const getDiffIcon = (type: DiffSegment['type']) => {
    switch (type) {
      case 'added':
        return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
      case 'removed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'modified':
        return <ArrowRight className="h-4 w-4 text-amber-500" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
  };

  const getDiffColor = (type: DiffSegment['type']) => {
    switch (type) {
      case 'added':
        return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800';
      case 'removed':
        return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800';
      case 'modified':
        return 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800';
    }
  };

  if (!leftFile || !rightFile) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <GitCompare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Animated EDI Diff Viewer</h3>
            <p className="text-muted-foreground text-sm">
              Select two EDI files from the sidebar to visualize their differences with smooth animations
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = {
    total: diffSegments.length,
    added: diffSegments.filter(d => d.type === 'added').length,
    removed: diffSegments.filter(d => d.type === 'removed').length,
    modified: diffSegments.filter(d => d.type === 'modified').length,
    unchanged: diffSegments.filter(d => d.type === 'unchanged').length
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with controls */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <GitCompare className="h-6 w-6" />
              Animated EDI Diff Viewer
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Comparing: <span className="font-mono">{leftFile.name}</span> vs <span className="font-mono">{rightFile.name}</span>
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={startAnimation}
              disabled={isAnimating}
              size="sm"
            >
              <Play className="h-4 w-4 mr-2" />
              {isAnimating ? 'Animating...' : 'Play Animation'}
            </Button>
            
            <Button
              onClick={resetAnimation}
              variant="outline"
              size="sm"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>

            <div className="border-l border-border mx-2" />

            <Button
              onClick={handleZoomOut}
              variant="outline"
              size="sm"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={handleZoomIn}
              variant="outline"
              size="sm"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="flex gap-4">
          <Badge variant="outline" className="text-xs">
            Total: {stats.total}
          </Badge>
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            Added: {stats.added}
          </Badge>
          <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
            Removed: {stats.removed}
          </Badge>
          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
            Modified: {stats.modified}
          </Badge>
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
            Unchanged: {stats.unchanged}
          </Badge>
          {isAnimating && (
            <Badge variant="outline" className="text-xs">
              Frame: {currentFrame + 1}/{stats.total}
            </Badge>
          )}
        </div>
      </div>

      {/* Diff view */}
      <ScrollArea className="flex-1">
        <div 
          ref={containerRef}
          className="p-4 space-y-2"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
        >
          {diffSegments.map((diff, index) => (
            <div
              key={index}
              className={`diff-segment border rounded-lg p-3 transition-all duration-300 ${getDiffColor(diff.type)}`}
              style={{
                opacity: 0,
                transform: 'translateX(-100px) scale(0.8)'
              }}
            >
              <div className="flex items-start gap-3">
                {getDiffIcon(diff.type)}
                
                <div className="flex-1 grid grid-cols-2 gap-4">
                  {/* Left side */}
                  <div>
                    {diff.leftContent ? (
                      <>
                        <div className="text-xs font-semibold text-muted-foreground mb-1">
                          {leftFile.name}
                        </div>
                        <div className="font-mono text-sm">
                          {diff.leftTag && (
                            <span className="text-primary font-bold">{diff.leftTag}*</span>
                          )}
                          <span className={diff.type === 'removed' ? 'line-through opacity-60' : ''}>
                            {diff.leftContent}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-muted-foreground italic">
                        (not present)
                      </div>
                    )}
                  </div>

                  {/* Right side */}
                  <div>
                    {diff.rightContent ? (
                      <>
                        <div className="text-xs font-semibold text-muted-foreground mb-1">
                          {rightFile.name}
                        </div>
                        <div className="font-mono text-sm">
                          {diff.rightTag && (
                            <span className="text-primary font-bold">{diff.rightTag}*</span>
                          )}
                          <span className={diff.type === 'added' ? 'font-semibold' : ''}>
                            {diff.rightContent}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-muted-foreground italic">
                        (not present)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
