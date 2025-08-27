import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, FileText, Info } from "lucide-react";
import { EDIFile } from "@/pages/Index";
import { parseEDIContent, decodeEDI834Segment, decodeEDI820Segment, EDISegment } from "@/utils/ediParser";

interface EDIDecoderProps {
  leftFile?: EDIFile;
  rightFile?: EDIFile;
}

export const EDIDecoder = ({ leftFile, rightFile }: EDIDecoderProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const DecodePanel = ({ file, title }: { file?: EDIFile; title: string }) => {
    if (!file) {
      return (
        <div className="flex-1 flex items-center justify-center bg-card border border-border rounded-lg m-2">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No file selected for {title}</p>
          </div>
        </div>
      );
    }

    const ediData = parseEDIContent(file.content);
    
    const filteredSegments = ediData.segments.filter(segment => 
      searchTerm === "" || 
      segment.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      decodeSegment(segment, ediData.type).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const decodeSegment = (segment: EDISegment, type: '834' | '820' | 'unknown'): string => {
      if (type === '834') {
        return decodeEDI834Segment(segment);
      } else if (type === '820') {
        return decodeEDI820Segment(segment);
      }
      return `${segment.tag} - ${segment.elements.slice(1).join(', ')}`;
    };

    return (
      <div className="flex-1 flex flex-col m-2">
        <div className="p-4 border-b border-border bg-card rounded-t-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-foreground">{title}</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {ediData.type.toUpperCase()}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {filteredSegments.length} segments
              </span>
            </div>
          </div>
          
          {ediData.metadata.sender && (
            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
              <div>
                <span className="text-muted-foreground">Sender:</span>
                <p className="font-medium">{ediData.metadata.sender}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Receiver:</span>
                <p className="font-medium">{ediData.metadata.receiver}</p>
              </div>
              {ediData.metadata.date && (
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <p className="font-medium">{ediData.metadata.date}</p>
                </div>
              )}
              {ediData.metadata.controlNumber && (
                <div>
                  <span className="text-muted-foreground">Control #:</span>
                  <p className="font-medium">{ediData.metadata.controlNumber}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 bg-card border-x border-b border-border rounded-b-lg">
          <div className="p-4 space-y-3">
            {filteredSegments.map((segment, index) => (
              <Card key={`${segment.lineNumber}-${index}`} className="p-3">
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs font-mono">
                      {segment.tag}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Line {segment.lineNumber}
                    </span>
                  </div>
                </div>
                
                <div className="mt-2">
                  <p className="text-sm text-foreground font-medium mb-1">
                    {decodeSegment(segment, ediData.type)}
                  </p>
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer hover:text-foreground flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Raw Data
                    </summary>
                    <code className="block mt-2 p-2 bg-secondary/50 rounded font-mono">
                      {segment.raw}
                    </code>
                  </details>
                </div>
              </Card>
            ))}
            
            {filteredSegments.length === 0 && searchTerm && (
              <div className="text-center py-8">
                <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No segments found matching "{searchTerm}"</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold text-foreground">EDI Decoder</h2>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search decoded segments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <DecodePanel file={leftFile} title={leftFile?.name || "Left Panel"} />
        <DecodePanel file={rightFile} title={rightFile?.name || "Right Panel"} />
      </div>
    </div>
  );
};