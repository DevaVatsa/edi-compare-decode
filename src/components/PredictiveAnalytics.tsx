import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  Target, 
  AlertTriangle,
  Calendar,
  Users,
  DollarSign,
  Activity,
  BarChart3
} from "lucide-react";
import { EDIFile } from "@/pages/Index";

interface PredictiveAnalyticsProps {
  files: EDIFile[];
}

export const PredictiveAnalytics = ({ files }: PredictiveAnalyticsProps) => {
  const [selectedModel, setSelectedModel] = useState("enrollment");

  const enrollmentPredictions = [
    { month: "Nov 2024", predicted: 2340, confidence: 92, trend: "up" },
    { month: "Dec 2024", predicted: 2180, confidence: 89, trend: "down" },
    { month: "Jan 2025", predicted: 2890, confidence: 87, trend: "up" },
    { month: "Feb 2025", predicted: 2650, confidence: 85, trend: "down" },
    { month: "Mar 2025", predicted: 3120, confidence: 83, trend: "up" },
  ];

  const riskFactors = [
    { factor: "High Premium Plans", impact: "85%", trend: "increasing", risk: "high" },
    { factor: "Seasonal Enrollment", impact: "72%", trend: "stable", risk: "medium" },
    { factor: "Economic Indicators", impact: "68%", trend: "decreasing", risk: "medium" },
    { factor: "Policy Changes", impact: "45%", trend: "increasing", risk: "low" },
  ];

  const mlModels = [
    {
      name: "Enrollment Forecasting",
      accuracy: 92,
      lastTrained: "2024-10-15",
      status: "active",
      predictions: "3-month rolling forecast",
      dataPoints: "15,000+ historical records"
    },
    {
      name: "Cost Prediction",
      accuracy: 88,
      lastTrained: "2024-10-12",
      status: "active",
      predictions: "Premium impact analysis",
      dataPoints: "12,000+ cost records"
    },
    {
      name: "Risk Assessment",
      accuracy: 85,
      lastTrained: "2024-10-10",
      status: "training",
      predictions: "Member risk scoring",
      dataPoints: "8,500+ risk profiles"
    }
  ];

  const getTrendIcon = (trend: string) => {
    return trend === "up" ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> : 
      <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high": return "destructive";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "outline";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Predictive Analytics</h1>
          <p className="text-muted-foreground">AI-powered forecasting and risk analysis</p>
        </div>
        <Button>
          <Brain className="h-4 w-4 mr-2" />
          Train Models
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Model Accuracy</p>
                <p className="text-2xl font-bold text-foreground">92%</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Predictions Made</p>
                <p className="text-2xl font-bold text-foreground">1,247</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cost Savings</p>
                <p className="text-2xl font-bold text-foreground">$125K</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Models</p>
                <p className="text-2xl font-bold text-foreground">3</p>
              </div>
              <Brain className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="forecasting" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="forecasting">Enrollment Forecasting</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
          <TabsTrigger value="models">ML Models</TabsTrigger>
        </TabsList>

        <TabsContent value="forecasting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                3-Month Enrollment Forecast
              </CardTitle>
              <CardDescription>
                AI-powered enrollment predictions with confidence intervals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {enrollmentPredictions.map((prediction, index) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{prediction.month}</span>
                        {getTrendIcon(prediction.trend)}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {prediction.confidence}% confidence
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-foreground">
                          {prediction.predicted.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">Predicted enrollments</p>
                      </div>
                      <Progress value={prediction.confidence} className="w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Seasonal Trends</CardTitle>
                <CardDescription>Historical enrollment patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Open Enrollment (Nov-Dec)</span>
                    <span className="text-sm font-medium text-green-600">+45%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">New Year (Jan-Feb)</span>
                    <span className="text-sm font-medium text-blue-600">+22%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Summer (Jun-Aug)</span>
                    <span className="text-sm font-medium text-red-600">-15%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Economic Impact</CardTitle>
                <CardDescription>External factors influence</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Unemployment Rate</span>
                    <span className="text-sm font-medium">-35% correlation</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Healthcare Costs</span>
                    <span className="text-sm font-medium">+28% correlation</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Policy Changes</span>
                    <span className="text-sm font-medium">+15% correlation</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Risk Factor Analysis
              </CardTitle>
              <CardDescription>
                Identify and assess enrollment risk factors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {riskFactors.map((factor, index) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-foreground">{factor.factor}</h3>
                      <Badge variant={getRiskColor(factor.risk)}>
                        {factor.risk} risk
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Impact Level</p>
                        <p className="text-lg font-bold text-foreground">{factor.impact}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Trend</p>
                        <p className="text-sm font-medium capitalize">{factor.trend}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk Mitigation Recommendations</CardTitle>
              <CardDescription>AI-generated action items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Monitor High Premium Plans</p>
                    <p className="text-sm text-muted-foreground">
                      85% correlation with enrollment drops. Consider incentive programs.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Seasonal Preparation</p>
                    <p className="text-sm text-muted-foreground">
                      Increase capacity by 30% during November-December peak periods.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Machine Learning Models
              </CardTitle>
              <CardDescription>
                Model performance and training status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mlModels.map((model, index) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-foreground">{model.name}</h3>
                      <Badge variant={model.status === "active" ? "outline" : "secondary"}>
                        {model.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Accuracy</p>
                        <div className="flex items-center gap-2">
                          <Progress value={model.accuracy} className="flex-1" />
                          <span className="text-sm font-medium">{model.accuracy}%</span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Last Trained</p>
                        <p className="text-sm font-medium">{model.lastTrained}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Data Points</p>
                        <p className="text-sm font-medium">{model.dataPoints}</p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mt-3">{model.predictions}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};