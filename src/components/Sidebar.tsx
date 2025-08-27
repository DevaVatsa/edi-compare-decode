import { File, X, FileType, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EDIFile } from "@/pages/Index";
import { formatDistanceToNow } from "date-fns";

interface SidebarProps {
  files: EDIFile[];
  selectedFiles: {left?: EDIFile, right?: EDIFile};
  onFileSelect: (file: EDIFile, position: 'left' | 'right') => void;
  onFileRemove: (fileId: string) => void;
}

export const Sidebar = ({ files, selectedFiles, onFileSelect, onFileRemove }: SidebarProps) => {
  const getFileTypeColor = (type: EDIFile['type']) => {
    switch (type) {
      case '834': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case '820': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-foreground mb-2">Uploaded Files</h2>
        <p className="text-sm text-muted-foreground">
          {files.length} file{files.length !== 1 ? 's' : ''} loaded
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {files.map((file) => (
            <div key={file.id} className="group relative bg-secondary/50 rounded-lg p-3 border border-border hover:bg-secondary/80 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <FileType className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate" title={file.name}>
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={getFileTypeColor(file.type)}>
                        {file.type.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(file.uploadedAt, { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFileRemove(file.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              <Separator className="my-2" />
              
              <div className="flex gap-2">
                <Button
                  variant={selectedFiles.left?.id === file.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => onFileSelect(file, 'left')}
                  className="flex-1 h-7 text-xs"
                >
                  Left Panel
                </Button>
                <Button
                  variant={selectedFiles.right?.id === file.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => onFileSelect(file, 'right')}
                  className="flex-1 h-7 text-xs"
                >
                  Right Panel
                </Button>
              </div>
            </div>
          ))}
          
          {files.length === 0 && (
            <div className="text-center py-8">
              <File className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No files uploaded yet</p>
              <p className="text-xs text-muted-foreground mt-1">Upload EDI files to get started</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};