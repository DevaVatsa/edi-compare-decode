import { useState } from "react";
import { FileUploader } from "@/components/FileUploader";
import { EDIComparison } from "@/components/EDIComparison";
import { BusinessDashboard } from "@/components/BusinessDashboard";
import { FraudDetection } from "@/components/FraudDetection";
import { MemberAnalytics } from "@/components/MemberAnalytics";
import { JSONConverter } from "@/components/JSONConverter";
import { ComparisonView } from "@/components/ComparisonView";
import { ErrorSummary } from "@/components/ErrorSummary";
import { PayerPerformance } from "@/components/PayerPerformance";
import { FinancialImpact } from "@/components/FinancialImpact";
import { WorkflowAutomation } from "@/components/WorkflowAutomation";
import { PredictiveAnalytics } from "@/components/PredictiveAnalytics";
import { APIIntegration } from "@/components/APIIntegration";
import { SecurityCompliance } from "@/components/SecurityCompliance";
import { RegulatoryReporting } from "@/components/RegulatoryReporting";
import { PerformanceOptimization } from "@/components/PerformanceOptimization";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
            <Tabs defaultValue="compare" className="flex-1 flex flex-col">
              <div className="border-b border-border px-6 py-2">
                <TabsList className="grid w-full grid-cols-12 text-xs gap-1">
                  <TabsTrigger value="compare" className="text-xs">Compare</TabsTrigger>
                  <TabsTrigger value="convert" className="text-xs">Convert</TabsTrigger>
                  <TabsTrigger value="dashboard" className="text-xs">Dashboard</TabsTrigger>
                  <TabsTrigger value="analytics" className="text-xs">Analytics</TabsTrigger>
                  <TabsTrigger value="fraud" className="text-xs">Fraud</TabsTrigger>
                  <TabsTrigger value="payer" className="text-xs">Payer</TabsTrigger>
                  <TabsTrigger value="financial" className="text-xs">Financial</TabsTrigger>
                  <TabsTrigger value="workflow" className="text-xs">Workflow</TabsTrigger>
                  <TabsTrigger value="predictive" className="text-xs">AI/ML</TabsTrigger>
                  <TabsTrigger value="api" className="text-xs">API</TabsTrigger>
                  <TabsTrigger value="security" className="text-xs">Security</TabsTrigger>
                  <TabsTrigger value="reports" className="text-xs">Reports</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="compare" className="flex-1 m-0">
                <ComparisonView files={files} />
              </TabsContent>
              
              <TabsContent value="convert" className="flex-1 m-0">
                <JSONConverter leftFile={selectedFiles.left} rightFile={selectedFiles.right} />
              </TabsContent>
              
              <TabsContent value="dashboard" className="flex-1 m-0">
                <BusinessDashboard files={files} />
              </TabsContent>
              
              <TabsContent value="analytics" className="flex-1 m-0">
                <MemberAnalytics files={files} />
              </TabsContent>
              
              <TabsContent value="fraud" className="flex-1 m-0">
                <FraudDetection files={files} />
              </TabsContent>
              
              <TabsContent value="payer" className="flex-1 m-0">
                <PayerPerformance files={files} />
              </TabsContent>
              
              <TabsContent value="financial" className="flex-1 m-0">
                <FinancialImpact files={files} />
              </TabsContent>
              
              <TabsContent value="workflow" className="flex-1 m-0">
                <WorkflowAutomation files={files} />
              </TabsContent>
              
              <TabsContent value="predictive" className="flex-1 m-0">
                <PredictiveAnalytics files={files} />
              </TabsContent>
              
              <TabsContent value="api" className="flex-1 m-0">
                <APIIntegration files={files} />
              </TabsContent>
              
              <TabsContent value="security" className="flex-1 m-0">
                <SecurityCompliance files={files} />
              </TabsContent>
              
              <TabsContent value="reports" className="flex-1 m-0">
                <RegulatoryReporting files={files} />
              </TabsContent>
              
              <TabsContent value="performance" className="flex-1 m-0">
                <PerformanceOptimization files={files} />
              </TabsContent>
              
              <TabsContent value="errors" className="flex-1 m-0">
                <ErrorSummary files={files} />
              </TabsContent>
            </Tabs>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;