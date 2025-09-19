import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZoomIn, ZoomOut, Search, AlertTriangle, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EDIFile } from "@/pages/Index";
import { parseEDIContent, EDISegment } from "@/utils/ediParser";
import { validateEDITransaction, EDIError } from "@/utils/ediValidator";
import { ErrorSummary } from "./ErrorSummary";

interface EDIViewerProps {
  file: EDIFile;
}

export const EDIViewer = ({ file }: EDIViewerProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [fontSize, setFontSize] = useState(14);
  const [showValidation, setShowValidation] = useState(true);
  
  const ediData = parseEDIContent(file.content);
  const validationResult = validateEDITransaction(ediData);
  
  // Create a map of line numbers to errors for quick lookup
  const errorsByLine = new Map<number, EDIError[]>();
  [...validationResult.errors, ...validationResult.warnings].forEach(error => {
    const lineNumber = error.segment.lineNumber;
    if (!errorsByLine.has(lineNumber)) {
      errorsByLine.set(lineNumber, []);
    }
    errorsByLine.get(lineNumber)!.push(error);
  });
  
  const filteredSegments = ediData.segments.filter(segment => 
    searchTerm === "" || 
    segment.raw.toLowerCase().includes(searchTerm.toLowerCase()) ||
    segment.tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const getLineClassName = (segment: EDISegment): string => {
    const errors = errorsByLine.get(segment.lineNumber) || [];
    if (errors.some(e => e.type === 'critical')) {
      return 'border-l-2 border-l-destructive bg-destructive/5';
    }
    if (errors.some(e => e.type === 'warning')) {
      return 'border-l-2 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20';
    }
    return '';
  };

  return (
    <div className="h-full flex flex-col">
      {showValidation && (
        <div className="border-b border-border">
          <ErrorSummary files={[file]} />
        </div>
      )}
      
      <div className="p-3 border-b border-border bg-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              {ediData.type.toUpperCase()}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {filteredSegments.length} segments
            </span>
            <div className="flex items-center gap-2">
              {validationResult.isValid ? (
                <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Valid
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {validationResult.totalIssues} Issues
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowValidation(!showValidation)}
              className="text-xs"
            >
              {showValidation ? 'Hide' : 'Show'} Validation
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFontSize(Math.max(10, fontSize - 1))}
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
            <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
              {fontSize}px
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFontSize(Math.min(20, fontSize + 1))}
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search segments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-8"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 editor-scrollbar">
        <div className="edi-editor" style={{ fontSize: `${fontSize}px` }}>
          {filteredSegments.map((segment, index) => {
            const lineErrors = errorsByLine.get(segment.lineNumber) || [];
            return (
              <div key={`${segment.lineNumber}-${index}`} className={`edi-line flex ${getLineClassName(segment)}`}>
                <div className="w-12 text-editor-line-number text-xs pr-3 text-right flex-shrink-0 select-none flex items-center justify-end">
                  <span>{segment.lineNumber}</span>
                  {lineErrors.length > 0 && (
                    <div className="ml-1">
                      {lineErrors.some(e => e.type === 'critical') ? (
                        <AlertTriangle className="h-3 w-3 text-destructive" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 text-yellow-500" />
                      )}
                    </div>
                  )}
                </div>
                <div 
                  className="flex-1 min-w-0"
                  dangerouslySetInnerHTML={{ __html: highlightSegmentHTML(segment) }}
                  title={lineErrors.length > 0 ? lineErrors.map(e => e.message).join('\n') : ''}
                />
              </div>
            );
          })}
          
          {filteredSegments.length === 0 && searchTerm && (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No segments found matching "{searchTerm}"</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};