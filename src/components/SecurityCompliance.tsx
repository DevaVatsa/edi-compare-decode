import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Lock, 
  Eye, 
  AlertTriangle, 
  CheckCircle,
  Users,
  Key,
  FileCheck,
  Clock,
  Database,
  Server,
  Network
} from "lucide-react";
import { EDIFile } from "@/pages/Index";

interface SecurityComplianceProps {
  files: EDIFile[];
}

export const SecurityCompliance = ({ files }: SecurityComplianceProps) => {
  const { toast } = useToast();
  const [selectedAudit, setSelectedAudit] = useState("access");

  const handleSecurityScan = () => {
    toast({
      title: "Security Scan Started",
      description: "Running comprehensive security analysis...",
    });
  };

  const handleViewDetails = (checkName: string) => {
    const check = complianceChecks.find(c => c.name === checkName);
    if (!check) return;

    const detailsReport = {
      checkName: check.name,
      status: check.status,
      complianceScore: check.score,
      lastCheck: check.lastCheck,
      viewedAt: new Date().toISOString(),
      requirements: [
        `${checkName} implementation verified`,
        "Regular monitoring in place",
        "Documentation up to date",
        "Audit trail maintained"
      ],
      nextReview: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    const blob = new Blob([JSON.stringify(detailsReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-details-${checkName.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Compliance Details Downloaded",
      description: `Detailed ${checkName} information has been exported.`,
    });
  };

  const securityMetrics = {
    overallScore: 98,
    vulnerabilities: 0,
    hipaaCompliance: 100,
    dataEncryption: 100,
    accessControls: 96,
    auditTrail: 100
  };

  const auditLogs = [
    {
      timestamp: "2024-10-28 14:32:15",
      user: "john.doe@coadvantage.com",
      action: "FILE_UPLOAD",
      resource: "834_enrollment_aetna.edi",
      status: "SUCCESS",
      ipAddress: "192.168.1.45",
      details: "834 file processed successfully"
    },
    {
      timestamp: "2024-10-28 14:28:03",
      user: "jane.smith@coadvantage.com", 
      action: "DATA_EXPORT",
      resource: "member_analytics_report.json",
      status: "SUCCESS",
      ipAddress: "192.168.1.67",
      details: "Analytics report exported"
    },
    {
      timestamp: "2024-10-28 14:15:22",
      user: "admin@coadvantage.com",
      action: "PERMISSION_CHANGE",
      resource: "user_roles",
      status: "SUCCESS", 
      ipAddress: "192.168.1.23",
      details: "Updated user permissions for analytics team"
    },
    {
      timestamp: "2024-10-28 13:45:18",
      user: "system",
      action: "ENCRYPTION_REFRESH",
      resource: "database_keys",
      status: "SUCCESS",
      ipAddress: "internal",
      details: "Database encryption keys rotated"
    }
  ];

  const complianceChecks = [
    { name: "HIPAA Privacy Rule", status: "compliant", score: 100, lastCheck: "2024-10-28" },
    { name: "HIPAA Security Rule", status: "compliant", score: 100, lastCheck: "2024-10-28" },
    { name: "SOC 2 Type II", status: "compliant", score: 98, lastCheck: "2024-10-25" },
    { name: "Data Encryption at Rest", status: "compliant", score: 100, lastCheck: "2024-10-28" },
    { name: "Data Encryption in Transit", status: "compliant", score: 100, lastCheck: "2024-10-28" },
    { name: "Access Control Matrix", status: "warning", score: 96, lastCheck: "2024-10-27" },
    { name: "Audit Logging", status: "compliant", score: 100, lastCheck: "2024-10-28" },
    { name: "Incident Response Plan", status: "compliant", score: 100, lastCheck: "2024-10-20" }
  ];

  const securityIncidents = [
    {
      id: "INC-2024-001",
      severity: "low",
      type: "Failed Login Attempt",
      status: "resolved",
      timestamp: "2024-10-27 09:15:33",
      description: "Multiple failed login attempts from IP 203.45.67.89",
      resolution: "IP blocked automatically after 5 failed attempts"
    },
    {
      id: "INC-2024-002", 
      severity: "medium",
      type: "Unusual Data Access",
      status: "investigating",
      timestamp: "2024-10-26 16:22:11",
      description: "User accessed files outside normal pattern",
      resolution: "Under review by security team"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "compliant": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "critical": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "compliant": return "outline";
      case "warning": return "secondary";
      case "critical": return "destructive";
      default: return "outline";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low": return "outline";
      case "medium": return "secondary";
      case "high": return "destructive";
      case "critical": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Security & Compliance</h1>
          <p className="text-muted-foreground">Enterprise security monitoring and compliance management</p>
        </div>
        <Button onClick={handleSecurityScan}>
          <Shield className="h-4 w-4 mr-2" />
          Run Security Scan
        </Button>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Security Score</p>
                <p className="text-2xl font-bold text-foreground">{securityMetrics.overallScore}%</p>
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vulnerabilities</p>
                <p className="text-2xl font-bold text-foreground">{securityMetrics.vulnerabilities}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">HIPAA Compliance</p>
                <p className="text-2xl font-bold text-foreground">{securityMetrics.hipaaCompliance}%</p>
              </div>
              <FileCheck className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Encryption Status</p>
                <p className="text-2xl font-bold text-foreground">{securityMetrics.dataEncryption}%</p>
              </div>
              <Lock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="compliance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="incidents">Security Incidents</TabsTrigger>
          <TabsTrigger value="encryption">Data Protection</TabsTrigger>
        </TabsList>

        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Compliance Status
              </CardTitle>
              <CardDescription>
                Real-time compliance monitoring across all regulations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complianceChecks.map((check, index) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(check.status)}
                        <h3 className="font-medium text-foreground">{check.name}</h3>
                      </div>
                      <Badge variant={getStatusColor(check.status)}>
                        {check.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Compliance Score</p>
                        <div className="flex items-center gap-2">
                          <Progress value={check.score} className="flex-1" />
                          <span className="text-sm font-medium">{check.score}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Last Check</p>
                        <p className="text-sm font-medium">{check.lastCheck}</p>
                      </div>
                      <div className="flex justify-end">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewDetails(check.name)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Audit Trail
              </CardTitle>
              <CardDescription>
                Complete audit log of all system activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditLogs.map((log, index) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{log.action}</span>
                        <Badge variant="outline" className="text-xs">
                          {log.status}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">User:</span>
                        <p className="font-medium">{log.user}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Resource:</span>
                        <p className="font-medium">{log.resource}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">IP Address:</span>
                        <p className="font-medium">{log.ipAddress}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Details:</span>
                        <p className="font-medium">{log.details}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Security Incidents
              </CardTitle>
              <CardDescription>
                Monitor and manage security incidents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityIncidents.map((incident, index) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge variant={getSeverityColor(incident.severity)}>
                          {incident.severity} severity
                        </Badge>
                        <span className="font-medium">{incident.id}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{incident.timestamp}</span>
                    </div>
                    
                    <h3 className="font-medium text-foreground mb-2">{incident.type}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{incident.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-muted-foreground">Resolution: </span>
                        <span className="text-sm font-medium">{incident.resolution}</span>
                      </div>
                      <Badge variant={incident.status === "resolved" ? "outline" : "secondary"}>
                        {incident.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="encryption" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Data Encryption
                </CardTitle>
                <CardDescription>Encryption status and key management</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <span className="text-sm">Database Encryption</span>
                    <Badge variant="outline" className="text-green-600">AES-256</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <span className="text-sm">File Storage Encryption</span>
                    <Badge variant="outline" className="text-green-600">AES-256</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <span className="text-sm">Transit Encryption</span>
                    <Badge variant="outline" className="text-green-600">TLS 1.3</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <span className="text-sm">Key Rotation</span>
                    <Badge variant="outline" className="text-green-600">90 Days</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Access Controls
                </CardTitle>
                <CardDescription>User permissions and access management</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <span className="text-sm">Multi-Factor Authentication</span>
                    <Badge variant="outline" className="text-green-600">Required</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <span className="text-sm">Role-Based Access</span>
                    <Badge variant="outline" className="text-green-600">Enforced</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <span className="text-sm">Session Timeout</span>
                    <Badge variant="outline" className="text-green-600">30 Minutes</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <span className="text-sm">Password Policy</span>
                    <Badge variant="outline" className="text-green-600">Strong</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};