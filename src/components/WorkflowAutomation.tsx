import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight, 
  Play, 
  Pause,
  Settings,
  Users,
  DollarSign,
  Shield
} from "lucide-react";
import { EDIFile } from "@/pages/Index";

interface WorkflowAutomationProps {
  files: EDIFile[];
}

export const WorkflowAutomation = ({ files }: WorkflowAutomationProps) => {
  const [activeWorkflows, setActiveWorkflows] = useState(3);
  const [completedToday, setCompletedToday] = useState(47);
  
  const workflows = [
    {
      id: 1,
      name: "834 Enrollment Processing",
      status: "active",
      priority: "high",
      filesProcessed: 23,
      totalFiles: 30,
      estimatedCompletion: "2:30 PM",
      assignedTo: "HR Department",
      stage: "validation",
      rules: ["Auto-approve standard enrollments", "Flag high-value plans", "Escalate errors"],
      savings: "$2,400/day"
    },
    {
      id: 2,
      name: "820 Payment Reconciliation",
      status: "running",
      priority: "medium",
      filesProcessed: 18,
      totalFiles: 25,
      estimatedCompletion: "3:15 PM",
      assignedTo: "Finance Team",
      stage: "reconciliation",
      rules: ["Match payment amounts", "Verify member eligibility", "Generate discrepancy reports"],
      savings: "$1,800/day"
    },
    {
      id: 3,
      name: "Compliance Audit Trail",
      status: "scheduled",
      priority: "low",
      filesProcessed: 0,
      totalFiles: 12,
      estimatedCompletion: "5:00 PM",
      assignedTo: "Compliance Officer",
      stage: "queued",
      rules: ["HIPAA validation", "State regulation checks", "Audit documentation"],
      savings: "$900/day"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <Play className="h-4 w-4 text-green-500" />;
      case "running": return <Clock className="h-4 w-4 text-blue-500" />;
      case "scheduled": return <Pause className="h-4 w-4 text-yellow-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "running": return "bg-blue-500";
      case "scheduled": return "bg-yellow-500";
      default: return "bg-red-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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
          <h1 className="text-3xl font-bold text-foreground">Workflow Automation</h1>
          <p className="text-muted-foreground">Intelligent routing and approval workflows</p>
        </div>
        <Button>
          <Settings className="h-4 w-4 mr-2" />
          Configure Workflows
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Workflows</p>
                <p className="text-2xl font-bold text-foreground">{activeWorkflows}</p>
              </div>
              <Play className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed Today</p>
                <p className="text-2xl font-bold text-foreground">{completedToday}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Auto-Approval Rate</p>
                <p className="text-2xl font-bold text-foreground">87%</p>
              </div>
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Daily Savings</p>
                <p className="text-2xl font-bold text-foreground">$5,100</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Workflows */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Active Workflows
          </CardTitle>
          <CardDescription>
            Monitor and manage automated processing workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {workflows.map((workflow) => (
              <div key={workflow.id} className="border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(workflow.status)}
                    <div>
                      <h3 className="font-semibold text-foreground">{workflow.name}</h3>
                      <p className="text-sm text-muted-foreground">Assigned to {workflow.assignedTo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getPriorityColor(workflow.priority)}>
                      {workflow.priority} priority
                    </Badge>
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(workflow.status)}`} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Progress</p>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(workflow.filesProcessed / workflow.totalFiles) * 100} 
                        className="flex-1"
                      />
                      <span className="text-sm font-medium">
                        {workflow.filesProcessed}/{workflow.totalFiles}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Current Stage</p>
                    <Badge variant="outline" className="capitalize">
                      {workflow.stage}
                    </Badge>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">ETA</p>
                    <p className="text-sm font-medium">{workflow.estimatedCompletion}</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Automation Rules</p>
                    <ul className="space-y-1">
                      {workflow.rules.map((rule, index) => (
                        <li key={index} className="text-xs text-foreground flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Daily Savings</p>
                      <p className="text-lg font-bold text-green-600">{workflow.savings}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Pause className="h-3 w-3 mr-1" />
                        Pause
                      </Button>
                      <Button size="sm">
                        <Settings className="h-3 w-3 mr-1" />
                        Configure
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Approval Workflow</CardTitle>
            <CardDescription>Automated decision making</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Auto-Approved</span>
                <span className="text-sm font-medium">87%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Requires Review</span>
                <span className="text-sm font-medium">10%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Escalated</span>
                <span className="text-sm font-medium">3%</span>
              </div>
              <Separator />
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">50%</p>
                <p className="text-sm text-muted-foreground">Faster Processing</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Smart Routing</CardTitle>
            <CardDescription>Intelligent file distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">834 → HR Department</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">820 → Finance Team</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Errors → Compliance</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <Separator />
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">100%</p>
                <p className="text-sm text-muted-foreground">Routing Accuracy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};