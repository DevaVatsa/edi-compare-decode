import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, RefreshCw, FileJson, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { parseEDIContent, convertEDIToJSON, convertJSONToEDI, type JSONConversionResult } from '@/utils/universalEDIParser';
import { EDIFile } from '@/pages/Index';

interface JSONConverterProps {
  leftFile?: EDIFile;
  rightFile?: EDIFile;
}

export const JSONConverter = ({ leftFile, rightFile }: JSONConverterProps) => {
  const [activeTab, setActiveTab] = useState<'left' | 'right'>('left');
  const [leftJSON, setLeftJSON] = useState<JSONConversionResult | null>(null);
  const [rightJSON, setRightJSON] = useState<JSONConversionResult | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const convertFileToJSON = async (file: EDIFile, position: 'left' | 'right') => {
    setIsConverting(true);
    try {
      const transaction = parseEDIContent(file.content);
      const jsonResult = convertEDIToJSON(transaction);
      
      if (position === 'left') {
        setLeftJSON(jsonResult);
      } else {
        setRightJSON(jsonResult);
      }

      toast({
        title: "Conversion Successful",
        description: `${file.name} converted to JSON format`,
      });
    } catch (error) {
      console.error('Conversion error:', error);
      toast({
        title: "Conversion Failed",
        description: "Error converting EDI to JSON. Please check the file format.",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  const downloadJSON = (jsonData: JSONConversionResult, filename: string) => {
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.replace(/\.[^/.]+$/, "")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Started",
      description: `JSON file ${a.download} is being downloaded`,
    });
  };

  const downloadEDI = (jsonData: JSONConversionResult, filename: string) => {
    try {
      const ediContent = convertJSONToEDI(jsonData);
      const blob = new Blob([ediContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename.replace(/\.[^/.]+$/, "")}_converted.edi`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: `EDI file ${a.download} is being downloaded`,
      });
    } catch (error) {
      toast({
        title: "Conversion Failed",
        description: "Error converting JSON back to EDI format",
        variant: "destructive",
      });
    }
  };

  const ConversionPanel = ({ 
    file, 
    jsonData, 
    position, 
    title 
  }: { 
    file?: EDIFile; 
    jsonData?: JSONConversionResult | null;
    position: 'left' | 'right';
    title: string;
  }) => {
    if (!file) {
      return (
        <Card className="h-full flex items-center justify-center">
          <CardContent className="text-center py-8">
            <FileJson className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No file selected for {title.toLowerCase()}</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{title}</span>
            <Badge variant="outline">{file.type.toUpperCase()}</Badge>
          </CardTitle>
          <CardDescription>{file.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!jsonData ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Convert EDI to JSON format</p>
              <Button 
                onClick={() => convertFileToJSON(file, position)}
                disabled={isConverting}
                className="mb-2"
              >
                {isConverting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Convert to JSON
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Conversion Complete</span>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => downloadJSON(jsonData, file.name)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    JSON
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => downloadEDI(jsonData, file.name)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    EDI
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="structure" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="structure">Structure</TabsTrigger>
                  <TabsTrigger value="header">Header</TabsTrigger>
                  <TabsTrigger value="data">Data</TabsTrigger>
                  <TabsTrigger value="metadata">Meta</TabsTrigger>
                </TabsList>

                <TabsContent value="structure" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">JSON Structure Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Original Format:</span>
                          <Badge variant="secondary">{jsonData.metadata.originalFormat}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Entities:</span>
                          <span>{jsonData.data.entities.length}</span>
                        </div>
                        {jsonData.data.members && (
                          <div className="flex justify-between">
                            <span>Members:</span>
                            <span>{jsonData.data.members.length}</span>
                          </div>
                        )}
                        {jsonData.data.payments && (
                          <div className="flex justify-between">
                            <span>Payments:</span>
                            <span>{jsonData.data.payments.length}</span>
                          </div>
                        )}
                        {jsonData.data.claims && (
                          <div className="flex justify-between">
                            <span>Claims:</span>
                            <span>{jsonData.data.claims.length}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Processing Time:</span>
                          <span>{jsonData.metadata.statistics.processingTime}ms</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="header" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Header Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">
                        {JSON.stringify(jsonData.header, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="data" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Business Data</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">
                        {JSON.stringify(jsonData.data, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="metadata" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Conversion Metadata</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">
                        {JSON.stringify(jsonData.metadata, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-lg font-semibold">EDI ↔ JSON Converter</h2>
          <p className="text-sm text-muted-foreground">
            Convert EDI files to JSON format and back with full business context
          </p>
        </div>
        <div className="flex space-x-2">
          {(leftJSON || rightJSON) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLeftJSON(null);
                setRightJSON(null);
                toast({
                  title: "Conversions Cleared",
                  description: "All JSON conversions have been cleared",
                });
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
        <ConversionPanel 
          file={leftFile} 
          jsonData={leftJSON}
          position="left"
          title="Left File"
        />
        <ConversionPanel 
          file={rightFile} 
          jsonData={rightJSON}
          position="right"
          title="Right File"
        />
      </div>

      {(leftJSON && rightJSON) && (
        <div className="border-t p-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                Comparison Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Left File ({leftFile?.name})</h4>
                  <div className="space-y-1">
                    <div>Format: <Badge variant="outline">{leftJSON.metadata.originalFormat}</Badge></div>
                    <div>Entities: {leftJSON.data.entities.length}</div>
                    {leftJSON.data.members && <div>Members: {leftJSON.data.members.length}</div>}
                    {leftJSON.data.payments && <div>Payments: {leftJSON.data.payments.length}</div>}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Right File ({rightFile?.name})</h4>
                  <div className="space-y-1">
                    <div>Format: <Badge variant="outline">{rightJSON.metadata.originalFormat}</Badge></div>
                    <div>Entities: {rightJSON.data.entities.length}</div>
                    {rightJSON.data.members && <div>Members: {rightJSON.data.members.length}</div>}
                    {rightJSON.data.payments && <div>Payments: {rightJSON.data.payments.length}</div>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};