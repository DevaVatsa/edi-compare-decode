import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Globe, 
  Key, 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Server,
  Database,
  Upload,
  Settings,
  Monitor,
  Zap
} from "lucide-react";
import { EDIFile } from "@/pages/Index";

interface APIIntegrationProps {
  files: EDIFile[];
}

export const APIIntegration = ({ files }: APIIntegrationProps) => {
  const { toast } = useToast();
  const [selectedEndpoint, setSelectedEndpoint] = useState("/api/edi/upload");
  const [isScanning, setIsScanning] = useState(false);

  const handleConfigureIntegration = () => {
    toast({
      title: "Integration Configuration",
      description: "Opening integration setup wizard...",
    });
  };

  const handleTestAPICall = () => {
    toast({
      title: "Testing API",
      description: "Sending test request to selected endpoint...",
    });
    
    setTimeout(() => {
      toast({
        title: "API Test Complete",
        description: "Endpoint responded successfully with 200 OK",
      });
    }, 2000);
  };

  const handleSecurityScan = () => {
    setIsScanning(true);
    toast({
      title: "Security Scan Started",
      description: "Analyzing API endpoints for vulnerabilities...",
    });

    setTimeout(() => {
      setIsScanning(false);
      toast({
        title: "Security Scan Complete",
        description: "No critical vulnerabilities detected. 3 minor recommendations available.",
      });
    }, 3000);
  };

  const handleGenerateKey = () => {
    const newKey = `ak_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    toast({
      title: "API Key Generated",
      description: `New API key created: ${newKey.substring(0, 20)}...`,
    });
  };
  
  const apiEndpoints = [
    {
      method: "POST",
      path: "/api/edi/upload",
      description: "Upload and process EDI files",
      rateLimit: "100/hour",
      status: "active",
      requests: 1247,
      avgResponse: "250ms"
    },
    {
      method: "GET",
      path: "/api/edi/transaction/{id}",
      description: "Retrieve processed transaction data",
      rateLimit: "1000/hour",
      status: "active",
      requests: 2341,
      avgResponse: "120ms"
    },
    {
      method: "POST",
      path: "/api/validation/run",
      description: "Run validation on EDI content",
      rateLimit: "50/hour",
      status: "active",
      requests: 567,
      avgResponse: "890ms"
    },
    {
      method: "GET",
      path: "/api/analytics/summary",
      description: "Get analytics dashboard data",
      rateLimit: "200/hour",
      status: "active",
      requests: 892,
      avgResponse: "340ms"
    }
  ];

  const integrations = [
    {
      name: "Aetna SFTP",
      type: "SFTP",
      status: "connected",
      lastSync: "2 hours ago",
      filesTransferred: 45,
      uptime: 99.8,
      config: {
        host: "sftp.aetna.com",
        port: 22,
        username: "coadvantage_prod",
        schedule: "Every 4 hours"
      }
    },
    {
      name: "Kaiser API",
      type: "REST API",
      status: "connected",
      lastSync: "1 hour ago",
      filesTransferred: 23,
      uptime: 99.5,
      config: {
        endpoint: "https://api.kaiser.com/v2/edi",
        auth: "OAuth 2.0",
        format: "JSON",
        schedule: "Every 2 hours"
      }
    },
    {
      name: "BCBS Alabama FTP",
      type: "FTP",
      status: "warning",
      lastSync: "6 hours ago",
      filesTransferred: 12,
      uptime: 98.2,
      config: {
        host: "ftp.bcbsal.org",
        port: 21,
        username: "coadvantage",
        schedule: "Daily at 6 AM"
      }
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "error": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected": return "outline";
      case "warning": return "secondary";
      case "error": return "destructive";
      default: return "outline";
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET": return "bg-blue-500";
      case "POST": return "bg-green-500";
      case "PUT": return "bg-yellow-500";
      case "DELETE": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">API Integration Hub</h1>
          <p className="text-muted-foreground">Manage external integrations and API endpoints</p>
        </div>
        <div className="flex gap-2">
          {isScanning && (
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              <Shield className="h-3 w-3 mr-1 animate-pulse" />
              Scanning...
            </Badge>
          )}
          <Button onClick={handleSecurityScan} disabled={isScanning}>
            <Shield className="h-4 w-4 mr-2" />
            Security Scan
          </Button>
          <Button onClick={handleConfigureIntegration}>
            <Settings className="h-4 w-4 mr-2" />
            Configure Integration
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">API Requests</p>
                <p className="text-2xl font-bold text-foreground">5,047</p>
              </div>
              <Globe className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Integrations</p>
                <p className="text-2xl font-bold text-foreground">3</p>
              </div>
              <Server className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold text-foreground">275ms</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="text-2xl font-bold text-foreground">99.6%</p>
              </div>
              <Monitor className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="endpoints" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="endpoints">API Endpoints</TabsTrigger>
          <TabsTrigger value="integrations">Payer Integrations</TabsTrigger>
          <TabsTrigger value="security">Security & Auth</TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                REST API Endpoints
              </CardTitle>
              <CardDescription>
                Monitor and manage API endpoint performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiEndpoints.map((endpoint, index) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge className={`text-white ${getMethodColor(endpoint.method)}`}>
                          {endpoint.method}
                        </Badge>
                        <code className="text-sm bg-secondary px-2 py-1 rounded">
                          {endpoint.path}
                        </code>
                      </div>
                      <Badge variant={getStatusColor(endpoint.status)}>
                        {endpoint.status}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {endpoint.description}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Requests (24h)</p>
                        <p className="text-lg font-bold text-foreground">
                          {endpoint.requests.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Avg Response</p>
                        <p className="text-lg font-bold text-foreground">{endpoint.avgResponse}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Rate Limit</p>
                        <p className="text-lg font-bold text-foreground">{endpoint.rateLimit}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>API Documentation</CardTitle>
                <CardDescription>Interactive API explorer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Test Endpoint</label>
                    <Input placeholder="Enter API endpoint..." value={selectedEndpoint} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Request Body</label>
                    <Textarea placeholder="JSON request body..." rows={4} />
                  </div>
                  <Button className="w-full" onClick={handleTestAPICall}>
                    <Globe className="h-4 w-4 mr-2" />
                    Test API Call
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rate Limiting</CardTitle>
                <CardDescription>Current usage and limits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Upload API</span>
                      <span className="text-sm">47/100</span>
                    </div>
                    <Progress value={47} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Validation API</span>
                      <span className="text-sm">23/50</span>
                    </div>
                    <Progress value={46} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Analytics API</span>
                      <span className="text-sm">156/200</span>
                    </div>
                    <Progress value={78} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Payer Integrations
              </CardTitle>
              <CardDescription>
                Automated file exchange with insurance payers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrations.map((integration, index) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(integration.status)}
                        <h3 className="font-medium text-foreground">{integration.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {integration.type}
                        </Badge>
                      </div>
                      <Badge variant={getStatusColor(integration.status)}>
                        {integration.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Last Sync</p>
                        <p className="text-sm font-medium">{integration.lastSync}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Files (24h)</p>
                        <p className="text-sm font-medium">{integration.filesTransferred}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Uptime</p>
                        <p className="text-sm font-medium">{integration.uptime}%</p>
                      </div>
                      <div>
                        <Progress value={integration.uptime} className="mt-2" />
                      </div>
                    </div>
                    
                    <div className="bg-secondary/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-2">Configuration</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(integration.config).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground capitalize">{key}:</span>
                            <span className="font-mono">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Authentication
              </CardTitle>
              <CardDescription>
                Manage API keys, tokens, and security settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-foreground">API Keys</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Production Key</p>
                        <p className="text-xs text-muted-foreground">ak_prod_**********************</p>
                      </div>
                      <Badge variant="outline">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Staging Key</p>
                        <p className="text-xs text-muted-foreground">ak_test_**********************</p>
                      </div>
                      <Badge variant="outline">Active</Badge>
                    </div>
                  </div>
                  <Button className="w-full" variant="outline" onClick={handleGenerateKey}>
                    <Key className="h-4 w-4 mr-2" />
                    Generate New Key
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium text-foreground">Security Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <span className="text-sm">HTTPS Only</span>
                      <Badge variant="outline" className="text-green-600">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <span className="text-sm">Rate Limiting</span>
                      <Badge variant="outline" className="text-green-600">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <span className="text-sm">Request Logging</span>
                      <Badge variant="outline" className="text-green-600">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <span className="text-sm">IP Whitelisting</span>
                      <Badge variant="secondary">Configured</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};