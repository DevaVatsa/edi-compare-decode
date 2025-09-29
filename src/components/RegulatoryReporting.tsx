import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Download, 
  Calendar, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  BarChart3,
  Shield,
  Building,
  Users
} from "lucide-react";
import { EDIFile } from "@/pages/Index";

interface RegulatoryReportingProps {
  files: EDIFile[];
}

export const RegulatoryReporting = ({ files }: RegulatoryReportingProps) => {
  const [selectedReport, setSelectedReport] = useState("hipaa");

  const reportSchedule = [
    {
      name: "HIPAA Compliance Report",
      frequency: "Monthly",
      nextDue: "2024-11-01",
      status: "ready",
      lastGenerated: "2024-10-01",
      category: "compliance",
      automated: true
    },
    {
      name: "SOC 2 Audit Report",
      frequency: "Quarterly", 
      nextDue: "2024-12-31",
      status: "in_progress",
      lastGenerated: "2024-09-30",
      category: "security",
      automated: true
    },
    {
      name: "State Insurance Report (Alabama)",
      frequency: "Quarterly",
      nextDue: "2024-11-15",
      status: "ready",
      lastGenerated: "2024-08-15",
      category: "state",
      automated: true
    },
    {
      name: "IRS Form 1095 Preparation",
      frequency: "Annually",
      nextDue: "2025-01-31",
      status: "scheduled",
      lastGenerated: "2024-01-31",
      category: "tax",
      automated: false
    },
    {
      name: "ACA Reporting (Forms 1094/1095)",
      frequency: "Annually",
      nextDue: "2025-03-31",
      status: "scheduled",
      lastGenerated: "2024-03-31",
      category: "aca",
      automated: true
    }
  ];

  const recentReports = [
    {
      name: "HIPAA Privacy Impact Assessment",
      generatedDate: "2024-10-28",
      type: "Compliance",
      status: "completed",
      fileSize: "2.4 MB",
      recipient: "Compliance Officer"
    },
    {
      name: "EDI Processing Statistics Q3",
      generatedDate: "2024-10-25",
      type: "Operational",
      status: "completed", 
      fileSize: "1.8 MB",
      recipient: "Operations Manager"
    },
    {
      name: "Security Incident Summary",
      generatedDate: "2024-10-22",
      type: "Security",
      status: "completed",
      fileSize: "0.9 MB", 
      recipient: "CISO"
    },
    {
      name: "Alabama BCBS Reconciliation",
      generatedDate: "2024-10-20",
      type: "Financial",
      status: "completed",
      fileSize: "3.2 MB",
      recipient: "Finance Team"
    }
  ];

  const complianceMetrics = {
    hipaaCompliance: 100,
    socCompliance: 98,
    stateCompliance: 96,
    acaCompliance: 100,
    overallScore: 98.5
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "in_progress": return <Clock className="h-4 w-4 text-blue-500" />;
      case "scheduled": return <Calendar className="h-4 w-4 text-yellow-500" />;
      case "overdue": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready": return "outline";
      case "completed": return "outline";
      case "in_progress": return "secondary";
      case "scheduled": return "secondary";
      case "overdue": return "destructive";
      default: return "outline";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "compliance": return <Shield className="h-4 w-4" />;
      case "security": return <Shield className="h-4 w-4" />;
      case "state": return <Building className="h-4 w-4" />;
      case "tax": return <FileText className="h-4 w-4" />;
      case "aca": return <Users className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Regulatory Reporting</h1>
          <p className="text-muted-foreground">Automated compliance and regulatory report generation</p>
        </div>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Score</p>
                <p className="text-2xl font-bold text-foreground">{complianceMetrics.overallScore}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">HIPAA</p>
                <p className="text-2xl font-bold text-foreground">{complianceMetrics.hipaaCompliance}%</p>
              </div>
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">SOC 2</p>
                <p className="text-2xl font-bold text-foreground">{complianceMetrics.socCompliance}%</p>
              </div>
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">State Regs</p>
                <p className="text-2xl font-bold text-foreground">{complianceMetrics.stateCompliance}%</p>
              </div>
              <Building className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ACA</p>
                <p className="text-2xl font-bold text-foreground">{complianceMetrics.acaCompliance}%</p>
              </div>
              <Users className="h-8 w-8 text-teal-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="schedule" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="schedule">Report Schedule</TabsTrigger>
          <TabsTrigger value="recent">Recent Reports</TabsTrigger>
          <TabsTrigger value="templates">Report Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Automated Report Schedule
              </CardTitle>
              <CardDescription>
                Scheduled regulatory and compliance reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportSchedule.map((report, index) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(report.status)}
                        <h3 className="font-medium text-foreground">{report.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {report.frequency}
                        </Badge>
                        {report.automated && (
                          <Badge variant="secondary" className="text-xs">
                            Automated
                          </Badge>
                        )}
                      </div>
                      <Badge variant={getStatusColor(report.status)}>
                        {report.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Category</p>
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(report.category)}
                          <span className="text-sm font-medium capitalize">{report.category}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Next Due</p>
                        <p className="text-sm font-medium">{report.nextDue}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Last Generated</p>
                        <p className="text-sm font-medium">{report.lastGenerated}</p>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                        <Button size="sm">
                          Generate Now
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Reports
              </CardTitle>
              <CardDescription>
                Recently generated regulatory and compliance reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentReports.map((report, index) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-medium text-foreground">{report.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {report.type}
                        </Badge>
                      </div>
                      <Badge variant={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Generated</p>
                        <p className="text-sm font-medium">{report.generatedDate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">File Size</p>
                        <p className="text-sm font-medium">{report.fileSize}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Recipient</p>
                        <p className="text-sm font-medium">{report.recipient}</p>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        <Button size="sm" variant="outline">
                          Share
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>HIPAA Compliance Template</CardTitle>
                <CardDescription>Privacy and security rule compliance reporting</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Privacy Rule Assessment</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Security Rule Compliance</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Breach Risk Assessment</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Audit Trail Summary</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                </div>
                <Button className="w-full mt-4" size="sm">
                  Generate HIPAA Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SOC 2 Audit Template</CardTitle>
                <CardDescription>System and organization controls reporting</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Security Controls</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Availability Metrics</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Processing Integrity</span>
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Confidentiality Assessment</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                </div>
                <Button className="w-full mt-4" size="sm">
                  Generate SOC 2 Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ACA Reporting Template</CardTitle>
                <CardDescription>Forms 1094 and 1095 preparation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Employee Coverage Data</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Premium Information</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Affordability Calculations</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">IRS Transmission Ready</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                </div>
                <Button className="w-full mt-4" size="sm">
                  Generate ACA Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>State Compliance Template</CardTitle>
                <CardDescription>Alabama and multi-state reporting</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">BCBS Alabama Reporting</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Kaiser Requirements</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Aetna Compliance</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Multi-state Summary</span>
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  </div>
                </div>
                <Button className="w-full mt-4" size="sm">
                  Generate State Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};