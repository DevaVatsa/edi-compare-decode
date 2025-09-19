import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUploader } from "./FileUploader";
import { EDIViewer } from "./EDIViewer";
import { EDIDecoder } from "./EDIDecoder";
import { ComparisonView } from "./ComparisonView";
import { JSONConverter } from "./JSONConverter";
import { EDIFile } from "@/pages/Index";
import { Eye, Code, GitCompare, FileJson } from "lucide-react";

interface EDIComparisonProps {
  leftFile?: EDIFile;
  rightFile?: EDIFile;
  onFileUpload: (files: EDIFile[]) => void;
}

export const EDIComparison = ({ leftFile, rightFile, onFileUpload }: EDIComparisonProps) => {
  const [activeTab, setActiveTab] = useState("compare");

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-border">
        <FileUploader onFilesUploaded={onFileUpload} compact />
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-12 mx-4 mb-4">
            <TabsTrigger value="compare" className="flex items-center gap-2">
              <GitCompare className="h-4 w-4" />
              Compare
            </TabsTrigger>
            <TabsTrigger value="view" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              View
            </TabsTrigger>
            <TabsTrigger value="decode" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Decode
            </TabsTrigger>
            <TabsTrigger value="convert" className="flex items-center gap-2">
              <FileJson className="h-4 w-4" />
              Convert
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} className="h-full">
          <TabsContent value="compare" className="h-full m-0">
            <ComparisonView files={[leftFile, rightFile].filter(Boolean) as import("@/pages/Index").EDIFile[]} />
          </TabsContent>
          
          <TabsContent value="view" className="h-full m-0">
            <div className="h-full flex">
              <div className="flex-1 border-r border-border">
                <div className="p-3 border-b border-border bg-card">
                  <h3 className="font-medium text-sm text-foreground">
                    {leftFile ? leftFile.name : 'No file selected'}
                  </h3>
                </div>
                {leftFile && <EDIViewer file={leftFile} />}
              </div>
              <div className="flex-1">
                <div className="p-3 border-b border-border bg-card">
                  <h3 className="font-medium text-sm text-foreground">
                    {rightFile ? rightFile.name : 'No file selected'}
                  </h3>
                </div>
                {rightFile && <EDIViewer file={rightFile} />}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="decode" className="h-full m-0">
            <EDIDecoder leftFile={leftFile} rightFile={rightFile} />
          </TabsContent>

          <TabsContent value="convert" className="h-full m-0">
            <JSONConverter leftFile={leftFile} rightFile={rightFile} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};