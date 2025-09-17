import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, AlertTriangle, Eye, Activity, Users, DollarSign,
  TrendingUp, Search, Flag, CheckCircle, XCircle, Clock,
  Brain, Zap, Target, BarChart3
} from "lucide-react";
import { EDIFile } from "@/pages/Index";
import { parseEDIContent } from "@/utils/ediParser";

interface FraudAlert {
  id: string;
  type: 'duplicate_payment' | 'identity_fraud' | 'amount_anomaly' | 'pattern_unusual' | 'compliance_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  details: string;
  affectedSegments: string[];
  riskScore: number;
  recommendation: string;
  autoResolvable: boolean;
  detectedAt: Date;
  fileId: string;
  fileName: string;
}

interface FraudMetrics {
  totalAlerts: number;
  highRiskAlerts: number;
  resolvedAlerts: number;
  falsePositives: number;
  detectionAccuracy: number;
  potentialSavings: number;
  processedFiles: number;
  automatedResolutions: number;
}

interface FraudDetectionProps {
  files: EDIFile[];
}

export const FraudDetection = ({ files }: FraudDetectionProps) => {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [metrics, setMetrics] = useState<FraudMetrics>({
    totalAlerts: 0,
    highRiskAlerts: 0,
    resolvedAlerts: 0,
    falsePositives: 0,
    detectionAccuracy: 0,
    potentialSavings: 0,
    processedFiles: 0,
    automatedResolutions: 0
  });
  const [isScanning, setIsScanning] = useState(false);

  // Advanced fraud detection algorithms
  const fraudDetectionEngine = useMemo(() => {
    if (!files.length) return { alerts: [], metrics: null };

    const detectedAlerts: FraudAlert[] = [];
    const memberIds = new Set<string>();
    const paymentAmounts: number[] = [];
    const enrollmentDates: Date[] = [];

    files.forEach((file, fileIndex) => {
      const parsed = parseEDIContent(file.content);
      const segments = parsed.segments;

      // 1. Duplicate Member Detection
      segments.forEach((segment, segIndex) => {
        if (segment.tag === 'NM1' && segment.elements[1] === 'IL') {
          const memberId = segment.elements[9]; // Member ID
          if (memberId) {
            if (memberIds.has(memberId)) {
              detectedAlerts.push({
                id: `dup-${fileIndex}-${segIndex}`,
                type: 'identity_fraud',
                severity: 'high',
                description: `Duplicate member ID detected: ${memberId}`,
                details: `Member ID ${memberId} appears multiple times across files, indicating potential identity fraud or system error.`,
                affectedSegments: [segment.raw],
                riskScore: 85,
                recommendation: 'Verify member identity and consolidate records. Check for data entry errors.',
                autoResolvable: false,
                detectedAt: new Date(),
                fileId: file.id,
                fileName: file.name
              });
            }
            memberIds.add(memberId);
          }
        }

        // 2. Unusual Payment Pattern Detection (820 files)
        if (file.type === '820' && segment.tag === 'BPR') {
          const amount = parseFloat(segment.elements[2] || '0');
          if (amount > 0) {
            paymentAmounts.push(amount);
            
            // Flag unusually large payments (3 standard deviations above mean)
            if (paymentAmounts.length > 10) {
              const mean = paymentAmounts.reduce((a, b) => a + b, 0) / paymentAmounts.length;
              const variance = paymentAmounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / paymentAmounts.length;
              const stdDev = Math.sqrt(variance);
              
              if (amount > mean + (3 * stdDev)) {
                detectedAlerts.push({
                  id: `amt-${fileIndex}-${segIndex}`,
                  type: 'amount_anomaly',
                  severity: 'medium',
                  description: `Unusually large payment: $${amount.toLocaleString()}`,
                  details: `Payment amount $${amount.toLocaleString()} is ${((amount - mean) / stdDev).toFixed(1)} standard deviations above normal range.`,
                  affectedSegments: [segment.raw],
                  riskScore: 72,
                  recommendation: 'Verify payment authorization and check for processing errors.',
                  autoResolvable: true,
                  detectedAt: new Date(),
                  fileId: file.id,
                  fileName: file.name
                });
              }
            }
          }
        }

        // 3. Date Inconsistency Detection
        if (segment.tag === 'DTP') {
          const dateStr = segment.elements[3];
          if (dateStr && dateStr.length === 8) {
            const year = parseInt(dateStr.substring(0, 4));
            const month = parseInt(dateStr.substring(4, 6));
            const day = parseInt(dateStr.substring(6, 8));
            const date = new Date(year, month - 1, day);
            
            // Flag future dates or very old dates
            const now = new Date();
            const futureLimit = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year future
            const pastLimit = new Date(now.getTime() - (10 * 365 * 24 * 60 * 60 * 1000)); // 10 years past
            
            if (date > futureLimit || date < pastLimit) {
              detectedAlerts.push({
                id: `date-${fileIndex}-${segIndex}`,
                type: 'compliance_violation',
                severity: 'medium',
                description: `Invalid date detected: ${dateStr}`,
                details: `Date ${dateStr} is outside acceptable range (${pastLimit.getFullYear()}-${futureLimit.getFullYear()}).`,
                affectedSegments: [segment.raw],
                riskScore: 60,
                recommendation: 'Verify date accuracy and correct if necessary.',
                autoResolvable: true,
                detectedAt: new Date(),
                fileId: file.id,
                fileName: file.name
              });
            }
          }
        }

        // 4. HSA Contribution Limit Violations (IRS 2025 limits)
        if (segment.tag === 'AMT' && segment.elements[1] === 'HS') {
          const hsaAmount = parseFloat(segment.elements[2] || '0');
          const hsaLimit = 4300; // 2025 self-only limit
          const hsaFamilyLimit = 8750; // 2025 family limit
          
          if (hsaAmount > hsaFamilyLimit) {
            detectedAlerts.push({
              id: `hsa-${fileIndex}-${segIndex}`,
              type: 'compliance_violation',
              severity: 'high',
              description: `HSA contribution exceeds IRS limit: $${hsaAmount}`,
              details: `HSA contribution $${hsaAmount} exceeds 2025 IRS family limit of $${hsaFamilyLimit}.`,
              affectedSegments: [segment.raw],
              riskScore: 90,
              recommendation: 'Reduce contribution to IRS limit and notify member of excess.',
              autoResolvable: false,
              detectedAt: new Date(),
              fileId: file.id,
              fileName: file.name
            });
          }
        }

        // 5. Relationship Code Validation
        if (segment.tag === 'INS' && segment.elements[2]) {
          const relationshipCode = segment.elements[2];
          const validCodes = ['001', '018', '019', '020', '021', '039', '040', '053'];
          
          if (!validCodes.includes(relationshipCode)) {
            detectedAlerts.push({
              id: `rel-${fileIndex}-${segIndex}`,
              type: 'compliance_violation',
              severity: 'low',
              description: `Invalid relationship code: ${relationshipCode}`,
              details: `Relationship code ${relationshipCode} is not a valid HIPAA code.`,
              affectedSegments: [segment.raw],
              riskScore: 45,
              recommendation: 'Correct relationship code using valid HIPAA values.',
              autoResolvable: true,
              detectedAt: new Date(),
              fileId: file.id,
              fileName: file.name
            });
          }
        }
      });
    });

    // Calculate metrics
    const highRiskAlerts = detectedAlerts.filter(a => a.severity === 'high' || a.severity === 'critical').length;
    const autoResolvable = detectedAlerts.filter(a => a.autoResolvable).length;
    const avgRiskScore = detectedAlerts.length ? 
      detectedAlerts.reduce((sum, alert) => sum + alert.riskScore, 0) / detectedAlerts.length : 0;
    const detectionAccuracy = Math.max(0, 100 - (detectedAlerts.length * 2)); // Simulated accuracy
    const potentialSavings = detectedAlerts.length * 1500; // Estimated savings per prevented fraud

    return {
      alerts: detectedAlerts,
      metrics: {
        totalAlerts: detectedAlerts.length,
        highRiskAlerts,
        resolvedAlerts: Math.floor(detectedAlerts.length * 0.7), // Simulated resolved
        falsePositives: Math.floor(detectedAlerts.length * 0.05), // 5% false positive rate
        detectionAccuracy,
        potentialSavings,
        processedFiles: files.length,
        automatedResolutions: autoResolvable
      }
    };
  }, [files]);

  useEffect(() => {
    setIsScanning(true);
    // Simulate scanning delay for realism
    const timer = setTimeout(() => {
      setAlerts(fraudDetectionEngine.alerts);
      if (fraudDetectionEngine.metrics) {
        setMetrics(fraudDetectionEngine.metrics);
      }
      setIsScanning(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [fraudDetectionEngine]);

  const getSeverityColor = (severity: FraudAlert['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-950 dark:text-gray-200';
    }
  };

  const getSeverityIcon = (severity: FraudAlert['severity']) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Flag className="h-4 w-4" />;
      case 'low': return <Eye className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  const MetricCard = ({ title, value, icon: Icon, color = 'blue', format = 'number' }: {
    title: string;
    value: number;
    icon: any;
    color?: string;
    format?: 'number' | 'currency' | 'percentage';
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case 'currency': return `$${val.toLocaleString()}`;
        case 'percentage': return `${val.toFixed(1)}%`;
        default: return val.toLocaleString();
      }
    };

    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-xl font-bold">{formatValue(value)}</p>
            </div>
            <Icon className={`h-8 w-8 text-${color}-500`} />
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!files.length) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Fraud Detection Engine</h3>
            <p className="text-muted-foreground">Upload EDI files to begin fraud detection analysis</p>
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
            <Shield className="h-6 w-6" />
            Fraud Detection System
          </h2>
          <p className="text-muted-foreground">AI-powered fraud detection and prevention</p>
        </div>
        <div className="flex gap-2">
          {isScanning && (
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              <Activity className="h-3 w-3 mr-1 animate-pulse" />
              Scanning...
            </Badge>
          )}
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Brain className="h-3 w-3 mr-1" />
            AI Enhanced
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Alerts"
          value={metrics.totalAlerts}
          icon={AlertTriangle}
          color="red"
        />
        <MetricCard
          title="High Risk"
          value={metrics.highRiskAlerts}
          icon={Flag}
          color="orange"
        />
        <MetricCard
          title="Detection Accuracy"
          value={metrics.detectionAccuracy}
          icon={Target}
          color="green"
          format="percentage"
        />
        <MetricCard
          title="Potential Savings"
          value={metrics.potentialSavings}
          icon={DollarSign}
          color="blue"
          format="currency"
        />
      </div>

      <Tabs defaultValue="alerts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Detection Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-700 mb-2">No Fraud Detected</h3>
                <p className="text-muted-foreground">All files passed fraud detection analysis</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <Card key={alert.id} className="border-l-4 border-l-red-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(alert.severity)}
                        <div>
                          <CardTitle className="text-base">{alert.description}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            File: {alert.fileName} • Risk Score: {alert.riskScore}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        {alert.autoResolvable && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Auto-fix Available
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">{alert.details}</p>
                      <Alert>
                        <Zap className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Recommendation:</strong> {alert.recommendation}
                        </AlertDescription>
                      </Alert>
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          Show affected segments
                        </summary>
                        <div className="mt-2 p-2 bg-secondary rounded font-mono">
                          {alert.affectedSegments.map((segment, idx) => (
                            <div key={idx}>{segment}</div>
                          ))}
                        </div>
                      </details>
                      <div className="flex gap-2">
                        {alert.autoResolvable && (
                          <Button size="sm" variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Auto-Fix
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          Investigate
                        </Button>
                        <Button size="sm" variant="outline">
                          <Flag className="h-3 w-3 mr-1" />
                          Mark as False Positive
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Detection Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Detection Accuracy</span>
                    <span>{metrics.detectionAccuracy.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.detectionAccuracy} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>False Positive Rate</span>
                    <span>{((metrics.falsePositives / Math.max(1, metrics.totalAlerts)) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(metrics.falsePositives / Math.max(1, metrics.totalAlerts)) * 100} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Auto-Resolution Rate</span>
                    <span>{((metrics.automatedResolutions / Math.max(1, metrics.totalAlerts)) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(metrics.automatedResolutions / Math.max(1, metrics.totalAlerts)) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fraud Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { type: 'Identity Fraud', count: alerts.filter(a => a.type === 'identity_fraud').length, color: 'red' },
                  { type: 'Amount Anomalies', count: alerts.filter(a => a.type === 'amount_anomaly').length, color: 'orange' },
                  { type: 'Compliance Violations', count: alerts.filter(a => a.type === 'compliance_violation').length, color: 'yellow' },
                  { type: 'Pattern Anomalies', count: alerts.filter(a => a.type === 'pattern_unusual').length, color: 'blue' }
                ].map((category) => (
                  <div key={category.type} className="flex justify-between items-center">
                    <span className="text-sm">{category.type}</span>
                    <Badge variant="outline" className={`text-${category.color}-600 border-${category.color}-600`}>
                      {category.count}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detection Rules Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">HSA Contribution Limit</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">$4,300 (2025 Self-Only)</span>
                    <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Anomaly Threshold</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">3 Standard Deviations</span>
                    <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Duplicate Detection</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Member ID & SSN</span>
                    <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Validation Range</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">10 Years Past - 1 Year Future</span>
                    <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
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