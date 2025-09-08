import { EDITransaction, EDISegment } from './universalEDIParser';

export interface MemberRecord {
  id: string;
  memberId: string;
  firstName: string;
  lastName: string;
  ssn?: string;
  dateOfBirth: string;
  gender: string;
  payerId: string;
  employerGroup?: string;
  currentStatus: MemberStatus;
  lifecycle: LifecycleEvent[];
  healthCoverage: CoverageRecord[];
  lastUpdated: Date;
  alerts: MemberAlert[];
}

export interface LifecycleEvent {
  id: string;
  eventType: 'enrollment' | 'change' | 'termination' | 'reinstatement' | 'cobra_election' | 'address_change' | 'dependent_add' | 'dependent_remove';
  eventDate: Date;
  effectiveDate: Date;
  maintenanceType: string;
  maintenanceReason: string;
  sourceTransaction: string;
  details: any;
  processed: boolean;
  errors?: string[];
}

export interface CoverageRecord {
  id: string;
  insuranceLineCode: string;
  planCode: string;
  coverageLevel: string;
  effectiveDate: Date;
  terminationDate?: Date;
  premiumAmount?: number;
  status: 'active' | 'terminated' | 'suspended';
  beneficiaryCount: number;
}

export interface MemberAlert {
  id: string;
  type: 'duplicate_enrollment' | 'missing_termination' | 'gap_in_coverage' | 'premium_mismatch' | 'data_inconsistency' | 'compliance_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: any;
  dateCreated: Date;
  resolved: boolean;
  resolvedDate?: Date;
}

export type MemberStatus = 'active' | 'terminated' | 'cobra' | 'pending' | 'suspended';

export class MemberLifecycleTracker {
  private members: Map<string, MemberRecord> = new Map();
  private duplicateThreshold = 0.85; // Similarity threshold for duplicate detection

  // Process 834 transaction and update member records
  process834Transaction(transaction: EDITransaction): ProcessingResult {
    if (transaction.type !== '834') {
      throw new Error('Invalid transaction type. Expected 834.');
    }

    const result: ProcessingResult = {
      processed: 0,
      errors: 0,
      warnings: 0,
      alerts: [],
      affectedMembers: []
    };

    let currentMember: Partial<MemberRecord> | null = null;
    let insSegment: EDISegment | null = null;

    for (const segment of transaction.segments) {
      try {
        switch (segment.tag) {
          case 'INS':
            // Start new member record
            if (currentMember && insSegment) {
              this.processMemberRecord(currentMember, insSegment, transaction, result);
            }
            currentMember = { lifecycle: [], healthCoverage: [], alerts: [] };
            insSegment = segment;
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
              currentMember.dateOfBirth = this.formatDate(segment.elements[2] || '');
              currentMember.gender = segment.elements[3] || '';
            }
            break;

          case 'HD':
            if (currentMember) {
              const coverage: CoverageRecord = {
                id: this.generateId(),
                insuranceLineCode: segment.elements[3] || '',
                planCode: segment.elements[4] || '',
                coverageLevel: segment.elements[5] || '',
                effectiveDate: new Date(),
                status: 'active',
                beneficiaryCount: 1
              };
              currentMember.healthCoverage = currentMember.healthCoverage || [];
              currentMember.healthCoverage.push(coverage);
            }
            break;

          case 'REF':
            if (currentMember && segment.elements[1] === '0F') {
              currentMember.ssn = segment.elements[2];
            }
            break;
        }
      } catch (error) {
        result.errors++;
        result.alerts.push({
          type: 'processing_error',
          severity: 'high',
          message: `Error processing segment ${segment.tag} at line ${segment.lineNumber}`,
          memberId: currentMember?.memberId || 'unknown'
        });
      }
    }

    // Process the last member
    if (currentMember && insSegment) {
      this.processMemberRecord(currentMember, insSegment, transaction, result);
    }

    return result;
  }

  private processMemberRecord(
    memberData: Partial<MemberRecord>,
    insSegment: EDISegment,
    transaction: EDITransaction,
    result: ProcessingResult
  ): void {
    const memberId = memberData.memberId || this.generateId();
    const maintenanceType = insSegment.elements[3] || '';
    const maintenanceReason = insSegment.elements[4] || '';

    // Create lifecycle event
    const lifecycleEvent: LifecycleEvent = {
      id: this.generateId(),
      eventType: this.determineEventType(maintenanceType, maintenanceReason),
      eventDate: new Date(),
      effectiveDate: this.extractEffectiveDate(transaction.segments) || new Date(),
      maintenanceType,
      maintenanceReason,
      sourceTransaction: transaction.metadata.controlNumber,
      details: { insSegment: insSegment.raw },
      processed: true
    };

    // Check for existing member
    const existingMember = this.findMember(memberId, memberData);
    
    if (existingMember) {
      // Update existing member
      this.updateExistingMember(existingMember, memberData, lifecycleEvent, result);
    } else {
      // Create new member
      const newMember: MemberRecord = {
        id: this.generateId(),
        memberId,
        firstName: memberData.firstName || '',
        lastName: memberData.lastName || '',
        ssn: memberData.ssn,
        dateOfBirth: memberData.dateOfBirth || '',
        gender: memberData.gender || '',
        payerId: transaction.payer?.id || 'unknown',
        currentStatus: this.determineStatus(lifecycleEvent.eventType),
        lifecycle: [lifecycleEvent],
        healthCoverage: memberData.healthCoverage || [],
        lastUpdated: new Date(),
        alerts: []
      };

      this.members.set(newMember.id, newMember);
      result.processed++;
      result.affectedMembers.push(newMember.id);
    }

    // Run quality checks
    this.runQualityChecks(memberId, result);
  }

  private updateExistingMember(
    existingMember: MemberRecord,
    newData: Partial<MemberRecord>,
    lifecycleEvent: LifecycleEvent,
    result: ProcessingResult
  ): void {
    // Add lifecycle event
    existingMember.lifecycle.push(lifecycleEvent);
    existingMember.lastUpdated = new Date();

    // Update status based on event
    existingMember.currentStatus = this.determineStatus(lifecycleEvent.eventType);

    // Update coverage if provided
    if (newData.healthCoverage && newData.healthCoverage.length > 0) {
      existingMember.healthCoverage.push(...newData.healthCoverage);
    }

    // Check for data consistency
    this.validateDataConsistency(existingMember, newData, result);

    result.processed++;
    result.affectedMembers.push(existingMember.id);
  }

  private findMember(memberId: string, memberData: Partial<MemberRecord>): MemberRecord | null {
    // First try exact member ID match
    for (const member of this.members.values()) {
      if (member.memberId === memberId) {
        return member;
      }
    }

    // Then try fuzzy matching on name + DOB
    if (memberData.firstName && memberData.lastName && memberData.dateOfBirth) {
      for (const member of this.members.values()) {
        if (
          this.similarity(member.firstName, memberData.firstName) > this.duplicateThreshold &&
          this.similarity(member.lastName, memberData.lastName) > this.duplicateThreshold &&
          member.dateOfBirth === memberData.dateOfBirth
        ) {
          return member;
        }
      }
    }

    return null;
  }

  private determineEventType(maintenanceType: string, maintenanceReason: string): LifecycleEvent['eventType'] {
    switch (maintenanceType) {
      case '021': return 'enrollment';
      case '001': return 'change';
      case '024': return 'termination';
      case '025': return 'reinstatement';
      case '030':
        switch (maintenanceReason) {
          case 'AI': return 'enrollment';
          case 'XN': return 'termination';
          case 'EC': return 'cobra_election';
          default: return 'change';
        }
      default: return 'change';
    }
  }

  private determineStatus(eventType: LifecycleEvent['eventType']): MemberStatus {
    switch (eventType) {
      case 'enrollment': return 'active';
      case 'termination': return 'terminated';
      case 'cobra_election': return 'cobra';
      case 'reinstatement': return 'active';
      default: return 'active';
    }
  }

  private extractEffectiveDate(segments: EDISegment[]): Date | null {
    const dtpSegment = segments.find(s => s.tag === 'DTP' && s.elements[1] === '348');
    if (dtpSegment && dtpSegment.elements[3]) {
      return this.parseDate(dtpSegment.elements[3]);
    }
    return null;
  }

  private runQualityChecks(memberId: string, result: ProcessingResult): void {
    const member = Array.from(this.members.values()).find(m => m.memberId === memberId);
    if (!member) return;

    // Check for duplicate enrollments
    const activeEnrollments = member.lifecycle.filter(
      e => e.eventType === 'enrollment' && 
      e.eventDate > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
    );

    if (activeEnrollments.length > 1) {
      const alert: MemberAlert = {
        id: this.generateId(),
        type: 'duplicate_enrollment',
        severity: 'high',
        message: 'Multiple enrollments detected within 30 days',
        details: { enrollmentCount: activeEnrollments.length },
        dateCreated: new Date(),
        resolved: false
      };
      member.alerts.push(alert);
      result.alerts.push({
        type: 'duplicate_enrollment',
        severity: 'high',
        message: alert.message,
        memberId: member.memberId
      });
    }

    // Check for coverage gaps
    this.checkCoverageGaps(member, result);

    // Check for missing terminations
    this.checkMissingTerminations(member, result);
  }

  private checkCoverageGaps(member: MemberRecord, result: ProcessingResult): void {
    const sortedEvents = member.lifecycle
      .filter(e => ['enrollment', 'termination'].includes(e.eventType))
      .sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime());

    for (let i = 1; i < sortedEvents.length; i++) {
      const prevEvent = sortedEvents[i - 1];
      const currentEvent = sortedEvents[i];

      if (prevEvent.eventType === 'termination' && currentEvent.eventType === 'enrollment') {
        const gapDays = Math.floor(
          (currentEvent.effectiveDate.getTime() - prevEvent.effectiveDate.getTime()) / 
          (1000 * 60 * 60 * 24)
        );

        if (gapDays > 1) {
          const alert: MemberAlert = {
            id: this.generateId(),
            type: 'gap_in_coverage',
            severity: gapDays > 31 ? 'high' : 'medium',
            message: `Coverage gap of ${gapDays} days detected`,
            details: { gapDays, fromDate: prevEvent.effectiveDate, toDate: currentEvent.effectiveDate },
            dateCreated: new Date(),
            resolved: false
          };
          member.alerts.push(alert);
        }
      }
    }
  }

  private checkMissingTerminations(member: MemberRecord, result: ProcessingResult): void {
    const hasActiveEnrollment = member.lifecycle.some(e => e.eventType === 'enrollment');
    const hasTermination = member.lifecycle.some(e => e.eventType === 'termination');

    if (hasActiveEnrollment && !hasTermination && member.currentStatus === 'active') {
      const lastEnrollment = member.lifecycle
        .filter(e => e.eventType === 'enrollment')
        .sort((a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime())[0];

      const daysSinceEnrollment = Math.floor(
        (Date.now() - lastEnrollment.effectiveDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceEnrollment > 365) {
        const alert: MemberAlert = {
          id: this.generateId(),
          type: 'missing_termination',
          severity: 'medium',
          message: `Active enrollment without termination for ${daysSinceEnrollment} days`,
          details: { daysSinceEnrollment, enrollmentDate: lastEnrollment.effectiveDate },
          dateCreated: new Date(),
          resolved: false
        };
        member.alerts.push(alert);
      }
    }
  }

  private validateDataConsistency(
    existingMember: MemberRecord,
    newData: Partial<MemberRecord>,
    result: ProcessingResult
  ): void {
    const inconsistencies: string[] = [];

    if (newData.firstName && newData.firstName !== existingMember.firstName) {
      inconsistencies.push(`First name changed from "${existingMember.firstName}" to "${newData.firstName}"`);
    }

    if (newData.lastName && newData.lastName !== existingMember.lastName) {
      inconsistencies.push(`Last name changed from "${existingMember.lastName}" to "${newData.lastName}"`);
    }

    if (newData.dateOfBirth && newData.dateOfBirth !== existingMember.dateOfBirth) {
      inconsistencies.push(`Date of birth changed from "${existingMember.dateOfBirth}" to "${newData.dateOfBirth}"`);
    }

    if (inconsistencies.length > 0) {
      const alert: MemberAlert = {
        id: this.generateId(),
        type: 'data_inconsistency',
        severity: 'medium',
        message: 'Data inconsistencies detected',
        details: { inconsistencies },
        dateCreated: new Date(),
        resolved: false
      };
      existingMember.alerts.push(alert);
      result.warnings++;
    }
  }

  // Utility methods
  private similarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private formatDate(dateStr: string): string {
    if (dateStr.length === 8) {
      return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
    }
    return dateStr;
  }

  private parseDate(dateStr: string): Date {
    if (dateStr.length === 8) {
      const year = parseInt(dateStr.substring(0, 4));
      const month = parseInt(dateStr.substring(4, 6)) - 1;
      const day = parseInt(dateStr.substring(6, 8));
      return new Date(year, month, day);
    }
    return new Date(dateStr);
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Public API methods
  getMember(memberId: string): MemberRecord | null {
    for (const member of this.members.values()) {
      if (member.memberId === memberId) {
        return member;
      }
    }
    return null;
  }

  getAllMembers(): MemberRecord[] {
    return Array.from(this.members.values());
  }

  getMembersByPayer(payerId: string): MemberRecord[] {
    return Array.from(this.members.values()).filter(m => m.payerId === payerId);
  }

  getActiveMembers(): MemberRecord[] {
    return Array.from(this.members.values()).filter(m => m.currentStatus === 'active');
  }

  getMembersWithAlerts(): MemberRecord[] {
    return Array.from(this.members.values()).filter(m => m.alerts.some(a => !a.resolved));
  }

  getLifecycleStats(): LifecycleStats {
    const allMembers = this.getAllMembers();
    const totalEnrollments = allMembers.reduce((sum, m) => 
      sum + m.lifecycle.filter(e => e.eventType === 'enrollment').length, 0);
    const totalTerminations = allMembers.reduce((sum, m) => 
      sum + m.lifecycle.filter(e => e.eventType === 'termination').length, 0);
    const totalChanges = allMembers.reduce((sum, m) => 
      sum + m.lifecycle.filter(e => e.eventType === 'change').length, 0);

    return {
      totalMembers: allMembers.length,
      activeMembers: this.getActiveMembers().length,
      totalEnrollments,
      totalTerminations,
      totalChanges,
      membersWithAlerts: this.getMembersWithAlerts().length,
      alertsByType: this.getAlertsByType()
    };
  }

  private getAlertsByType(): Record<string, number> {
    const alertCounts: Record<string, number> = {};
    
    for (const member of this.members.values()) {
      for (const alert of member.alerts) {
        if (!alert.resolved) {
          alertCounts[alert.type] = (alertCounts[alert.type] || 0) + 1;
        }
      }
    }
    
    return alertCounts;
  }
}

export interface ProcessingResult {
  processed: number;
  errors: number;
  warnings: number;
  alerts: Array<{
    type: string;
    severity: string;
    message: string;
    memberId: string;
  }>;
  affectedMembers: string[];
}

export interface LifecycleStats {
  totalMembers: number;
  activeMembers: number;
  totalEnrollments: number;
  totalTerminations: number;
  totalChanges: number;
  membersWithAlerts: number;
  alertsByType: Record<string, number>;
}