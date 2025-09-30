import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Zap, 
  Server, 
  Database, 
  Network, 
  Clock,
  TrendingUp,
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { EDIFile } from "@/pages/Index";

interface PerformanceOptimizationProps {
  files: EDIFile[];
}

export const PerformanceOptimization = ({ files }: PerformanceOptimizationProps) => {
  const { toast } = useToast();
  const [selectedMetric, setSelectedMetric] = useState("throughput");

  const handleRunOptimization = () => {
    toast({
      title: "Optimization Started",
      description: "Running system performance optimization...",
    });
  };

  const handleConfigureFeature = (featureName: string, isEnabled: boolean) => {
    toast({
      title: `${isEnabled ? 'Configuring' : 'Enabling'} Feature`,
      description: `${isEnabled ? 'Opening configuration for' : 'Enabling'} ${featureName}...`,
    });
  };

  const performanceMetrics = {
    processingSpeed: 2.3, // seconds per file
    throughput: 1847, // files per hour
    memoryUsage: 68, // percentage
    cpuUsage: 45, // percentage
    diskUsage: 23, // percentage
    networkLatency: 125, // milliseconds
    uptime: 99.97, // percentage
    errorRate: 0.02 // percentage
  };

  const optimizationFeatures = [
    {
      name: "Parallel Processing",
      status: "enabled",
      impact: "+340% throughput",
      description: "Process multiple EDI files simultaneously",
      recommendation: "Increase worker threads to 16 for peak hours"
    },
    {
      name: "Memory Caching", 
      status: "enabled",
      impact: "+89% response time",
      description: "Cache frequently accessed payer rules and segments",
      recommendation: "Expand cache size to 2GB for better hit rates"
    },
    {
      name: "Database Connection Pooling",
      status: "enabled", 
      impact: "+156% database performance",
      description: "Reuse database connections efficiently",
      recommendation: "Optimal pool size detected automatically"
    },
    {
      name: "Compression Optimization",
      status: "enabled",
      impact: "+67% storage efficiency", 
      description: "Compress EDI files and processed data",
      recommendation: "Consider enabling advanced compression algorithms"
    },
    {
      name: "Load Balancing",
      status: "warning",
      impact: "+45% availability",
      description: "Distribute processing across multiple servers",
      recommendation: "Add 2 more processing nodes for redundancy"
    },
    {
      name: "CDN Integration",
      status: "disabled",
      impact: "+120% global performance",
      description: "Cache static assets globally",
      recommendation: "Enable CDN for international user access"
    }
  ];

  const systemResources = [
    { name: "CPU Usage", current: 45, peak: 78, optimal: 70, unit: "%" },
    { name: "Memory Usage", current: 68, peak: 89, optimal: 80, unit: "%" },
    { name: "Disk I/O", current: 23, peak: 56, optimal: 60, unit: "%" },
    { name: "Network Bandwidth", current: 34, peak: 67, optimal: 75, unit: "%" },
    { name: "Database Connections", current: 45, peak: 89, optimal: 100, unit: "connections" }
  ];

  const performanceTrends = [
    { time: "00:00", throughput: 1200, latency: 145 },
    { time: "04:00", throughput: 800, latency: 120 },
    { time: "08:00", throughput: 2100, latency: 156 },
    { time: "12:00", throughput: 2400, latency: 178 },
    { time: "16:00", throughput: 1900, latency: 134 },
    { time: "20:00", throughput: 1600, latency: 125 }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "enabled": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "disabled": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "enabled": return "outline";
      case "warning": return "secondary";
      case "disabled": return "destructive";
      default: return "outline";
    }
  };

  const getResourceStatus = (current: number, optimal: number) => {
    const utilization = (current / optimal) * 100;
    if (utilization < 50) return "low";
    if (utilization < 80) return "optimal";
    if (utilization < 95) return "high";
    return "critical";
  };

  const getResourceColor = (status: string) => {
    switch (status) {
      case "low": return "text-blue-500";
      case "optimal": return "text-green-500";
      case "high": return "text-yellow-500";
      case "critical": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Performance Optimization</h1>
          <p className="text-muted-foreground">High-performance computing and system optimization</p>
        </div>
        <Button onClick={handleRunOptimization}>
          <Zap className="h-4 w-4 mr-2" />
          Run Optimization
        </Button>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processing Speed</p>
                <p className="text-2xl font-bold text-foreground">{performanceMetrics.processingSpeed}s</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Throughput</p>
                <p className="text-2xl font-bold text-foreground">{performanceMetrics.throughput.toLocaleString()}/hr</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">System Uptime</p>
                <p className="text-2xl font-bold text-foreground">{performanceMetrics.uptime}%</p>
              </div>
              <Server className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Error Rate</p>
                <p className="text-2xl font-bold text-foreground">{performanceMetrics.errorRate}%</p>
              </div>
              <Activity className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="optimization" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="optimization">Optimization Features</TabsTrigger>
          <TabsTrigger value="resources">System Resources</TabsTrigger>
          <TabsTrigger value="trends">Performance Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="optimization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Performance Optimization Features
              </CardTitle>
              <CardDescription>
                Advanced optimization features for maximum throughput
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {optimizationFeatures.map((feature, index) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(feature.status)}
                        <h3 className="font-medium text-foreground">{feature.name}</h3>
                        <Badge variant="outline" className="text-xs text-green-600">
                          {feature.impact}
                        </Badge>
                      </div>
                      <Badge variant={getStatusColor(feature.status)}>
                        {feature.status}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {feature.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 flex-1 mr-3">
                        <p className="text-xs text-muted-foreground mb-1">Recommendation</p>
                        <p className="text-sm font-medium">{feature.recommendation}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleConfigureFeature(feature.name, feature.status === "enabled")}
                      >
                        {feature.status === "enabled" ? "Configure" : "Enable"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                System Resource Utilization
              </CardTitle>
              <CardDescription>
                Real-time monitoring of system resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemResources.map((resource, index) => {
                  const status = getResourceStatus(resource.current, resource.optimal);
                  return (
                    <div key={index} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-foreground">{resource.name}</h3>
                        <Badge variant="outline" className={getResourceColor(status)}>
                          {status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Current Usage</p>
                          <div className="flex items-center gap-2">
                            <Progress value={(resource.current / resource.optimal) * 100} className="flex-1" />
                            <span className="text-sm font-medium">
                              {resource.current}{resource.unit}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Peak (24h)</p>
                          <p className="text-sm font-medium">{resource.peak}{resource.unit}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Optimal Limit</p>
                          <p className="text-sm font-medium">{resource.optimal}{resource.unit}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  CPU Performance
                </CardTitle>
                <CardDescription>Processor utilization and optimization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <span className="text-sm">Parallel Processing</span>
                    <Badge variant="outline" className="text-green-600">16 cores active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <span className="text-sm">Load Balancing</span>
                    <Badge variant="outline" className="text-green-600">Optimized</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <span className="text-sm">CPU Frequency</span>
                    <Badge variant="outline" className="text-green-600">3.2 GHz</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Storage Optimization
                </CardTitle>
                <CardDescription>Disk performance and caching</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <span className="text-sm">SSD Storage</span>
                    <Badge variant="outline" className="text-green-600">NVMe enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <span className="text-sm">Cache Hit Rate</span>
                    <Badge variant="outline" className="text-green-600">94.7%</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <span className="text-sm">Compression</span>
                    <Badge variant="outline" className="text-green-600">67% savings</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Trends
              </CardTitle>
              <CardDescription>
                24-hour performance analytics and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-foreground mb-4">Throughput & Latency Trends</h3>
                  <div className="space-y-3">
                    {performanceTrends.map((trend, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <span className="text-sm font-medium">{trend.time}</span>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Throughput</p>
                            <p className="text-sm font-medium">{trend.throughput}/hr</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Latency</p>
                            <p className="text-sm font-medium">{trend.latency}ms</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-foreground mb-4">Peak Hours Analysis</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Highest Throughput</span>
                        <span className="text-sm font-medium">12:00 - 2,400/hr</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Lowest Latency</span>
                        <span className="text-sm font-medium">04:00 - 120ms</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Optimal Window</span>
                        <span className="text-sm font-medium">04:00 - 08:00</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-foreground mb-4">Optimization Impact</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Speed Improvement</span>
                        <span className="text-sm font-medium text-green-600">+340%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Resource Efficiency</span>
                        <span className="text-sm font-medium text-green-600">+156%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Cost Reduction</span>
                        <span className="text-sm font-medium text-green-600">-45%</span>
                      </div>
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