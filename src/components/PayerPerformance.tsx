import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Timer, Activity, BarChart3, Target, Zap, Eye, Shield, Download, RefreshCw
} from "lucide-react";
import { EDIFile } from "@/pages/Index";
import { parseEDIContent } from "@/utils/ediParser";

interface PayerMetrics {
  payerName: string;
  payerId: string;
  totalFiles: number;
  avgResponseTime: number;
  errorRate: number;
  successRate: number;
  avgFileSize: number;
  processingEfficiency: number;
  complianceScore: number;
  memberVolume: number;
  lastActivity: Date;
  trend: 'up' | 'down' | 'stable';
}

interface PayerPerformanceData {
  responseTime: number[];
  errorCount: number[];
  volumeProcessed: number[];
  timestamps: string[];
}

interface PayerPerformanceProps {
  files: EDIFile[];
}

export const PayerPerformance = ({ files }: PayerPerformanceProps) => {
  const { toast } = useToast();
  const [payerMetrics, setPayerMetrics] = useState<PayerMetrics[]>([]);
  const [selectedPayer, setSelectedPayer] = useState<string>("");
  const [performanceData, setPerformanceData] = useState<Record<string, PayerPerformanceData>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    toast({
      title: "Refreshing Data",
      description: "Updating payer performance metrics...",
    });
    
    // Simulate API call
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Data Updated",
        description: "Payer performance metrics have been refreshed.",
      });
    }, 2000);
  };

  const handleExportReport = () => {
    toast({
      title: "Exporting Report",
      description: "Generating payer performance report...",
    });
  };

  const handleViewDetails = (payerId: string, payerName: string) => {
    setSelectedPayer(payerId);
    toast({
      title: "Payer Details",
      description: `Viewing detailed metrics for ${payerName}`,
    });
  };

  const payerAnalysis = useMemo(() => {
    if (!files.length) return { metrics: [], performanceData: {} };

    const payerMap = new Map<string, {
      files: EDIFile[];
      responseTimes: number[];
      errors: number;
      totalMembers: number;
      fileProcessed: Date[];
    }>();

    files.forEach((file, index) => {
      const parsed = parseEDIContent(file.content);
      let payerId = "UNKNOWN";
      let payerName = "Unknown Payer";

      // Extract payer information from ISA/GS segments
      parsed.segments.forEach(segment => {
        if (segment.tag === 'ISA') {
          const senderId = segment.elements[6] || "";
          if (senderId.includes('AETNA') || senderId.includes('AET')) {
            payerId = 'AETNA';
            payerName = 'Aetna Better Health';
          } else if (senderId.includes('KAISER') || senderId.includes('KP')) {
            payerId = 'KAISER';
            payerName = 'Kaiser Permanente';
          } else if (senderId.includes('BCBS') || senderId.includes('BLUE')) {
            payerId = 'BCBS_AL';
            payerName = 'Blue Cross Blue Shield Alabama';
          } else if (senderId.includes('CIGNA')) {
            payerId = 'CIGNA';
            payerName = 'Cigna Healthcare';
          } else if (senderId.includes('UNITED') || senderId.includes('UHC')) {
            payerId = 'UNITED';
            payerName = 'UnitedHealthcare';
          }
        }
      });

      if (!payerMap.has(payerId)) {
        payerMap.set(payerId, {
          files: [],
          responseTimes: [],
          errors: 0,
          totalMembers: 0,
          fileProcessed: []
        });
      }

      const payerData = payerMap.get(payerId)!;
      payerData.files.push(file);
      
      // Simulate response time based on file complexity and payer efficiency
      const fileComplexity = parsed.segments.length;
      const baseResponseTime = payerId === 'AETNA' ? 150 : 
                              payerId === 'KAISER' ? 120 : 
                              payerId === 'BCBS_AL' ? 200 : 180;
      const responseTime = baseResponseTime + (fileComplexity * 0.1) + (Math.random() * 50);
      payerData.responseTimes.push(responseTime);

      // Count members and errors
      const memberCount = parsed.segments.filter(s => s.tag === 'INS').length;
      payerData.totalMembers += memberCount;
      
      // Simulate errors based on payer performance characteristics
      const errorProbability = payerId === 'AETNA' ? 0.02 : 
                              payerId === 'KAISER' ? 0.015 : 
                              payerId === 'BCBS_AL' ? 0.035 : 0.025;
      if (Math.random() < errorProbability) {
        payerData.errors++;
      }

      payerData.fileProcessed.push(new Date(Date.now() - (files.length - index) * 24 * 60 * 60 * 1000));
    });

    const metrics: PayerMetrics[] = Array.from(payerMap.entries()).map(([payerId, data]) => {
      const avgResponseTime = data.responseTimes.reduce((a, b) => a + b, 0) / data.responseTimes.length;
      const errorRate = (data.errors / data.files.length) * 100;
      const successRate = 100 - errorRate;
      const avgFileSize = data.files.reduce((sum, f) => sum + f.content.length, 0) / data.files.length / 1024; // KB
      const processingEfficiency = Math.max(0, 100 - (avgResponseTime / 10) - errorRate);
      const complianceScore = Math.max(70, 100 - (errorRate * 5) - (avgResponseTime > 300 ? 10 : 0));
      
      // Determine trend based on recent performance
      const recentFiles = data.files.slice(-5);
      const recentErrors = recentFiles.filter((_, i) => i < data.errors).length;
      const recentErrorRate = recentFiles.length ? (recentErrors / recentFiles.length) * 100 : 0;
      const trend: 'up' | 'down' | 'stable' = recentErrorRate < errorRate ? 'up' : 
                                             recentErrorRate > errorRate ? 'down' : 'stable';

      const payerNames: Record<string, string> = {
        'AETNA': 'Aetna Better Health',
        'KAISER': 'Kaiser Permanente', 
        'BCBS_AL': 'Blue Cross Blue Shield Alabama',
        'CIGNA': 'Cigna Healthcare',
        'UNITED': 'UnitedHealthcare',
        'UNKNOWN': 'Unknown Payer'
      };

      return {
        payerName: payerNames[payerId] || payerId,
        payerId,
        totalFiles: data.files.length,
        avgResponseTime,
        errorRate,
        successRate,
        avgFileSize,
        processingEfficiency,
        complianceScore,
        memberVolume: data.totalMembers,
        lastActivity: Math.max(...data.fileProcessed.map(d => d.getTime())) ? new Date(Math.max(...data.fileProcessed.map(d => d.getTime()))) : new Date(),
        trend
      };
    }).sort((a, b) => b.totalFiles - a.totalFiles);

    // Generate performance data for charts
    const performanceData: Record<string, PayerPerformanceData> = {};
    Array.from(payerMap.entries()).forEach(([payerId, data]) => {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      performanceData[payerId] = {
        responseTime: last7Days.map(() => 
          data.responseTimes[Math.floor(Math.random() * data.responseTimes.length)] || 0
        ),
        errorCount: last7Days.map(() => Math.floor(Math.random() * 3)),
        volumeProcessed: last7Days.map(() => Math.floor(Math.random() * 50) + 10),
        timestamps: last7Days
      };
    });

    return { metrics, performanceData };
  }, [files]);

  useEffect(() => {
    setPayerMetrics(payerAnalysis.metrics);
    setPerformanceData(payerAnalysis.performanceData);
    if (payerAnalysis.metrics.length > 0 && !selectedPayer) {
      setSelectedPayer(payerAnalysis.metrics[0].payerId);
    }
  }, [payerAnalysis]);

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    format = 'number',
    color = 'blue',
    target 
  }: {
    title: string;
    value: number;
    icon: any;
    trend?: 'up' | 'down' | 'stable';
    format?: 'number' | 'percentage' | 'time' | 'size';
    color?: 'blue' | 'green' | 'red' | 'yellow';
    target?: number;
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case 'percentage': return `${val.toFixed(1)}%`;
        case 'time': return `${val.toFixed(0)}ms`;
        case 'size': return `${val.toFixed(1)}KB`;
        default: return val.toLocaleString();
      }
    };

    const colorClasses = {
      blue: 'text-blue-600 bg-blue-50 dark:bg-blue-950',
      green: 'text-green-600 bg-green-50 dark:bg-green-950',
      red: 'text-red-600 bg-red-50 dark:bg-red-950',
      yellow: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950'
    };

    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-xl font-bold">{formatValue(value)}</p>
              {target && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Target: {formatValue(target)}</span>
                    <span>{value >= target ? '✓' : '⚠'}</span>
                  </div>
                  <Progress value={(value / target) * 100} className="h-1" />
                </div>
              )}
              {trend && (
                <div className="flex items-center gap-1">
                  {trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : trend === 'down' ? (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  ) : (
                    <Activity className="h-3 w-3 text-gray-500" />
                  )}
                  <span className={`text-xs ${
                    trend === 'up' ? 'text-green-500' : 
                    trend === 'down' ? 'text-red-500' : 'text-gray-500'
                  }`}>
                    {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
                  </span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const getPerformanceColor = (value: number, type: 'responseTime' | 'errorRate' | 'efficiency') => {
    switch (type) {
      case 'responseTime':
        return value <= 200 ? 'green' : value <= 400 ? 'yellow' : 'red';
      case 'errorRate':
        return value <= 2 ? 'green' : value <= 5 ? 'yellow' : 'red';
      case 'efficiency':
        return value >= 80 ? 'green' : value >= 60 ? 'yellow' : 'red';
      default:
        return 'blue';
    }
  };

  if (!files.length) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Payer Performance Analytics</h3>
            <p className="text-muted-foreground">Upload EDI files to analyze payer response times and performance metrics</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6" />
            Payer Performance Analytics
          </h2>
          <p className="text-muted-foreground">Real-time payer response times, error rates, and efficiency metrics</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefreshData}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
          <Button onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Activity className="h-3 w-3 mr-1" />
            Live Monitoring
          </Badge>
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <Shield className="h-3 w-3 mr-1" />
            SLA Tracking
          </Badge>
        </div>
      </div>

      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950">
        <Eye className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <strong>Performance Summary:</strong> Monitoring {payerMetrics.length} payers across {files.length} files. 
          Average response time: {payerMetrics.length ? (payerMetrics.reduce((sum, p) => sum + p.avgResponseTime, 0) / payerMetrics.length).toFixed(0) : 0}ms
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Payer Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance Details</TabsTrigger>
          <TabsTrigger value="comparison">Payer Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Average Response Time"
              value={payerMetrics.length ? payerMetrics.reduce((sum, p) => sum + p.avgResponseTime, 0) / payerMetrics.length : 0}
              icon={Timer}
              format="time"
              color={getPerformanceColor(payerMetrics.length ? payerMetrics.reduce((sum, p) => sum + p.avgResponseTime, 0) / payerMetrics.length : 0, 'responseTime')}
              target={250}
            />
            <MetricCard
              title="Overall Error Rate"
              value={payerMetrics.length ? payerMetrics.reduce((sum, p) => sum + p.errorRate, 0) / payerMetrics.length : 0}
              icon={AlertTriangle}
              format="percentage"
              color={getPerformanceColor(payerMetrics.length ? payerMetrics.reduce((sum, p) => sum + p.errorRate, 0) / payerMetrics.length : 0, 'errorRate')}
              target={2}
            />
            <MetricCard
              title="Processing Efficiency"
              value={payerMetrics.length ? payerMetrics.reduce((sum, p) => sum + p.processingEfficiency, 0) / payerMetrics.length : 0}
              icon={Zap}
              format="percentage"
              color={getPerformanceColor(payerMetrics.length ? payerMetrics.reduce((sum, p) => sum + p.processingEfficiency, 0) / payerMetrics.length : 0, 'efficiency')}
              target={85}
            />
            <MetricCard
              title="Active Payers"
              value={payerMetrics.length}
              icon={Activity}
              color="blue"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payer Performance Ranking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payerMetrics.slice(0, 5).map((payer, index) => (
                     <div 
                       key={payer.payerId} 
                       className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                       onClick={() => handleViewDetails(payer.payerId, payer.payerName)}
                     >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{payer.payerName}</p>
                          <p className="text-sm text-muted-foreground">
                            {payer.totalFiles} files • {payer.avgResponseTime.toFixed(0)}ms avg
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${
                          payer.processingEfficiency >= 85 ? 'bg-green-100 text-green-800' :
                          payer.processingEfficiency >= 70 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {payer.processingEfficiency.toFixed(0)}%
                        </Badge>
                        {payer.trend === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : payer.trend === 'down' ? (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        ) : (
                          <Activity className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SLA Compliance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payerMetrics.map(payer => (
                    <div key={payer.payerId} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{payer.payerName}</p>
                        <p className="text-sm text-muted-foreground">
                          Response: {payer.avgResponseTime.toFixed(0)}ms • Errors: {payer.errorRate.toFixed(1)}%
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {payer.avgResponseTime <= 300 && payer.errorRate <= 3 ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        )}
                        <Badge variant={payer.avgResponseTime <= 300 && payer.errorRate <= 3 ? "default" : "destructive"}>
                          {payer.avgResponseTime <= 300 && payer.errorRate <= 3 ? "Meeting SLA" : "SLA Risk"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {payerMetrics.map(payer => (
              <Card key={payer.payerId} className={selectedPayer === payer.payerId ? "ring-2 ring-blue-500" : ""}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{payer.payerName}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{payer.totalFiles} files</Badge>
                    <Badge className={`${
                      payer.trend === 'up' ? 'bg-green-100 text-green-800' :
                      payer.trend === 'down' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {payer.trend}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Response Time</span>
                      <span className={`font-medium ${
                        payer.avgResponseTime <= 200 ? 'text-green-600' :
                        payer.avgResponseTime <= 400 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {payer.avgResponseTime.toFixed(0)}ms
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(100, (500 - payer.avgResponseTime) / 5)} 
                      className="h-2" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Success Rate</span>
                      <span className={`font-medium ${
                        payer.successRate >= 98 ? 'text-green-600' :
                        payer.successRate >= 95 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {payer.successRate.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={payer.successRate} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Efficiency Score</span>
                      <span className={`font-medium ${
                        payer.processingEfficiency >= 85 ? 'text-green-600' :
                        payer.processingEfficiency >= 70 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {payer.processingEfficiency.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={payer.processingEfficiency} className="h-2" />
                  </div>

                  <div className="pt-2 border-t border-border">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Members: {payer.memberVolume.toLocaleString()}</span>
                      <span>Avg Size: {payer.avgFileSize.toFixed(1)}KB</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payer Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-2">Payer</th>
                      <th className="text-right p-2">Files</th>
                      <th className="text-right p-2">Avg Response</th>
                      <th className="text-right p-2">Error Rate</th>
                      <th className="text-right p-2">Efficiency</th>
                      <th className="text-right p-2">Members</th>
                      <th className="text-center p-2">SLA Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payerMetrics.map(payer => (
                      <tr key={payer.payerId} className="border-b border-border hover:bg-gray-50 dark:hover:bg-gray-900">
                        <td className="p-2 font-medium">{payer.payerName}</td>
                        <td className="p-2 text-right">{payer.totalFiles}</td>
                        <td className={`p-2 text-right font-medium ${
                          payer.avgResponseTime <= 200 ? 'text-green-600' :
                          payer.avgResponseTime <= 400 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {payer.avgResponseTime.toFixed(0)}ms
                        </td>
                        <td className={`p-2 text-right font-medium ${
                          payer.errorRate <= 2 ? 'text-green-600' :
                          payer.errorRate <= 5 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {payer.errorRate.toFixed(1)}%
                        </td>
                        <td className={`p-2 text-right font-medium ${
                          payer.processingEfficiency >= 85 ? 'text-green-600' :
                          payer.processingEfficiency >= 70 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {payer.processingEfficiency.toFixed(0)}%
                        </td>
                        <td className="p-2 text-right">{payer.memberVolume.toLocaleString()}</td>
                        <td className="p-2 text-center">
                          {payer.avgResponseTime <= 300 && payer.errorRate <= 3 ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-500 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};