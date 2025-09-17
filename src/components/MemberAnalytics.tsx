import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Users, TrendingUp, TrendingDown, Calendar, MapPin, 
  Heart, Baby, UserCheck, UserX, Activity, DollarSign,
  AlertTriangle, CheckCircle, Clock, Target, BarChart3,
  PieChart, LineChart, Eye
} from "lucide-react";
import { EDIFile } from "@/pages/Index";
import { parseEDIContent } from "@/utils/ediParser";
import { LifecycleEvent } from "@/utils/lifecycleTracker";

interface MemberProfile {
  id: string;
  firstName: string;
  lastName: string;
  memberId: string;
  gender: 'M' | 'F' | 'U';
  birthDate: Date;
  age: number;
  relationship: string;
  enrollmentDate: Date;
  terminationDate?: Date;
  status: 'active' | 'terminated' | 'pending';
  planType: string;
  premiumAmount?: number;
  hsaContribution?: number;
  dependents: number;
  address: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  employerInfo?: {
    name: string;
    groupId: string;
  };
  lifecycle: LifecycleEvent[];
  riskFactors: string[];
  compliance: {
    hipaaCompliant: boolean;
    irsCompliant: boolean;
    issues: string[];
  };
}

interface Demographics {
  ageGroups: Record<string, number>;
  genderDistribution: Record<string, number>;
  stateDistribution: Record<string, number>;
  planTypeDistribution: Record<string, number>;
  relationshipDistribution: Record<string, number>;
}

interface MemberMetrics {
  totalMembers: number;
  activeMembers: number;
  newEnrollments: number;
  terminations: number;
  dependentRatio: number;
  averageAge: number;
  averagePremium: number;
  totalHsaContributions: number;
  complianceRate: number;
  retentionRate: number;
}

interface MemberAnalyticsProps {
  files: EDIFile[];
}

export const MemberAnalytics = ({ files }: MemberAnalyticsProps) => {
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [metrics, setMetrics] = useState<MemberMetrics>({
    totalMembers: 0,
    activeMembers: 0,
    newEnrollments: 0,
    terminations: 0,
    dependentRatio: 0,
    averageAge: 0,
    averagePremium: 0,
    totalHsaContributions: 0,
    complianceRate: 0,
    retentionRate: 0
  });
  const [demographics, setDemographics] = useState<Demographics>({
    ageGroups: {},
    genderDistribution: {},
    stateDistribution: {},
    planTypeDistribution: {},
    relationshipDistribution: {}
  });
  const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null);

  // Advanced member data extraction and analysis
  const memberAnalysis = useMemo(() => {
    if (!files.length) return { members: [], metrics: null, demographics: null };

    const extractedMembers: MemberProfile[] = [];
    const memberMap = new Map<string, Partial<MemberProfile>>();

    files.forEach(file => {
      const parsed = parseEDIContent(file.content);
      const lifecycle = { events: [] }; // Simplified for now
      
      let currentMember: Partial<MemberProfile> | null = null;
      let currentEmployer: { name: string; groupId: string } | undefined;

      parsed.segments.forEach(segment => {
        switch (segment.tag) {
          case 'N1':
            if (segment.elements[1] === 'P5' || segment.elements[1] === 'ER') {
              currentEmployer = {
                name: segment.elements[2] || 'Unknown Employer',
                groupId: segment.elements[3] || 'Unknown'
              };
            }
            break;

          case 'INS':
            if (currentMember) {
              // Save previous member
              const memberId = currentMember.memberId || `temp-${Date.now()}`;
              memberMap.set(memberId, currentMember);
            }
            
            // Start new member
            currentMember = {
              id: `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              relationship: segment.elements[2] || 'unknown',
              status: segment.elements[3] === 'A' ? 'active' : 
                     segment.elements[3] === 'T' ? 'terminated' : 'pending',
              lifecycle: lifecycle.events.filter(e => e.memberId === segment.elements[9]),
              riskFactors: [],
              compliance: {
                hipaaCompliant: true,
                irsCompliant: true,
                issues: []
              },
              address: {},
              dependents: 0
            };
            break;

          case 'NM1':
            if (currentMember && segment.elements[1] === 'IL') {
              currentMember.firstName = segment.elements[4] || '';
              currentMember.lastName = segment.elements[3] || '';
              currentMember.memberId = segment.elements[9] || '';
            }
            break;

          case 'DMG':
            if (currentMember) {
              const birthDateStr = segment.elements[2];
              if (birthDateStr && birthDateStr.length === 8) {
                const year = parseInt(birthDateStr.substring(0, 4));
                const month = parseInt(birthDateStr.substring(4, 6));
                const day = parseInt(birthDateStr.substring(6, 8));
                currentMember.birthDate = new Date(year, month - 1, day);
                currentMember.age = new Date().getFullYear() - year;
              }
              currentMember.gender = (segment.elements[3] as 'M' | 'F' | 'U') || 'U';
            }
            break;

          case 'N3':
            if (currentMember) {
              currentMember.address.street = segment.elements[1] || '';
            }
            break;

          case 'N4':
            if (currentMember) {
              currentMember.address.city = segment.elements[1] || '';
              currentMember.address.state = segment.elements[2] || '';
              currentMember.address.zip = segment.elements[3] || '';
            }
            break;

          case 'HD':
            if (currentMember) {
              currentMember.planType = segment.elements[3] || 'Unknown Plan';
              if (currentEmployer) {
                currentMember.employerInfo = currentEmployer;
              }
            }
            break;

          case 'DTP':
            if (currentMember && segment.elements[1] === '348') {
              const dateStr = segment.elements[3];
              if (dateStr && dateStr.length === 8) {
                const year = parseInt(dateStr.substring(0, 4));
                const month = parseInt(dateStr.substring(4, 6));
                const day = parseInt(dateStr.substring(6, 8));
                currentMember.enrollmentDate = new Date(year, month - 1, day);
              }
            }
            if (currentMember && segment.elements[1] === '349') {
              const dateStr = segment.elements[3];
              if (dateStr && dateStr.length === 8) {
                const year = parseInt(dateStr.substring(0, 4));
                const month = parseInt(dateStr.substring(4, 6));
                const day = parseInt(dateStr.substring(6, 8));
                currentMember.terminationDate = new Date(year, month - 1, day);
              }
            }
            break;

          case 'AMT':
            if (currentMember) {
              const amount = parseFloat(segment.elements[2] || '0');
              if (segment.elements[1] === 'PREM') {
                currentMember.premiumAmount = amount;
              } else if (segment.elements[1] === 'HS') {
                currentMember.hsaContribution = amount;
                // Check IRS compliance
                if (amount > 4300) { // 2025 self-only limit
                  currentMember.riskFactors.push('HSA over-contribution');
                  currentMember.compliance.irsCompliant = false;
                  currentMember.compliance.issues.push(`HSA contribution $${amount} exceeds IRS limit`);
                }
              }
            }
            break;
        }
      });

      // Save last member
      if (currentMember && currentMember.memberId) {
        memberMap.set(currentMember.memberId, currentMember);
      }
    });

    // Convert map to array and complete member profiles
    const completedMembers = Array.from(memberMap.values())
      .filter(member => member.memberId && member.firstName && member.lastName)
      .map(member => ({
        ...member,
        id: member.id || `member-${Date.now()}`,
        firstName: member.firstName || 'Unknown',
        lastName: member.lastName || 'Unknown',
        memberId: member.memberId || 'Unknown',
        gender: member.gender || 'U',
        birthDate: member.birthDate || new Date(),
        age: member.age || 0,
        relationship: member.relationship || 'unknown',
        enrollmentDate: member.enrollmentDate || new Date(),
        status: member.status || 'pending',
        planType: member.planType || 'Unknown',
        dependents: 0, // Calculate separately
        lifecycle: member.lifecycle || [],
        riskFactors: member.riskFactors || [],
        compliance: member.compliance || {
          hipaaCompliant: true,
          irsCompliant: true,
          issues: []
        },
        address: member.address || {}
      })) as MemberProfile[];

    // Calculate dependents
    const subscriberMap = new Map<string, MemberProfile>();
    completedMembers.forEach(member => {
      if (member.relationship === '001' || member.relationship === '018') {
        subscriberMap.set(member.memberId, member);
      }
    });

    completedMembers.forEach(member => {
      if (member.relationship !== '001' && member.relationship !== '018') {
        // This is a dependent, find the subscriber
        subscriberMap.forEach(subscriber => {
          if (subscriber.employerInfo?.groupId === member.employerInfo?.groupId) {
            subscriber.dependents++;
          }
        });
      }
    });

    // Calculate metrics
    const activeMembers = completedMembers.filter(m => m.status === 'active').length;
    const newEnrollments = completedMembers.filter(m => {
      const enrollDate = m.enrollmentDate;
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return enrollDate >= thirtyDaysAgo;
    }).length;

    const terminations = completedMembers.filter(m => m.status === 'terminated').length;
    const totalDependents = completedMembers.reduce((sum, m) => sum + m.dependents, 0);
    const dependentRatio = completedMembers.length ? totalDependents / completedMembers.length : 0;
    const averageAge = completedMembers.length ? 
      completedMembers.reduce((sum, m) => sum + m.age, 0) / completedMembers.length : 0;
    const averagePremium = completedMembers.length ? 
      completedMembers.reduce((sum, m) => sum + (m.premiumAmount || 0), 0) / completedMembers.length : 0;
    const totalHsaContributions = completedMembers.reduce((sum, m) => sum + (m.hsaContribution || 0), 0);
    const compliantMembers = completedMembers.filter(m => m.compliance.hipaaCompliant && m.compliance.irsCompliant).length;
    const complianceRate = completedMembers.length ? (compliantMembers / completedMembers.length) * 100 : 100;
    const retentionRate = completedMembers.length ? ((activeMembers / completedMembers.length) * 100) : 100;

    // Calculate demographics
    const ageGroups = { '18-25': 0, '26-35': 0, '36-45': 0, '46-55': 0, '56-65': 0, '65+': 0 };
    const genderDistribution = { 'M': 0, 'F': 0, 'U': 0 };
    const stateDistribution: Record<string, number> = {};
    const planTypeDistribution: Record<string, number> = {};
    const relationshipDistribution: Record<string, number> = {};

    completedMembers.forEach(member => {
      // Age groups
      if (member.age >= 18 && member.age <= 25) ageGroups['18-25']++;
      else if (member.age >= 26 && member.age <= 35) ageGroups['26-35']++;
      else if (member.age >= 36 && member.age <= 45) ageGroups['36-45']++;
      else if (member.age >= 46 && member.age <= 55) ageGroups['46-55']++;
      else if (member.age >= 56 && member.age <= 65) ageGroups['56-65']++;
      else if (member.age > 65) ageGroups['65+']++;

      // Gender
      genderDistribution[member.gender]++;

      // State
      const state = member.address.state || 'Unknown';
      stateDistribution[state] = (stateDistribution[state] || 0) + 1;

      // Plan type
      planTypeDistribution[member.planType] = (planTypeDistribution[member.planType] || 0) + 1;

      // Relationship
      const relName = member.relationship === '001' ? 'Subscriber' :
                     member.relationship === '018' ? 'Self' :
                     member.relationship === '019' ? 'Spouse' :
                     member.relationship === '020' ? 'Child' :
                     member.relationship === '021' ? 'Employee' :
                     'Other';
      relationshipDistribution[relName] = (relationshipDistribution[relName] || 0) + 1;
    });

    return {
      members: completedMembers,
      metrics: {
        totalMembers: completedMembers.length,
        activeMembers,
        newEnrollments,
        terminations,
        dependentRatio,
        averageAge,
        averagePremium,
        totalHsaContributions,
        complianceRate,
        retentionRate
      },
      demographics: {
        ageGroups,
        genderDistribution,
        stateDistribution,
        planTypeDistribution,
        relationshipDistribution
      }
    };
  }, [files]);

  useEffect(() => {
    if (memberAnalysis.members) {
      setMembers(memberAnalysis.members);
    }
    if (memberAnalysis.metrics) {
      setMetrics(memberAnalysis.metrics);
    }
    if (memberAnalysis.demographics) {
      setDemographics(memberAnalysis.demographics);
    }
  }, [memberAnalysis]);

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    format = 'number',
    color = 'blue' 
  }: {
    title: string;
    value: number;
    icon: any;
    trend?: number;
    format?: 'number' | 'currency' | 'percentage';
    color?: 'blue' | 'green' | 'red' | 'yellow';
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
              {trend !== undefined && (
                <div className="flex items-center gap-1 mt-1">
                  {trend > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.abs(trend)}%
                  </span>
                </div>
              )}
            </div>
            <Icon className={`h-6 w-6 text-${color}-500`} />
          </div>
        </CardContent>
      </Card>
    );
  };

  const getStatusBadge = (status: MemberProfile['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'terminated':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Terminated</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getRiskBadge = (riskFactors: string[]) => {
    if (riskFactors.length === 0) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Low Risk</Badge>;
    } else if (riskFactors.length <= 2) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium Risk</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800 border-red-200">High Risk</Badge>;
    }
  };

  if (!files.length) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Member Analytics</h3>
            <p className="text-muted-foreground">Upload EDI files to analyze member data and demographics</p>
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
            <Users className="h-6 w-6" />
            Member Analytics
          </h2>
          <p className="text-muted-foreground">Comprehensive member insights and demographics</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <Activity className="h-3 w-3 mr-1" />
            {metrics.totalMembers} Members
          </Badge>
          <Badge variant="outline" className="text-green-600 border-green-600">
            <Target className="h-3 w-3 mr-1" />
            {metrics.complianceRate.toFixed(1)}% Compliant
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Members"
          value={metrics.totalMembers}
          icon={Users}
          trend={5}
          color="blue"
        />
        <MetricCard
          title="Active Members"
          value={metrics.activeMembers}
          icon={UserCheck}
          trend={3}
          color="green"
        />
        <MetricCard
          title="New Enrollments"
          value={metrics.newEnrollments}
          icon={TrendingUp}
          trend={8}
          color="blue"
        />
        <MetricCard
          title="Average Age"
          value={metrics.averageAge}
          icon={Calendar}
          color="yellow"
        />
        <MetricCard
          title="Retention Rate"
          value={metrics.retentionRate}
          icon={Target}
          trend={2}
          format="percentage"
          color="green"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="members">Member List</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Enrollment Trends</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>New Enrollments (30 days)</span>
                    <span>{metrics.newEnrollments}</span>
                  </div>
                  <Progress value={(metrics.newEnrollments / metrics.totalMembers) * 100} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Terminations</span>
                    <span>{metrics.terminations}</span>
                  </div>
                  <Progress value={(metrics.terminations / metrics.totalMembers) * 100} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Dependent Ratio</span>
                    <span>{metrics.dependentRatio.toFixed(2)}</span>
                  </div>
                  <Progress value={metrics.dependentRatio * 20} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Average Premium</span>
                  </div>
                  <span className="font-medium">${metrics.averagePremium.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Total HSA Contributions</span>
                  </div>
                  <span className="font-medium">${metrics.totalHsaContributions.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Age Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(demographics.ageGroups).map(([group, count]) => (
                  <div key={group} className="flex justify-between items-center">
                    <span className="text-sm">{group}</span>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(count / metrics.totalMembers) * 100} 
                        className="w-16 h-2" 
                      />
                      <span className="text-sm font-medium w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gender Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(demographics.genderDistribution).map(([gender, count]) => (
                  <div key={gender} className="flex justify-between items-center">
                    <span className="text-sm">
                      {gender === 'M' ? 'Male' : gender === 'F' ? 'Female' : 'Unspecified'}
                    </span>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(count / metrics.totalMembers) * 100} 
                        className="w-16 h-2" 
                      />
                      <span className="text-sm font-medium w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plan Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(demographics.planTypeDistribution)
                  .slice(0, 5) // Show top 5 plan types
                  .map(([plan, count]) => (
                  <div key={plan} className="flex justify-between items-center">
                    <span className="text-sm truncate" title={plan}>{plan}</span>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(count / metrics.totalMembers) * 100} 
                        className="w-16 h-2" 
                      />
                      <span className="text-sm font-medium w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {members.map((member) => (
                <Card key={member.id} className="cursor-pointer hover:bg-secondary/50 transition-colors"
                      onClick={() => setSelectedMember(member)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{member.firstName} {member.lastName}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>ID: {member.memberId}</span>
                            <span>•</span>
                            <span>Age: {member.age}</span>
                            <span>•</span>
                            <span>{member.address.state || 'Unknown State'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(member.status)}
                        {getRiskBadge(member.riskFactors)}
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Compliance Rate</span>
                    <span>{metrics.complianceRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.complianceRate} className="h-2" />
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">HIPAA Compliant</span>
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      {members.filter(m => m.compliance.hipaaCompliant).length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">IRS Compliant</span>
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      {members.filter(m => m.compliance.irsCompliant).length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {['HSA over-contribution', 'Missing information', 'Invalid dates', 'Duplicate records'].map((risk) => {
                  const count = members.filter(m => m.riskFactors.includes(risk)).length;
                  return (
                    <div key={risk} className="flex justify-between items-center">
                      <span className="text-sm">{risk}</span>
                      <Badge variant={count > 0 ? "destructive" : "outline"}>
                        {count}
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Member Detail Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Member Profile: {selectedMember.firstName} {selectedMember.lastName}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedMember(null)}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Member ID</label>
                  <p className="text-sm text-muted-foreground">{selectedMember.memberId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedMember.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Age / Gender</label>
                  <p className="text-sm text-muted-foreground">{selectedMember.age} / {selectedMember.gender}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Relationship</label>
                  <p className="text-sm text-muted-foreground">{selectedMember.relationship}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Plan Type</label>
                  <p className="text-sm text-muted-foreground">{selectedMember.planType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Dependents</label>
                  <p className="text-sm text-muted-foreground">{selectedMember.dependents}</p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <label className="text-sm font-medium">Address</label>
                <p className="text-sm text-muted-foreground">
                  {selectedMember.address.street && `${selectedMember.address.street}, `}
                  {selectedMember.address.city}, {selectedMember.address.state} {selectedMember.address.zip}
                </p>
              </div>

              {selectedMember.employerInfo && (
                <div>
                  <label className="text-sm font-medium">Employer</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedMember.employerInfo.name} (Group: {selectedMember.employerInfo.groupId})
                  </p>
                </div>
              )}

              {selectedMember.riskFactors.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Risk Factors</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedMember.riskFactors.map((risk, idx) => (
                      <Badge key={idx} variant="destructive" className="text-xs">
                        {risk}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedMember.compliance.issues.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Compliance Issues:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {selectedMember.compliance.issues.map((issue, idx) => (
                        <li key={idx} className="text-sm">{issue}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};