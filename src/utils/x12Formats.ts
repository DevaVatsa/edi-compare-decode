// Comprehensive X12 EDI Format Library
export const X12_FORMATS = {
  // Healthcare - Primary Focus
  '834': {
    name: 'Benefit Enrollment and Maintenance',
    description: 'Member enrollment, changes, and terminations',
    category: 'healthcare',
    requiredSegments: ['ISA', 'GS', 'ST', 'BGN', 'N1', 'INS', 'NM1', 'SE', 'GE', 'IEA'],
    businessContext: 'enrollment'
  },
  '820': {
    name: 'Payment Order/Remittance Advice',
    description: 'Premium payments and remittance information',
    category: 'healthcare',
    requiredSegments: ['ISA', 'GS', 'ST', 'BPR', 'N1', 'SE', 'GE', 'IEA'],
    businessContext: 'payment'
  },
  '837': {
    name: 'Health Care Claim',
    description: 'Professional, institutional, and dental claims',
    category: 'healthcare',
    requiredSegments: ['ISA', 'GS', 'ST', 'BHT', 'NM1', 'CLM', 'SE', 'GE', 'IEA'],
    businessContext: 'claims'
  },
  '835': {
    name: 'Health Care Claim Payment/Advice',
    description: 'Payment and remittance advice for claims',
    category: 'healthcare',
    requiredSegments: ['ISA', 'GS', 'ST', 'BPR', 'N1', 'CLP', 'SE', 'GE', 'IEA'],
    businessContext: 'payment'
  },
  '270': {
    name: 'Eligibility/Benefit Inquiry',
    description: 'Request for member eligibility and benefits',
    category: 'healthcare',
    requiredSegments: ['ISA', 'GS', 'ST', 'BHT', 'HL', 'NM1', 'SE', 'GE', 'IEA'],
    businessContext: 'eligibility'
  },
  '271': {
    name: 'Eligibility/Benefit Response',
    description: 'Response to eligibility and benefit inquiries',
    category: 'healthcare',
    requiredSegments: ['ISA', 'GS', 'ST', 'BHT', 'HL', 'NM1', 'EB', 'SE', 'GE', 'IEA'],
    businessContext: 'eligibility'
  },
  '278': {
    name: 'Health Care Services Review',
    description: 'Prior authorization requests and responses',
    category: 'healthcare',
    requiredSegments: ['ISA', 'GS', 'ST', 'BHT', 'HL', 'NM1', 'SE', 'GE', 'IEA'],
    businessContext: 'authorization'
  },
  '999': {
    name: 'Implementation Acknowledgment',
    description: 'Functional acknowledgment for received transactions',
    category: 'healthcare',
    requiredSegments: ['ISA', 'GS', 'ST', 'AK1', 'AK9', 'SE', 'GE', 'IEA'],
    businessContext: 'acknowledgment'
  },

  // Supply Chain & Logistics
  '850': {
    name: 'Purchase Order',
    description: 'Electronic purchase orders',
    category: 'supply_chain',
    requiredSegments: ['ISA', 'GS', 'ST', 'BEG', 'N1', 'PO1', 'SE', 'GE', 'IEA'],
    businessContext: 'procurement'
  },
  '855': {
    name: 'Purchase Order Acknowledgment',
    description: 'Acknowledgment of purchase orders',
    category: 'supply_chain',
    requiredSegments: ['ISA', 'GS', 'ST', 'BAK', 'N1', 'PO1', 'ACK', 'SE', 'GE', 'IEA'],
    businessContext: 'procurement'
  },
  '856': {
    name: 'Ship Notice/Manifest',
    description: 'Advance shipping notifications',
    category: 'supply_chain',
    requiredSegments: ['ISA', 'GS', 'ST', 'BSN', 'HL', 'TD1', 'SE', 'GE', 'IEA'],
    businessContext: 'shipping'
  },
  '810': {
    name: 'Invoice',
    description: 'Electronic invoices',
    category: 'financial',
    requiredSegments: ['ISA', 'GS', 'ST', 'BIG', 'N1', 'IT1', 'SE', 'GE', 'IEA'],
    businessContext: 'billing'
  }
} as const;

// Major Payer Database with specific requirements
export const PAYER_DATABASE = {
  'AETNA': {
    id: 'AETNA',
    name: 'Aetna Inc.',
    formats: ['834', '820', '837', '835', '270', '271'],
    specialRequirements: {
      '834': {
        memberIdFormat: /^[A-Z]{2}\d{8}$/,
        requiredElements: ['INS*Y', 'NM1*IL', 'DMG', 'HD'],
        businessRules: ['Must include employer information', 'Effective dates required']
      },
      '820': {
        paymentFormat: /^\d+\.\d{2}$/,
        routingNumberRequired: true,
        controlNumberSequence: 'AETNA-YYYYMMDD-NNNN'
      }
    },
    contactInfo: {
      technicalSupport: 'edi.support@aetna.com',
      testingEnvironment: 'test.edi.aetna.com'
    }
  },
  'KAISER': {
    id: 'KAISER',
    name: 'Kaiser Foundation Health Plan',
    formats: ['834', '820', '837', '835'],
    specialRequirements: {
      '834': {
        memberIdFormat: /^\d{9}$/,
        requiredElements: ['INS*Y', 'NM1*IL', 'N3', 'N4', 'DMG', 'HD'],
        businessRules: ['Address validation required', 'Plan codes must be pre-approved']
      },
      '820': {
        paymentFormat: /^\d+\.\d{2}$/,
        bankAccountValidation: true,
        reconciliationRequired: true
      }
    },
    contactInfo: {
      technicalSupport: 'edisupport@kp.org',
      testingEnvironment: 'test.kp.org'
    }
  },
  'BCBS_AL': {
    id: 'BCBS_AL',
    name: 'Blue Cross Blue Shield of Alabama',
    formats: ['834', '820', '837', '835', '270', '271', '278'],
    specialRequirements: {
      '834': {
        memberIdFormat: /^[A-Z]{3}\d{9}$/,
        requiredElements: ['INS*Y', 'NM1*IL', 'DMG', 'HD', 'REF*0F'],
        businessRules: ['SSN validation required', 'Dependent relationships must be specified']
      },
      '820': {
        paymentFormat: /^\d+\.\d{2}$/,
        traceNumberRequired: true,
        eftDetailsRequired: true
      }
    },
    contactInfo: {
      technicalSupport: 'edi@bcbsal.org',
      testingEnvironment: 'test.bcbsal.org'
    }
  }
} as const;

// Segment definitions for all X12 formats
export const SEGMENT_DEFINITIONS = {
  // Control Segments
  'ISA': 'Interchange Control Header',
  'IEA': 'Interchange Control Trailer',
  'GS': 'Functional Group Header',
  'GE': 'Functional Group Trailer',
  'ST': 'Transaction Set Header',
  'SE': 'Transaction Set Trailer',

  // Healthcare Specific
  'BGN': 'Beginning Segment',
  'BHT': 'Beginning of Hierarchical Transaction',
  'INS': 'Member Level Detail',
  'NM1': 'Individual Name',
  'N1': 'Entity Name',
  'N3': 'Address Information',
  'N4': 'Geographic Location',
  'DMG': 'Demographic Information',
  'HD': 'Health Coverage',
  'DTP': 'Date/Time Period',
  'REF': 'Reference Information',
  'PER': 'Administrative Communications Contact',
  'EB': 'Eligibility or Benefit Information',
  'CLP': 'Claim Level Data',
  'BPR': 'Financial Information',
  'TRN': 'Trace',
  'QTY': 'Quantity',
  'AMT': 'Monetary Amount',
  'HL': 'Hierarchical Level',

  // Acknowledgment
  'AK1': 'Functional Group Response Header',
  'AK9': 'Functional Group Response Trailer',
  'TA1': 'Interchange Acknowledgment',

  // Supply Chain
  'BEG': 'Beginning Segment for Purchase Order',
  'BAK': 'Beginning Segment for Purchase Order Acknowledgment',
  'BSN': 'Beginning Segment for Ship Notice',
  'BIG': 'Beginning Segment for Invoice',
  'PO1': 'Baseline Item Data',
  'ACK': 'Line Item Acknowledgment',
  'IT1': 'Baseline Item Data (Invoice)',
  'TD1': 'Carrier Details (Quantity and Weight)',

  // Financial
  'RMR': 'Remittance Advice',
  'DTM': 'Date/Time Reference',
  'ENT': 'Entity'
} as const;

export type X12FormatType = keyof typeof X12_FORMATS;
export type PayerType = keyof typeof PAYER_DATABASE;
export type SegmentType = keyof typeof SEGMENT_DEFINITIONS;