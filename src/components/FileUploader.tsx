import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EDIFile } from "@/pages/Index";
import { detectEDIType } from "@/utils/ediParser";

interface FileUploaderProps {
  onFilesUploaded: (files: EDIFile[]) => void;
  compact?: boolean;
}

export const FileUploader = ({ onFilesUploaded, compact = false }: FileUploaderProps) => {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    
    try {
      const ediFiles: EDIFile[] = [];
      
      for (const file of acceptedFiles) {
        const content = await file.text();
        const type = detectEDIType(content);
        
        ediFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          content,
          type,
          uploadedAt: new Date()
        });
      }
      
      onFilesUploaded(ediFiles);
    } catch (err) {
      setError('Failed to process files. Please ensure they are valid text files.');
    }
  }, [onFilesUploaded]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt', '.edi', '.x12'],
      'application/octet-stream': ['.edi', '.x12']
    },
    multiple: true
  });

  if (compact) {
    return (
      <div className="p-4 border-b border-border">
        <Button
          {...getRootProps()}
          variant="outline"
          className="w-full h-10"
        >
          <input {...getInputProps()} />
          <Upload className="h-4 w-4 mr-2" />
          Upload More Files
        </Button>
        {error && (
          <Alert className="mt-2" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <Card className="p-8">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-border'}
            ${isDragReject ? 'border-destructive bg-destructive/5' : ''}
            hover:border-primary hover:bg-primary/5
          `}
        >
          <input {...getInputProps()} />
          
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-primary/10 rounded-full">
                <FileText className="h-8 w-8 text-primary" />
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Upload EDI Files
              </h3>
              <p className="text-muted-foreground mb-4">
                Drag and drop your EDI 834 or 820 files here, or click to browse
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <span>Supported formats:</span>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-secondary rounded text-xs">.txt</span>
                  <span className="px-2 py-1 bg-secondary rounded text-xs">.edi</span>
                  <span className="px-2 py-1 bg-secondary rounded text-xs">.x12</span>
                </div>
              </div>
            </div>
            
            <Button variant="outline" size="lg">
              <Upload className="h-4 w-4 mr-2" />
              Choose Files
            </Button>
          </div>
        </div>
        
        {error && (
          <Alert className="mt-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </Card>
    </div>
  );
};