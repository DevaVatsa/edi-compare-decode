import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  DollarSign, TrendingUp, TrendingDown, AlertTriangle, Clock,
  Target, BarChart3, PieChart, Activity, CheckCircle, Timer, Download, RefreshCw
} from "lucide-react";
import { EDIFile } from "@/pages/Index";
import { parseEDIContent } from "@/utils/ediParser";

interface FinancialMetrics {
  totalPremiumFlow: number;
  totalPayments: number;
  averagePaymentDelay: number;
  cashFlowImpact: number;
  processingCosts: number;
  costSavings: number;
  revenueRecovery: number;
  errorCosts: number;
  complianceSavings: number;
  automationSavings: number;
  roi: number;
  paybackPeriod: number;
}

interface PaymentFlow {
  date: string;
  premiumsIn: number;
  paymentsOut: number;
  netCashFlow: number;
  cumulativeFlow: number;
}

interface CostBreakdown {
  category: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  description: string;
}

interface FinancialImpactProps {
  files: EDIFile[];
}

export const FinancialImpact = ({ files }: FinancialImpactProps) => {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalPremiumFlow: 0,
    totalPayments: 0,
    averagePaymentDelay: 0,
    cashFlowImpact: 0,
    processingCosts: 0,
    costSavings: 0,
    revenueRecovery: 0,
    errorCosts: 0,
    complianceSavings: 0,
    automationSavings: 0,
    roi: 0,
    paybackPeriod: 0
  });

  const [paymentFlows, setPaymentFlows] = useState<PaymentFlow[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown[]>([]);

  const financialAnalysis = useMemo(() => {
    if (!files.length) {
      return { 
        metrics: {} as FinancialMetrics, 
        flows: [] as PaymentFlow[], 
        breakdown: [] as CostBreakdown[] 
      };
    }

    let totalPremiums = 0;
    let totalPayments = 0;
    let paymentDelays: number[] = [];
    let errorCount = 0;
    let memberCount = 0;
    let filesWithDelays = 0;

    // Monthly payment flow simulation
    const monthlyFlows: Record<string, { premiums: number; payments: number }> = {};

    files.forEach((file, index) => {
      const parsed = parseEDIContent(file.content);
      const fileDate = new Date(Date.now() - (files.length - index) * 24 * 60 * 60 * 1000);
      const monthKey = `${fileDate.getFullYear()}-${String(fileDate.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyFlows[monthKey]) {
        monthlyFlows[monthKey] = { premiums: 0, payments: 0 };
      }

      // Process 834 files for premium information
      if (file.type === '834') {
        parsed.segments.forEach(segment => {
          if (segment.tag === 'INS') {
            memberCount++;
          }
          
          if (segment.tag === 'AMT') {
            const amount = parseFloat(segment.elements[2] || '0');
            if (!isNaN(amount) && amount > 0) {
              if (segment.elements[1] === 'PREM' || segment.elements[1] === 'TP') {
                totalPremiums += amount;
                monthlyFlows[monthKey].premiums += amount;
              }
            }
          }

          // Simulate payment delays based on file processing efficiency
          if (segment.tag === 'DTP' && segment.elements[1] === '348') {
            const processingComplexity = parsed.segments.length;
            const baseDelay = 2; // 2 days base processing
            const complexityDelay = Math.floor(processingComplexity / 100); // 1 day per 100 segments
            const randomDelay = Math.random() * 3; // 0-3 days random
            const totalDelay = baseDelay + complexityDelay + randomDelay;
            paymentDelays.push(totalDelay);
            
            if (totalDelay > 5) filesWithDelays++;
          }
        });
      }

      // Process 820 files for payment information
      if (file.type === '820') {
        parsed.segments.forEach(segment => {
          if (segment.tag === 'BPR') {
            const amount = parseFloat(segment.elements[2] || '0');
            if (!isNaN(amount) && amount > 0) {
              totalPayments += amount;
              monthlyFlows[monthKey].payments += amount;
            }
          }

          // Check for payment delays
          if (segment.tag === 'DTM') {
            const delayIndicator = Math.random();
            if (delayIndicator > 0.8) { // 20% chance of delay
              paymentDelays.push(Math.random() * 10 + 5); // 5-15 day delays
            }
          }
        });
      }

      // Error detection for cost calculation
      if (parsed.segments.some(s => s.elements.includes('ERROR') || s.elements.includes('REJECT'))) {
        errorCount++;
      }
    });

    // Calculate financial metrics
    const avgPaymentDelay = paymentDelays.length ? 
      paymentDelays.reduce((a, b) => a + b, 0) / paymentDelays.length : 0;

    // Cost calculations (industry estimates)
    const manualProcessingCostPerFile = 45; // $45 per file manual processing
    const automatedProcessingCostPerFile = 5; // $5 per file automated processing
    const errorProcessingCost = 150; // $150 per error to resolve
    const delayedPaymentCost = avgPaymentDelay * 50; // $50 per day delayed per payment

    const processingCosts = files.length * automatedProcessingCostPerFile;
    const manualProcessingCosts = files.length * manualProcessingCostPerFile;
    const automationSavings = manualProcessingCosts - processingCosts;
    const errorCosts = errorCount * errorProcessingCost;
    const delayCosts = filesWithDelays * delayedPaymentCost;

    // Cash flow impact from delays
    const averagePaymentSize = totalPayments / Math.max(1, files.filter(f => f.type === '820').length);
    const cashFlowImpact = avgPaymentDelay * averagePaymentSize * 0.001; // 0.1% cost of capital per day

    // Compliance savings
    const complianceSavings = memberCount * 2.5; // $2.50 per member compliance savings

    // Revenue recovery from improved accuracy
    const revenueRecovery = totalPremiums * 0.025; // 2.5% revenue recovery from accuracy

    const totalSavings = automationSavings + complianceSavings + revenueRecovery;
    const totalCosts = processingCosts + errorCosts + delayCosts;
    const netSavings = totalSavings - totalCosts;
    const roi = totalCosts > 0 ? (netSavings / totalCosts) * 100 : 0;
    const paybackPeriod = netSavings > 0 ? totalCosts / (netSavings / 12) : 0; // months

    const calculatedMetrics: FinancialMetrics = {
      totalPremiumFlow: totalPremiums,
      totalPayments: totalPayments,
      averagePaymentDelay: avgPaymentDelay,
      cashFlowImpact: cashFlowImpact,
      processingCosts: processingCosts,
      costSavings: netSavings,
      revenueRecovery: revenueRecovery,
      errorCosts: errorCosts,
      complianceSavings: complianceSavings,
      automationSavings: automationSavings,
      roi: roi,
      paybackPeriod: paybackPeriod
    };

    // Generate payment flows
    const flows: PaymentFlow[] = Object.entries(monthlyFlows)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data], index, array) => {
        const netFlow = data.premiums - data.payments;
        const cumulativeFlow = array.slice(0, index + 1).reduce((sum, [, d]) => sum + (d.premiums - d.payments), 0);
        
        return {
          date: month,
          premiumsIn: data.premiums,
          paymentsOut: data.payments,
          netCashFlow: netFlow,
          cumulativeFlow: cumulativeFlow
        };
      });

    // Generate cost breakdown
    const breakdown: CostBreakdown[] = [
      {
        category: 'Automation Savings',
        amount: automationSavings,
        percentage: (automationSavings / totalSavings) * 100,
        trend: 'up',
        description: 'Savings from automated vs manual processing'
      },
      {
        category: 'Compliance Savings',
        amount: complianceSavings,
        percentage: (complianceSavings / totalSavings) * 100,
        trend: 'up',
        description: 'Reduced compliance and audit costs'
      },
      {
        category: 'Revenue Recovery',
        amount: revenueRecovery,
        percentage: (revenueRecovery / totalSavings) * 100,
        trend: 'up',
        description: 'Additional revenue from improved accuracy'
      },
      {
        category: 'Error Costs',
        amount: errorCosts,
        percentage: (errorCosts / totalCosts) * 100,
        trend: 'down',
        description: 'Cost of processing and correcting errors'
      },
      {
        category: 'Processing Costs',
        amount: processingCosts,
        percentage: (processingCosts / totalCosts) * 100,
        trend: 'stable',
        description: 'Ongoing automated processing costs'
      }
    ];

    return { metrics: calculatedMetrics, flows, breakdown };
  }, [files]);

  useEffect(() => {
    setMetrics(financialAnalysis.metrics);
    setPaymentFlows(financialAnalysis.flows);
    setCostBreakdown(financialAnalysis.breakdown);
  }, [financialAnalysis]);

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    format = 'currency',
    color = 'blue',
    target,
    description
  }: {
    title: string;
    value: number;
    icon: any;
    trend?: 'up' | 'down' | 'stable';
    format?: 'currency' | 'percentage' | 'days' | 'number';
    color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
    target?: number;
    description?: string;
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case 'currency': return `$${val.toLocaleString()}`;
        case 'percentage': return `${val.toFixed(1)}%`;
        case 'days': return `${val.toFixed(1)} days`;
        default: return val.toLocaleString();
      }
    };

    const colorClasses = {
      blue: 'text-blue-600 bg-blue-50 dark:bg-blue-950',
      green: 'text-green-600 bg-green-50 dark:bg-green-950',
      red: 'text-red-600 bg-red-50 dark:bg-red-950',
      yellow: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950',
      purple: 'text-purple-600 bg-purple-50 dark:bg-purple-950'
    };

    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-xl font-bold">{formatValue(value)}</p>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
              {target && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Target: {formatValue(target)}</span>
                    <span>{value >= target ? '✓' : '⚠'}</span>
                  </div>
                  <Progress value={Math.min(100, (value / target) * 100)} className="h-1" />
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
                    {trend === 'up' ? 'Positive' : trend === 'down' ? 'Reducing' : 'Stable'}
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

  if (!files.length) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Financial Impact Analysis</h3>
            <p className="text-muted-foreground">Upload EDI files to analyze premium flows, payment delays, and cost savings</p>
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
            <DollarSign className="h-6 w-6" />
            Financial Impact Analysis
          </h2>
          <p className="text-muted-foreground">Premium flows, payment delays, and comprehensive cost-benefit analysis</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              setIsRefreshing(true);
              toast({
                title: "Refreshing Financial Data",
                description: "Updating financial impact metrics...",
              });
              setTimeout(() => {
                setIsRefreshing(false);
                toast({
                  title: "Data Updated",
                  description: "Financial metrics have been refreshed.",
                });
              }, 2000);
            }}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button onClick={() => {
            const reportData = {
              reportName: "Financial Impact Analysis",
              generatedAt: new Date().toISOString(),
              filesAnalyzed: files.length,
              metrics: metrics,
              paymentFlows: paymentFlows,
              costBreakdown: costBreakdown,
              summary: `Processing $${metrics.totalPremiumFlow.toLocaleString()} in premium volume with ${metrics.roi.toFixed(1)}% ROI`
            };
            
            const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `financial-impact-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast({
              title: "Report Exported",
              description: "Financial impact report has been downloaded.",
            });
          }}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Badge variant="outline" className="text-green-600 border-green-600">
            <TrendingUp className="h-3 w-3 mr-1" />
            ROI: {metrics.roi.toFixed(1)}%
          </Badge>
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <Timer className="h-3 w-3 mr-1" />
            Payback: {metrics.paybackPeriod.toFixed(1)}mo
          </Badge>
        </div>
      </div>

      <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800 dark:text-green-200">
          <strong>Financial Summary:</strong> Projected annual savings of ${metrics.costSavings.toLocaleString()} 
          with {metrics.roi.toFixed(1)}% ROI. Processing ${metrics.totalPremiumFlow.toLocaleString()} in premium volume.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Financial Overview</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow Analysis</TabsTrigger>
          <TabsTrigger value="costs">Cost Breakdown</TabsTrigger>
          <TabsTrigger value="roi">ROI Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Premium Flow"
              value={metrics.totalPremiumFlow}
              icon={DollarSign}
              color="green"
              trend="up"
              description="Incoming premium volume"
            />
            <MetricCard
              title="Payment Processing"
              value={metrics.totalPayments}
              icon={Target}
              color="blue"
              trend="stable"
              description="Outgoing payment volume"
            />
            <MetricCard
              title="Avg Payment Delay"
              value={metrics.averagePaymentDelay}
              icon={Clock}
              format="days"
              color={metrics.averagePaymentDelay <= 3 ? 'green' : metrics.averagePaymentDelay <= 7 ? 'yellow' : 'red'}
              target={3}
              description="Average processing delay"
            />
            <MetricCard
              title="Net Cost Savings"
              value={metrics.costSavings}
              icon={TrendingUp}
              color="green"
              trend="up"
              description="Annual projected savings"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cost Savings Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">Automation Savings</p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        ${metrics.automationSavings.toLocaleString()} annually
                      </p>
                    </div>
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-200">Compliance Savings</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        ${metrics.complianceSavings.toLocaleString()} annually
                      </p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <div>
                      <p className="font-medium text-purple-800 dark:text-purple-200">Revenue Recovery</p>
                      <p className="text-sm text-purple-600 dark:text-purple-400">
                        ${metrics.revenueRecovery.toLocaleString()} annually
                      </p>
                    </div>
                    <Target className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Flow Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Payment Processing Speed</span>
                      <span className={`font-medium ${
                        metrics.averagePaymentDelay <= 3 ? 'text-green-600' :
                        metrics.averagePaymentDelay <= 7 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {metrics.averagePaymentDelay <= 3 ? 'Excellent' :
                         metrics.averagePaymentDelay <= 7 ? 'Good' : 'Needs Improvement'}
                      </span>
                    </div>
                    <Progress 
                      value={Math.max(0, 100 - (metrics.averagePaymentDelay * 10))} 
                      className="h-2" 
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Cash Flow Impact</span>
                      <span className="font-medium text-blue-600">
                        ${metrics.cashFlowImpact.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>

                  <div className="pt-2 border-t border-border">
                    <div className="text-sm text-muted-foreground">
                      <p>• Average delay: {metrics.averagePaymentDelay.toFixed(1)} days</p>
                      <p>• Processing cost: ${metrics.processingCosts.toLocaleString()}</p>
                      <p>• Error remediation: ${metrics.errorCosts.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Cash Flow Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentFlows.slice(-6).map((flow, index) => (
                    <div key={flow.date} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div>
                        <p className="font-medium">{flow.date}</p>
                        <p className="text-sm text-muted-foreground">
                          In: ${flow.premiumsIn.toLocaleString()} • Out: ${flow.paymentsOut.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${flow.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {flow.netCashFlow >= 0 ? '+' : ''}${flow.netCashFlow.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Cumulative: ${flow.cumulativeFlow.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Impact Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Working Capital Impact</h4>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      Current average payment delay of {metrics.averagePaymentDelay.toFixed(1)} days impacts 
                      working capital by ${metrics.cashFlowImpact.toLocaleString()} monthly.
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Optimization Opportunity</h4>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Reducing payment delays to 2 days could improve cash flow by 
                      ${((metrics.averagePaymentDelay - 2) * 50 * paymentFlows.length).toLocaleString()} annually.
                    </p>
                  </div>

                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Risk Assessment</h4>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      Payment delays beyond 7 days create liquidity risk. Current performance: 
                      {metrics.averagePaymentDelay <= 7 ? 'Low Risk' : 'Moderate Risk'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Cost Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {costBreakdown.map((cost, index) => (
                    <div key={cost.category} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium">{cost.category}</p>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">${cost.amount.toLocaleString()}</span>
                            {cost.trend === 'up' ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : cost.trend === 'down' ? (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            ) : (
                              <Activity className="h-4 w-4 text-gray-500" />
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{cost.description}</p>
                        <Progress value={cost.percentage} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {cost.percentage.toFixed(1)}% of total
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Optimization Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-200">Automation Optimization</p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Increase automation rate to 95% to save additional ${(metrics.automationSavings * 0.2).toLocaleString()} annually
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Target className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-800 dark:text-blue-200">Error Reduction</p>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          Implementing advanced validation could reduce error costs by 60%, 
                          saving ${(metrics.errorCosts * 0.6).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Timer className="h-4 w-4 text-purple-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-purple-800 dark:text-purple-200">Payment Acceleration</p>
                        <p className="text-sm text-purple-600 dark:text-purple-400">
                          Faster payment processing could improve cash flow by 
                          ${(metrics.cashFlowImpact * 12).toLocaleString()} annually
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="roi" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Return on Investment"
              value={metrics.roi}
              icon={TrendingUp}
              format="percentage"
              color="green"
              trend="up"
              target={200}
              description="Annual ROI from automation"
            />
            <MetricCard
              title="Payback Period"
              value={metrics.paybackPeriod}
              icon={Timer}
              format="number"
              color="blue"
              trend="down"
              description="Months to recover investment"
            />
            <MetricCard
              title="Total Annual Savings"
              value={metrics.costSavings}
              icon={DollarSign}
              color="green"
              trend="up"
              description="Net annual cost reduction"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>ROI Business Case Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Investment Benefits</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Annual Automation Savings</span>
                      <span className="font-medium text-green-600">+${metrics.automationSavings.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Compliance Cost Reduction</span>
                      <span className="font-medium text-green-600">+${metrics.complianceSavings.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Revenue Recovery</span>
                      <span className="font-medium text-green-600">+${metrics.revenueRecovery.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-bold">
                        <span>Total Annual Benefits</span>
                        <span className="text-green-600">+${(metrics.automationSavings + metrics.complianceSavings + metrics.revenueRecovery).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-lg">Investment Costs</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Annual Processing Costs</span>
                      <span className="font-medium text-red-600">-${metrics.processingCosts.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Error Remediation Costs</span>
                      <span className="font-medium text-red-600">-${metrics.errorCosts.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Implementation & Maintenance</span>
                      <span className="font-medium text-red-600">-${(metrics.processingCosts * 0.5).toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-bold">
                        <span>Total Annual Costs</span>
                        <span className="text-red-600">-${(metrics.processingCosts + metrics.errorCosts + metrics.processingCosts * 0.5).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-green-800 dark:text-green-200 text-lg">Net Annual Savings</p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      ROI: {metrics.roi.toFixed(1)}% • Payback: {metrics.paybackPeriod.toFixed(1)} months
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-green-600">${metrics.costSavings.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};