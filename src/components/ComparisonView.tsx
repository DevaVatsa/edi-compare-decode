import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  GitCompare, AlertTriangle, CheckCircle, FileText, 
  ArrowRight, Users, DollarSign, Calendar, Eye
} from "lucide-react";
import { EDIFile } from "@/pages/Index";
import { parseEDIContent } from "@/utils/ediParser";
import { validateEDITransaction } from "@/utils/ediValidator";

interface ComparisonViewProps {
  files: EDIFile[];
  leftFile?: EDIFile;
  rightFile?: EDIFile;
}

interface ComparisonResult {
  file1: EDIFile;
  file2: EDIFile;
  differences: {
    segmentDiffs: Array<{
      segment: string;
      file1Value: string;
      file2Value: string;
      type: 'added' | 'removed' | 'modified';
    }>;
    memberDiffs: Array<{
      memberId: string;
      field: string;
      file1Value: string;
      file2Value: string;
      changeType: 'enrollment' | 'termination' | 'change';
    }>;
    summaryDiffs: {
      memberCountChange: number;
      premiumChange: number;
      newEnrollments: number;
      terminations: number;
      modifications: number;
    };
  };
  similarity: number;
  recommendations: string[];
}

export const ComparisonView = ({ files, leftFile, rightFile }: ComparisonViewProps) => {
  const [selectedFile1, setSelectedFile1] = useState<string>("");
  const [selectedFile2, setSelectedFile2] = useState<string>("");
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  const compareFiles = async () => {
    if (!selectedFile1 || !selectedFile2) return;

    setIsComparing(true);
    
    const file1 = files.find(f => f.id === selectedFile1)!;
    const file2 = files.find(f => f.id === selectedFile2)!;

    try {
      const parsed1 = parseEDIContent(file1.content);
      const parsed2 = parseEDIContent(file2.content);

      // Deep comparison logic
      const segmentDiffs: ComparisonResult['differences']['segmentDiffs'] = [];
      const memberDiffs: ComparisonResult['differences']['memberDiffs'] = [];

      // Create segment maps for comparison
      const segments1 = new Map();
      const segments2 = new Map();

      parsed1.segments.forEach(seg => {
        const key = `${seg.tag}_${seg.lineNumber}`;
        segments1.set(key, seg);
      });

      parsed2.segments.forEach(seg => {
        const key = `${seg.tag}_${seg.lineNumber}`;
        segments2.set(key, seg);
      });

      // Find differences
      const allKeys = new Set([...segments1.keys(), ...segments2.keys()]);
      
      allKeys.forEach(key => {
        const seg1 = segments1.get(key);
        const seg2 = segments2.get(key);

        if (!seg1) {
          segmentDiffs.push({
            segment: key,
            file1Value: '',
            file2Value: seg2.elements.join('*'),
            type: 'added'
          });
        } else if (!seg2) {
          segmentDiffs.push({
            segment: key,
            file1Value: seg1.elements.join('*'),
            file2Value: '',
            type: 'removed'
          });
        } else if (seg1.elements.join('*') !== seg2.elements.join('*')) {
          segmentDiffs.push({
            segment: key,
            file1Value: seg1.elements.join('*'),
            file2Value: seg2.elements.join('*'),
            type: 'modified'
          });
        }
      });

      // Member-specific analysis for 834 files
      if (file1.type === '834' && file2.type === '834') {
        const members1 = extractMembers(parsed1);
        const members2 = extractMembers(parsed2);

        // Compare members
        const allMemberIds = new Set([...Object.keys(members1), ...Object.keys(members2)]);
        
        allMemberIds.forEach(memberId => {
          const member1 = members1[memberId];
          const member2 = members2[memberId];

          if (!member1 && member2) {
            memberDiffs.push({
              memberId,
              field: 'status',
              file1Value: 'Not Found',
              file2Value: 'Enrolled',
              changeType: 'enrollment'
            });
          } else if (member1 && !member2) {
            memberDiffs.push({
              memberId,
              field: 'status',
              file1Value: 'Enrolled',
              file2Value: 'Terminated',
              changeType: 'termination'
            });
          } else if (member1 && member2) {
            // Check for changes
            Object.keys(member1).forEach(field => {
              if (member1[field] !== member2[field]) {
                memberDiffs.push({
                  memberId,
                  field,
                  file1Value: member1[field],
                  file2Value: member2[field],
                  changeType: 'change'
                });
              }
            });
          }
        });
      }

      // Calculate summary differences
      const memberCount1 = parsed1.segments.filter(s => s.tag === 'INS').length;
      const memberCount2 = parsed2.segments.filter(s => s.tag === 'INS').length;
      
      const premiums1 = extractPremiumTotal(parsed1);
      const premiums2 = extractPremiumTotal(parsed2);

      const summaryDiffs = {
        memberCountChange: memberCount2 - memberCount1,
        premiumChange: premiums2 - premiums1,
        newEnrollments: memberDiffs.filter(d => d.changeType === 'enrollment').length,
        terminations: memberDiffs.filter(d => d.changeType === 'termination').length,
        modifications: memberDiffs.filter(d => d.changeType === 'change').length
      };

      // Calculate similarity percentage
      const totalSegments = Math.max(parsed1.segments.length, parsed2.segments.length);
      const similarity = ((totalSegments - segmentDiffs.length) / totalSegments) * 100;

      // Generate recommendations
      const recommendations = generateRecommendations(summaryDiffs, segmentDiffs, memberDiffs);

      setComparisonResult({
        file1,
        file2,
        differences: {
          segmentDiffs: segmentDiffs.slice(0, 100), // Limit for performance
          memberDiffs: memberDiffs.slice(0, 50),
          summaryDiffs
        },
        similarity,
        recommendations
      });

    } catch (error) {
      console.error('Comparison error:', error);
    } finally {
      setIsComparing(false);
    }
  };

  const extractMembers = (transaction: any) => {
    const members: Record<string, any> = {};
    let currentMember: any = null;

    transaction.segments.forEach((segment: any) => {
      if (segment.tag === 'INS') {
        currentMember = { id: segment.elements[2] || 'unknown' };
      } else if (segment.tag === 'NM1' && currentMember) {
        currentMember.name = segment.elements[3] || '';
        currentMember.firstName = segment.elements[4] || '';
        currentMember.ssn = segment.elements[9] || '';
        if (currentMember.id) {
          members[currentMember.id] = { ...currentMember };
        }
      }
    });

    return members;
  };

  const extractPremiumTotal = (transaction: any) => {
    let total = 0;
    transaction.segments.forEach((segment: any) => {
      if (segment.tag === 'AMT' && segment.elements[1]?.includes('premium')) {
        const amount = parseFloat(segment.elements[2] || '0');
        if (!isNaN(amount)) total += amount;
      }
    });
    return total;
  };

  const generateRecommendations = (summaryDiffs: any, segmentDiffs: any[], memberDiffs: any[]) => {
    const recommendations = [];
    
    if (summaryDiffs.newEnrollments > 10) {
      recommendations.push("High enrollment volume detected. Consider capacity planning for increased member services.");
    }
    
    if (summaryDiffs.terminations > 5) {
      recommendations.push("Significant terminations detected. Review retention strategies and exit interview data.");
    }
    
    if (segmentDiffs.length > 50) {
      recommendations.push("Many segment differences found. Verify data sources and transmission processes.");
    }
    
    if (summaryDiffs.premiumChange > 10000) {
      recommendations.push("Substantial premium changes detected. Validate pricing updates and member communications.");
    }

    return recommendations;
  };

  const getDiffTypeColor = (type: string) => {
    switch (type) {
      case 'added': return 'text-green-600 bg-green-50 border-green-200';
      case 'removed': return 'text-red-600 bg-red-50 border-red-200';
      case 'modified': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!files.length) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <GitCompare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">File Comparison Engine</h3>
            <p className="text-muted-foreground">Upload multiple EDI files to perform detailed comparisons</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced File Comparison</h2>
          <p className="text-muted-foreground">Deep analysis and diff detection between EDI files</p>
        </div>
        <Badge variant="outline" className="text-blue-600 border-blue-600">
          <Eye className="h-3 w-3 mr-1" />
          Advanced Analytics
        </Badge>
      </div>

      {/* File Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Files to Compare</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">File 1</label>
              <Select value={selectedFile1} onValueChange={setSelectedFile1}>
                <SelectTrigger>
                  <SelectValue placeholder="Select first file" />
                </SelectTrigger>
                <SelectContent>
                  {files.map(file => (
                    <SelectItem key={file.id} value={file.id}>
                      {file.name} ({file.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">File 2</label>
              <Select value={selectedFile2} onValueChange={setSelectedFile2}>
                <SelectTrigger>
                  <SelectValue placeholder="Select second file" />
                </SelectTrigger>
                <SelectContent>
                  {files.filter(f => f.id !== selectedFile1).map(file => (
                    <SelectItem key={file.id} value={file.id}>
                      {file.name} ({file.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            onClick={compareFiles} 
            disabled={!selectedFile1 || !selectedFile2 || isComparing}
            className="w-full"
          >
            {isComparing ? "Comparing..." : "Compare Files"}
            <GitCompare className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {comparisonResult && (
        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="segments">Segment Diffs</TabsTrigger>
            <TabsTrigger value="members">Member Changes</TabsTrigger>
            <TabsTrigger value="recommendations">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Similarity</p>
                      <p className="text-2xl font-bold">{comparisonResult.similarity.toFixed(1)}%</p>
                    </div>
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Member Changes</p>
                      <p className="text-2xl font-bold">{comparisonResult.differences.summaryDiffs.memberCountChange}</p>
                    </div>
                    <Users className="h-6 w-6 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Premium Impact</p>
                      <p className="text-2xl font-bold">${comparisonResult.differences.summaryDiffs.premiumChange.toLocaleString()}</p>
                    </div>
                    <DollarSign className="h-6 w-6 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Diffs</p>
                      <p className="text-2xl font-bold">{comparisonResult.differences.segmentDiffs.length}</p>
                    </div>
                    <AlertTriangle className="h-6 w-6 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Change Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>New Enrollments</span>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      +{comparisonResult.differences.summaryDiffs.newEnrollments}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Terminations</span>
                    <Badge variant="outline" className="text-red-600 border-red-600">
                      -{comparisonResult.differences.summaryDiffs.terminations}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Modifications</span>
                    <Badge variant="outline" className="text-blue-600 border-blue-600">
                      {comparisonResult.differences.summaryDiffs.modifications}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>File Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="font-medium">{comparisonResult.file1.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Type: {comparisonResult.file1.type} • {comparisonResult.file1.uploadedAt.toLocaleDateString()}
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="font-medium">{comparisonResult.file2.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Type: {comparisonResult.file2.type} • {comparisonResult.file2.uploadedAt.toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="segments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Segment Differences ({comparisonResult.differences.segmentDiffs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {comparisonResult.differences.segmentDiffs.map((diff, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getDiffTypeColor(diff.type)}>
                          {diff.type}
                        </Badge>
                        <span className="font-mono text-sm">{diff.segment}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <div className="text-muted-foreground">File 1:</div>
                          <div className="font-mono bg-gray-50 p-2 rounded">{diff.file1Value || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">File 2:</div>
                          <div className="font-mono bg-gray-50 p-2 rounded">{diff.file2Value || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Member Changes ({comparisonResult.differences.memberDiffs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {comparisonResult.differences.memberDiffs.map((diff, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getDiffTypeColor(diff.changeType)}>
                          {diff.changeType}
                        </Badge>
                        <span className="font-medium">Member: {diff.memberId}</span>
                        <span className="text-sm text-muted-foreground">Field: {diff.field}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <div className="text-muted-foreground">Before:</div>
                          <div className="font-mono bg-gray-50 p-2 rounded">{diff.file1Value}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">After:</div>
                          <div className="font-mono bg-gray-50 p-2 rounded">{diff.file2Value}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered Insights & Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {comparisonResult.recommendations.map((rec, index) => (
                  <Alert key={index}>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{rec}</AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};