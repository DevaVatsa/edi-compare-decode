import { useState } from "react";
import { FileUploader } from "@/components/FileUploader";
import { EDIComparison } from "@/components/EDIComparison";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

export interface EDIFile {
  id: string;
  name: string;
  content: string;
  type: '834' | '820' | 'unknown';
  uploadedAt: Date;
}

const Index = () => {
  const [files, setFiles] = useState<EDIFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<{left?: EDIFile, right?: EDIFile}>({});

  const handleFileUpload = (newFiles: EDIFile[]) => {
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleFileSelect = (file: EDIFile, position: 'left' | 'right') => {
    setSelectedFiles(prev => ({
      ...prev,
      [position]: file
    }));
  };

  const handleFileRemove = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setSelectedFiles(prev => {
      const updated = { ...prev };
      if (updated.left?.id === fileId) delete updated.left;
      if (updated.right?.id === fileId) delete updated.right;
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex h-[calc(100vh-64px)]">
        <Sidebar 
          files={files}
          selectedFiles={selectedFiles}
          onFileSelect={handleFileSelect}
          onFileRemove={handleFileRemove}
        />
        <main className="flex-1 flex flex-col">
          {files.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <FileUploader onFilesUploaded={handleFileUpload} />
            </div>
          ) : (
            <EDIComparison 
              leftFile={selectedFiles.left}
              rightFile={selectedFiles.right}
              onFileUpload={handleFileUpload}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;