import { X12_FORMATS, PAYER_DATABASE, SEGMENT_DEFINITIONS, type X12FormatType } from './x12Formats';

export interface EDISegment {
  tag: string;
  elements: string[];
  raw: string;
  lineNumber: number;
  definition?: string;
  isValid?: boolean;
  errors?: string[];
}

export interface EDITransaction {
  type: X12FormatType | 'unknown';
  segments: EDISegment[];
  metadata: {
    sender: string;
    receiver: string;
    date: string;
    controlNumber: string;
    version: string;
    testIndicator: string;
  };
  payer?: {
    id: string;
    name: string;
    requirements?: any;
  };
  businessContext?: string;
  statistics: {
    totalSegments: number;
    errorCount: number;
    warningCount: number;
    processingTime: number;
  };
}

export interface JSONConversionResult {
  header: {
    interchangeControl: any;
    functionalGroup: any;
    transactionSet: any;
  };
  data: {
    entities: any[];
    members?: any[];
    payments?: any[];
    claims?: any[];
  };
  metadata: {
    originalFormat: string;
    conversionTimestamp: string;
    statistics: any;
  };
}

// Enhanced EDI format detection with comprehensive X12 support
export function detectEDIFormat(content: string): X12FormatType | 'unknown' {
  const lines = content.split(/\r?\n/);
  
  // Look for ST segment which contains transaction type
  for (const line of lines) {
    const stMatch = line.match(/ST\*(\d{3})/);
    if (stMatch) {
      const formatCode = stMatch[1];
      if (formatCode in X12_FORMATS) {
        return formatCode as X12FormatType;
      }
    }
  }
  
  // Fallback: look for format-specific patterns
  const contentStr = content.toLowerCase();
  
  // Healthcare patterns
  if (contentStr.includes('bgn*') && contentStr.includes('ins*')) return '834';
  if (contentStr.includes('bpr*') && contentStr.includes('rmr*')) return '820';
  if (contentStr.includes('bht*') && contentStr.includes('clm*')) return '837';
  if (contentStr.includes('bpr*') && contentStr.includes('clp*')) return '835';
  if (contentStr.includes('bht*') && contentStr.includes('eb*')) return '271';
  
  // Supply chain patterns
  if (contentStr.includes('beg*') && contentStr.includes('po1*')) return '850';
  if (contentStr.includes('bak*') && contentStr.includes('ack*')) return '855';
  if (contentStr.includes('bsn*') && contentStr.includes('td1*')) return '856';
  if (contentStr.includes('big*') && contentStr.includes('it1*')) return '810';
  
  return 'unknown';
}

// Enhanced payer identification
export function identifyPayer(transaction: EDITransaction): string | null {
  const { segments } = transaction;
  
  // Check ISA segment for sender/receiver IDs
  const isaSegment = segments.find(s => s.tag === 'ISA');
  if (isaSegment) {
    const senderId = isaSegment.elements[6]?.toUpperCase();
    const receiverId = isaSegment.elements[8]?.toUpperCase();
    
    // Match against known payers
    for (const [payerId, payer] of Object.entries(PAYER_DATABASE)) {
      if (senderId?.includes(payerId) || receiverId?.includes(payerId) ||
          senderId?.includes(payer.name.toUpperCase()) || 
          receiverId?.includes(payer.name.toUpperCase())) {
        return payerId;
      }
    }
  }
  
  // Check N1 segments for entity names
  const n1Segments = segments.filter(s => s.tag === 'N1');
  for (const segment of n1Segments) {
    const entityName = segment.elements[2]?.toUpperCase();
    if (entityName) {
      for (const [payerId, payer] of Object.entries(PAYER_DATABASE)) {
        if (entityName.includes(payerId) || entityName.includes(payer.name.toUpperCase())) {
          return payerId;
        }
      }
    }
  }
  
  return null;
}

// Universal EDI parser with enhanced capabilities
export function parseEDIContent(content: string): EDITransaction {
  const startTime = Date.now();
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  const segments: EDISegment[] = [];
  const type = detectEDIFormat(content);
  
  let metadata = {
    sender: '',
    receiver: '',
    date: '',
    controlNumber: '',
    version: '',
    testIndicator: ''
  };

  let errorCount = 0;
  let warningCount = 0;

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    // Enhanced element parsing with multiple delimiter support
    const elements = trimmedLine.split(/[\*~\^]/);
    const tag = elements[0] || '';
    
    // Add segment definition
    const definition = SEGMENT_DEFINITIONS[tag as keyof typeof SEGMENT_DEFINITIONS];
    
    // Basic validation
    const errors: string[] = [];
    if (!definition && !['UNA', 'UNB', 'UNH'].includes(tag)) {
      errors.push(`Unknown segment type: ${tag}`);
      errorCount++;
    }

    // Extract enhanced metadata from key segments
    if (tag === 'ISA' && elements.length >= 16) {
      metadata.sender = elements[6] || '';
      metadata.receiver = elements[8] || '';
      metadata.date = elements[9] || '';
      metadata.controlNumber = elements[13] || '';
      metadata.version = elements[12] || '';
      metadata.testIndicator = elements[15] || '';
    }

    segments.push({
      tag,
      elements,
      raw: trimmedLine,
      lineNumber: index + 1,
      definition,
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    });
  });

  // Identify payer and add business context
  const transaction: EDITransaction = {
    type,
    segments,
    metadata,
    statistics: {
      totalSegments: segments.length,
      errorCount,
      warningCount,
      processingTime: Date.now() - startTime
    }
  };

  const payerId = identifyPayer(transaction);
  if (payerId && payerId in PAYER_DATABASE) {
    transaction.payer = {
      id: payerId,
      name: PAYER_DATABASE[payerId as keyof typeof PAYER_DATABASE].name,
      requirements: PAYER_DATABASE[payerId as keyof typeof PAYER_DATABASE].specialRequirements
    };
  }

  if (type !== 'unknown') {
    transaction.businessContext = X12_FORMATS[type].businessContext;
  }

  return transaction;
}

// Convert EDI to JSON with business-friendly structure
export function convertEDIToJSON(transaction: EDITransaction): JSONConversionResult {
  const result: JSONConversionResult = {
    header: {
      interchangeControl: {},
      functionalGroup: {},
      transactionSet: {}
    },
    data: {
      entities: [],
      members: [],
      payments: [],
      claims: []
    },
    metadata: {
      originalFormat: transaction.type,
      conversionTimestamp: new Date().toISOString(),
      statistics: transaction.statistics
    }
  };

  // Parse header information
  const isaSegment = transaction.segments.find(s => s.tag === 'ISA');
  if (isaSegment) {
    result.header.interchangeControl = {
      authorizationQualifier: isaSegment.elements[1],
      authorizationInformation: isaSegment.elements[2],
      securityQualifier: isaSegment.elements[3],
      securityInformation: isaSegment.elements[4],
      senderQualifier: isaSegment.elements[5],
      senderId: isaSegment.elements[6],
      receiverQualifier: isaSegment.elements[7],
      receiverId: isaSegment.elements[8],
      interchangeDate: isaSegment.elements[9],
      interchangeTime: isaSegment.elements[10],
      controlStandards: isaSegment.elements[11],
      controlVersion: isaSegment.elements[12],
      controlNumber: isaSegment.elements[13],
      acknowledgmentRequested: isaSegment.elements[14],
      testIndicator: isaSegment.elements[15]
    };
  }

  const gsSegment = transaction.segments.find(s => s.tag === 'GS');
  if (gsSegment) {
    result.header.functionalGroup = {
      functionalCode: gsSegment.elements[1],
      applicationSender: gsSegment.elements[2],
      applicationReceiver: gsSegment.elements[3],
      date: gsSegment.elements[4],
      time: gsSegment.elements[5],
      groupControlNumber: gsSegment.elements[6],
      responsibleAgency: gsSegment.elements[7],
      version: gsSegment.elements[8]
    };
  }

  const stSegment = transaction.segments.find(s => s.tag === 'ST');
  if (stSegment) {
    result.header.transactionSet = {
      transactionSetIdentifier: stSegment.elements[1],
      transactionSetControlNumber: stSegment.elements[2]
    };
  }

  // Format-specific data extraction
  switch (transaction.type) {
    case '834':
      result.data.members = extract834Members(transaction.segments);
      break;
    case '820':
      result.data.payments = extract820Payments(transaction.segments);
      break;
    case '837':
      result.data.claims = extract837Claims(transaction.segments);
      break;
    case '835':
      result.data.payments = extract835Payments(transaction.segments);
      break;
  }

  // Extract all entity information
  result.data.entities = extractEntities(transaction.segments);

  return result;
}

// Helper functions for specific format extraction
function extract834Members(segments: EDISegment[]): any[] {
  const members: any[] = [];
  let currentMember: any = null;

  for (const segment of segments) {
    switch (segment.tag) {
      case 'INS':
        if (currentMember) members.push(currentMember);
        currentMember = {
          memberLevelCode: segment.elements[1],
          relationshipCode: segment.elements[2],
          maintenanceTypeCode: segment.elements[3],
          maintenanceReasonCode: segment.elements[4],
          benefitStatusCode: segment.elements[5],
          demographics: {},
          healthCoverage: [],
          dates: []
        };
        break;
      case 'NM1':
        if (currentMember && segment.elements[1] === 'IL') {
          currentMember.name = {
            qualifier: segment.elements[1],
            lastName: segment.elements[3],
            firstName: segment.elements[4],
            middleName: segment.elements[5],
            suffix: segment.elements[7],
            idQualifier: segment.elements[8],
            id: segment.elements[9]
          };
        }
        break;
      case 'DMG':
        if (currentMember) {
          currentMember.demographics = {
            dateQualifier: segment.elements[1],
            birthDate: segment.elements[2],
            genderCode: segment.elements[3],
            maritalStatus: segment.elements[4],
            raceEthnicity: segment.elements[5]
          };
        }
        break;
      case 'HD':
        if (currentMember) {
          currentMember.healthCoverage.push({
            maintenanceTypeCode: segment.elements[1],
            maintenanceReasonCode: segment.elements[2],
            insuranceLineCode: segment.elements[3],
            planCoverageDescription: segment.elements[4],
            coverageLevelCode: segment.elements[5]
          });
        }
        break;
    }
  }

  if (currentMember) members.push(currentMember);
  return members;
}

function extract820Payments(segments: EDISegment[]): any[] {
  const payments: any[] = [];
  let currentPayment: any = null;

  for (const segment of segments) {
    switch (segment.tag) {
      case 'BPR':
        if (currentPayment) payments.push(currentPayment);
        currentPayment = {
          transactionHandlingCode: segment.elements[1],
          monetaryAmount: parseFloat(segment.elements[2] || '0'),
          creditDebitFlag: segment.elements[3],
          paymentMethodCode: segment.elements[4],
          paymentFormatCode: segment.elements[5],
          originatingCompanyId: segment.elements[7],
          originatingCompanySupplementalCode: segment.elements[8],
          receivingCompanyId: segment.elements[10],
          receivingCompanySupplementalCode: segment.elements[11],
          effectiveEntryDate: segment.elements[16],
          remittanceDetails: []
        };
        break;
      case 'RMR':
        if (currentPayment) {
          currentPayment.remittanceDetails.push({
            referenceQualifier: segment.elements[1],
            memberGroupNumber: segment.elements[2],
            remittanceAmount: parseFloat(segment.elements[3] || '0'),
            adjustmentAmount: parseFloat(segment.elements[4] || '0')
          });
        }
        break;
    }
  }

  if (currentPayment) payments.push(currentPayment);
  return payments;
}

function extract837Claims(segments: EDISegment[]): any[] {
  // Implementation for claim extraction
  return [];
}

function extract835Payments(segments: EDISegment[]): any[] {
  // Implementation for payment advice extraction
  return [];
}

function extractEntities(segments: EDISegment[]): any[] {
  const entities: any[] = [];

  for (const segment of segments) {
    if (segment.tag === 'N1') {
      const entity = {
        entityQualifier: segment.elements[1],
        entityName: segment.elements[2],
        idQualifier: segment.elements[3],
        id: segment.elements[4],
        address: null as any,
        contacts: [] as any[]
      };

      entities.push(entity);
    }
  }

  return entities;
}

// Convert JSON back to EDI
export function convertJSONToEDI(jsonData: JSONConversionResult): string {
  const lines: string[] = [];

  // Reconstruct ISA
  const isa = jsonData.header.interchangeControl;
  if (isa) {
    lines.push(`ISA*${isa.authorizationQualifier || '00'}*${isa.authorizationInformation || '          '}*${isa.securityQualifier || '00'}*${isa.securityInformation || '          '}*${isa.senderQualifier || 'ZZ'}*${(isa.senderId || '').padEnd(15)}*${isa.receiverQualifier || 'ZZ'}*${(isa.receiverId || '').padEnd(15)}*${isa.interchangeDate || ''}*${isa.interchangeTime || ''}*U*${isa.controlVersion || '00501'}*${isa.controlNumber || '000000001'}*${isa.acknowledgmentRequested || '0'}*${isa.testIndicator || 'P'}*>`);
  }

  // Reconstruct GS
  const gs = jsonData.header.functionalGroup;
  if (gs) {
    lines.push(`GS*${gs.functionalCode || 'BE'}*${gs.applicationSender || ''}*${gs.applicationReceiver || ''}*${gs.date || ''}*${gs.time || ''}*${gs.groupControlNumber || '1'}*${gs.responsibleAgency || 'X'}*${gs.version || '005010X220A1'}~`);
  }

  // Reconstruct ST
  const st = jsonData.header.transactionSet;
  if (st) {
    lines.push(`ST*${st.transactionSetIdentifier || '834'}*${st.transactionSetControlNumber || '0001'}~`);
  }

  // Add format-specific segments based on original format
  switch (jsonData.metadata.originalFormat) {
    case '834':
      lines.push(...reconstruct834Segments(jsonData.data.members || []));
      break;
    case '820':
      lines.push(...reconstruct820Segments(jsonData.data.payments || []));
      break;
  }

  // Add trailers
  lines.push(`SE*${lines.length + 1}*${st?.transactionSetControlNumber || '0001'}~`);
  lines.push(`GE*1*${gs?.groupControlNumber || '1'}~`);
  lines.push(`IEA*1*${isa?.controlNumber || '000000001'}~`);

  return lines.join('\n');
}

function reconstruct834Segments(members: any[]): string[] {
  const lines: string[] = [];
  
  // Add BGN segment
  lines.push('BGN*00*ABC123*20241208*1200*ET*Original~');
  
  for (const member of members) {
    // INS segment
    lines.push(`INS*${member.memberLevelCode || 'Y'}*${member.relationshipCode || '18'}*${member.maintenanceTypeCode || '030'}*${member.maintenanceReasonCode || 'AI'}*${member.benefitStatusCode || 'A'}***AC~`);
    
    // NM1 segment
    if (member.name) {
      lines.push(`NM1*IL*1*${member.name.lastName || ''}*${member.name.firstName || ''}*${member.name.middleName || ''}**34*${member.name.id || ''}~`);
    }
    
    // DMG segment
    if (member.demographics) {
      lines.push(`DMG*D8*${member.demographics.birthDate || ''}*${member.demographics.genderCode || ''}~`);
    }
    
    // HD segments
    for (const coverage of member.healthCoverage || []) {
      lines.push(`HD*${coverage.maintenanceTypeCode || '030'}**${coverage.insuranceLineCode || 'HLT'}*${coverage.planCoverageDescription || ''}*${coverage.coverageLevelCode || 'EMP'}~`);
    }
  }
  
  return lines;
}

function reconstruct820Segments(payments: any[]): string[] {
  const lines: string[] = [];
  
  for (const payment of payments) {
    // BPR segment
    lines.push(`BPR*${payment.transactionHandlingCode || 'I'}*${payment.monetaryAmount || '0'}*${payment.creditDebitFlag || 'C'}*${payment.paymentMethodCode || 'ACH'}*${payment.paymentFormatCode || 'CCP'}**${payment.originatingCompanyId || ''}*${payment.originatingCompanySupplementalCode || ''}**${payment.receivingCompanyId || ''}*${payment.receivingCompanySupplementalCode || ''}*****${payment.effectiveEntryDate || ''}~`);
    
    // RMR segments
    for (const remittance of payment.remittanceDetails || []) {
      lines.push(`RMR*${remittance.referenceQualifier || 'PO'}*${remittance.memberGroupNumber || ''}*${remittance.remittanceAmount || '0'}*${remittance.adjustmentAmount || '0'}~`);
    }
  }
  
  return lines;
}