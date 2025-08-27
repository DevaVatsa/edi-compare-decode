import { useState, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Search, GitCompare, Eye, EyeOff } from "lucide-react";
import { EDIFile } from "@/pages/Index";
import { parseEDIContent, EDISegment } from "@/utils/ediParser";

interface ComparisonViewProps {
  leftFile?: EDIFile;
  rightFile?: EDIFile;
}

type DiffType = 'added' | 'removed' | 'modified' | 'unchanged';

interface ComparisonLine {
  leftSegment?: EDISegment;
  rightSegment?: EDISegment;
  diffType: DiffType;
  leftLineNumber?: number;
  rightLineNumber?: number;
}

export const ComparisonView = ({ leftFile, rightFile }: ComparisonViewProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);

  const comparisonData = useMemo(() => {
    if (!leftFile || !rightFile) return [];

    const leftData = parseEDIContent(leftFile.content);
    const rightData = parseEDIContent(rightFile.content);
    
    const maxLength = Math.max(leftData.segments.length, rightData.segments.length);
    const comparison: ComparisonLine[] = [];

    for (let i = 0; i < maxLength; i++) {
      const leftSegment = leftData.segments[i];
      const rightSegment = rightData.segments[i];

      let diffType: DiffType = 'unchanged';
      
      if (!leftSegment && rightSegment) {
        diffType = 'added';
      } else if (leftSegment && !rightSegment) {
        diffType = 'removed';
      } else if (leftSegment && rightSegment) {
        if (leftSegment.raw !== rightSegment.raw) {
          diffType = 'modified';
        }
      }

      comparison.push({
        leftSegment,
        rightSegment,
        diffType,
        leftLineNumber: leftSegment?.lineNumber,
        rightLineNumber: rightSegment?.lineNumber
      });
    }

    return comparison;
  }, [leftFile, rightFile]);

  const filteredComparison = useMemo(() => {
    let filtered = comparisonData;

    if (showOnlyDifferences) {
      filtered = filtered.filter(line => line.diffType !== 'unchanged');
    }

    if (searchTerm) {
      filtered = filtered.filter(line => 
        (line.leftSegment?.raw.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (line.rightSegment?.raw.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (line.leftSegment?.tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (line.rightSegment?.tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return filtered;
  }, [comparisonData, searchTerm, showOnlyDifferences]);

  const diffStats = useMemo(() => {
    const stats = {
      added: 0,
      removed: 0,
      modified: 0,
      unchanged: 0
    };

    comparisonData.forEach(line => {
      stats[line.diffType]++;
    });

    return stats;
  }, [comparisonData]);

  const highlightSegmentHTML = (segment: EDISegment) => {
    const elements = segment.raw.split(/[\*~]/);
    
    return elements.map((element, index) => {
      if (index === 0) {
        return `<span class="edi-segment">${element}</span>`;
      } else {
        const cssClass = getElementClass(element);
        return `<span class="edi-separator">*</span><span class="${cssClass}">${element}</span>`;
      }
    }).join('');
  };

  const getElementClass = (element: string): string => {
    if (/^\d{8}$/.test(element) || /^\d{6}$/.test(element)) {
      return 'edi-date';
    }
    if (/^\d+(\.\d+)?$/.test(element)) {
      return 'edi-number';
    }
    if (element.length <= 3 && /^[A-Z0-9]+$/.test(element)) {
      return 'edi-qualifier';
    }
    return 'edi-element';
  };

  const getDiffClass = (diffType: DiffType): string => {
    switch (diffType) {
      case 'added': return 'diff-added';
      case 'removed': return 'diff-removed';
      case 'modified': return 'diff-modified';
      default: return '';
    }
  };

  if (!leftFile || !rightFile) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <GitCompare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">File Comparison</h3>
          <p className="text-muted-foreground mb-4">
            Select two files from the sidebar to compare them side by side
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500/20 border border-green-500/40 rounded"></div>
              <span>Added</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500/20 border border-red-500/40 rounded"></div>
              <span>Removed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500/20 border border-yellow-500/40 rounded"></div>
              <span>Modified</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <h2 className="font-semibold text-foreground">File Comparison</h2>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded"></div>
                <span className="text-muted-foreground">{diffStats.added} added</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded"></div>
                <span className="text-muted-foreground">{diffStats.removed} removed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded"></div>
                <span className="text-muted-foreground">{diffStats.modified} modified</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-500 rounded"></div>
                <span className="text-muted-foreground">{diffStats.unchanged} unchanged</span>
              </div>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowOnlyDifferences(!showOnlyDifferences)}
            className="flex items-center gap-2"
          >
            {showOnlyDifferences ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {showOnlyDifferences ? 'Show All' : 'Differences Only'}
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search in comparison..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredComparison.length} lines
          </span>
        </div>
      </div>

      <div className="flex-1 flex">
        <div className="flex-1 border-r border-border">
          <div className="p-3 border-b border-border bg-card">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {parseEDIContent(leftFile.content).type.toUpperCase()}
              </Badge>
              <h3 className="font-medium text-sm text-foreground truncate">
                {leftFile.name}
              </h3>
            </div>
          </div>
          <ScrollArea className="h-[calc(100%-60px)] editor-scrollbar">
            <div className="edi-editor">
              {filteredComparison.map((line, index) => (
                <div key={index} className={`edi-line flex ${getDiffClass(line.diffType)}`}>
                  <div className="w-12 text-editor-line-number text-xs pr-3 text-right flex-shrink-0 select-none">
                    {line.leftLineNumber || ''}
                  </div>
                  <div className="flex-1 min-w-0">
                    {line.leftSegment ? (
                      <div dangerouslySetInnerHTML={{ __html: highlightSegmentHTML(line.leftSegment) }} />
                    ) : (
                      <div className="text-muted-foreground italic text-xs">— No content —</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1">
          <div className="p-3 border-b border-border bg-card">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {parseEDIContent(rightFile.content).type.toUpperCase()}
              </Badge>
              <h3 className="font-medium text-sm text-foreground truncate">
                {rightFile.name}
              </h3>
            </div>
          </div>
          <ScrollArea className="h-[calc(100%-60px)] editor-scrollbar">
            <div className="edi-editor">
              {filteredComparison.map((line, index) => (
                <div key={index} className={`edi-line flex ${getDiffClass(line.diffType)}`}>
                  <div className="w-12 text-editor-line-number text-xs pr-3 text-right flex-shrink-0 select-none">
                    {line.rightLineNumber || ''}
                  </div>
                  <div className="flex-1 min-w-0">
                    {line.rightSegment ? (
                      <div dangerouslySetInnerHTML={{ __html: highlightSegmentHTML(line.rightSegment) }} />
                    ) : (
                      <div className="text-muted-foreground italic text-xs">— No content —</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};