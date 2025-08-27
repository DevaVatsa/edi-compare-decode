import { EDISegment, EDITransaction } from './ediParser';

export type EDIError = {
  id: string;
  type: 'critical' | 'warning' | 'info';
  segment: EDISegment;
  message: string;
  description: string;
  suggestion?: string;
};

export type ValidationResult = {
  isValid: boolean;
  errors: EDIError[];
  warnings: EDIError[];
  totalIssues: number;
};

// Required segments for 834 transactions
const REQUIRED_834_SEGMENTS = ['ISA', 'GS', 'ST', 'BGN', 'N1', 'INS', 'NM1', 'SE', 'GE', 'IEA'];

// Required segments for 820 transactions  
const REQUIRED_820_SEGMENTS = ['ISA', 'GS', 'ST', 'BPR', 'N1', 'SE', 'GE', 'IEA'];

export function validateEDITransaction(transaction: EDITransaction): ValidationResult {
  const errors: EDIError[] = [];
  const segments = transaction.segments;
  
  // Check for required segments
  validateRequiredSegments(transaction, errors);
  
  // Check segment sequence
  validateSegmentSequence(transaction, errors);
  
  // Check control numbers
  validateControlNumbers(transaction, errors);
  
  // Check data formats
  validateDataFormats(transaction, errors);
  
  // Check specific business rules
  if (transaction.type === '834') {
    validate834BusinessRules(transaction, errors);
  } else if (transaction.type === '820') {
    validate820BusinessRules(transaction, errors);
  }
  
  const warnings = errors.filter(e => e.type === 'warning');
  const criticalErrors = errors.filter(e => e.type === 'critical');
  
  return {
    isValid: criticalErrors.length === 0,
    errors: criticalErrors,
    warnings,
    totalIssues: errors.length
  };
}

function validateRequiredSegments(transaction: EDITransaction, errors: EDIError[]): void {
  const requiredSegments = transaction.type === '834' ? REQUIRED_834_SEGMENTS : REQUIRED_820_SEGMENTS;
  const presentSegments = new Set(transaction.segments.map(s => s.tag));
  
  requiredSegments.forEach(required => {
    if (!presentSegments.has(required)) {
      errors.push({
        id: `missing-${required}`,
        type: 'critical',
        segment: transaction.segments[0], // Reference first segment
        message: `Missing required segment: ${required}`,
        description: `EDI ${transaction.type} transactions must include a ${required} segment`,
        suggestion: `Add the ${required} segment in the correct position`
      });
    }
  });
}

function validateSegmentSequence(transaction: EDITransaction, errors: EDIError[]): void {
  const segments = transaction.segments;
  
  // ISA must be first
  if (segments.length > 0 && segments[0].tag !== 'ISA') {
    errors.push({
      id: 'isa-not-first',
      type: 'critical',
      segment: segments[0],
      message: 'ISA segment must be first',
      description: 'The Interchange Control Header (ISA) must be the first segment',
      suggestion: 'Move the ISA segment to the beginning of the file'
    });
  }
  
  // IEA must be last
  if (segments.length > 0 && segments[segments.length - 1].tag !== 'IEA') {
    errors.push({
      id: 'iea-not-last',
      type: 'critical',
      segment: segments[segments.length - 1],
      message: 'IEA segment must be last',
      description: 'The Interchange Control Trailer (IEA) must be the last segment',
      suggestion: 'Move the IEA segment to the end of the file'
    });
  }
}

function validateControlNumbers(transaction: EDITransaction, errors: EDIError[]): void {
  const isaSegment = transaction.segments.find(s => s.tag === 'ISA');
  const ieaSegment = transaction.segments.find(s => s.tag === 'IEA');
  
  if (isaSegment && ieaSegment) {
    const isaControlNumber = isaSegment.elements[13];
    const ieaControlNumber = ieaSegment.elements[2];
    
    if (isaControlNumber !== ieaControlNumber) {
      errors.push({
        id: 'control-number-mismatch',
        type: 'critical',
        segment: ieaSegment,
        message: 'Control number mismatch',
        description: `ISA control number (${isaControlNumber}) doesn't match IEA control number (${ieaControlNumber})`,
        suggestion: 'Ensure both ISA and IEA segments have the same control number'
      });
    }
  }
}

function validateDataFormats(transaction: EDITransaction, errors: EDIError[]): void {
  transaction.segments.forEach(segment => {
    switch (segment.tag) {
      case 'ISA':
        validateISAFormat(segment, errors);
        break;
      case 'DTP':
        validateDTPFormat(segment, errors);
        break;
      case 'DMG':
        validateDMGFormat(segment, errors);
        break;
    }
  });
}

function validateISAFormat(segment: EDISegment, errors: EDIError[]): void {
  if (segment.elements.length < 16) {
    errors.push({
      id: `isa-insufficient-elements-${segment.lineNumber}`,
      type: 'critical',
      segment,
      message: 'ISA segment has insufficient elements',
      description: 'ISA segment must have at least 16 elements',
      suggestion: 'Check the ISA segment format and ensure all required elements are present'
    });
  }
  
  // Validate date format (element 9)
  const date = segment.elements[9];
  if (date && !/^\d{6}$/.test(date)) {
    errors.push({
      id: `isa-invalid-date-${segment.lineNumber}`,
      type: 'warning',
      segment,
      message: 'Invalid date format in ISA segment',
      description: `Date "${date}" should be in YYMMDD format`,
      suggestion: 'Use YYMMDD format for the interchange date'
    });
  }
}

function validateDTPFormat(segment: EDISegment, errors: EDIError[]): void {
  if (segment.elements.length < 4) {
    errors.push({
      id: `dtp-insufficient-elements-${segment.lineNumber}`,
      type: 'warning',
      segment,
      message: 'DTP segment has insufficient elements',
      description: 'DTP segment should have at least 3 elements',
      suggestion: 'Ensure qualifier, format, and date are provided'
    });
    return;
  }
  
  const format = segment.elements[2];
  const date = segment.elements[3];
  
  if (format === 'D8' && date && !/^\d{8}$/.test(date)) {
    errors.push({
      id: `dtp-invalid-date-${segment.lineNumber}`,
      type: 'warning',
      segment,
      message: 'Invalid date format in DTP segment',
      description: `Date "${date}" should be in CCYYMMDD format when format is D8`,
      suggestion: 'Use CCYYMMDD format for D8 date qualifier'
    });
  }
}

function validateDMGFormat(segment: EDISegment, errors: EDIError[]): void {
  if (segment.elements.length < 4) return;
  
  const birthDate = segment.elements[2];
  const gender = segment.elements[3];
  
  if (birthDate && !/^\d{8}$/.test(birthDate)) {
    errors.push({
      id: `dmg-invalid-birthdate-${segment.lineNumber}`,
      type: 'warning',
      segment,
      message: 'Invalid birth date format',
      description: `Birth date "${birthDate}" should be in CCYYMMDD format`,
      suggestion: 'Use CCYYMMDD format for birth dates'
    });
  }
  
  if (gender && !['M', 'F', 'U'].includes(gender)) {
    errors.push({
      id: `dmg-invalid-gender-${segment.lineNumber}`,
      type: 'warning',
      segment,
      message: 'Invalid gender code',
      description: `Gender code "${gender}" should be M, F, or U`,
      suggestion: 'Use M (Male), F (Female), or U (Unknown) for gender codes'
    });
  }
}

function validate834BusinessRules(transaction: EDITransaction, errors: EDIError[]): void {
  // Check for orphaned NM1 segments (should follow INS)
  let lastINS = -1;
  transaction.segments.forEach((segment, index) => {
    if (segment.tag === 'INS') {
      lastINS = index;
    } else if (segment.tag === 'NM1' && segment.elements[1] === 'IL') {
      if (lastINS === -1 || index - lastINS > 10) {
        errors.push({
          id: `orphaned-nm1-${segment.lineNumber}`,
          type: 'warning',
          segment,
          message: 'NM1 segment may be orphaned',
          description: 'Individual NM1 segments should closely follow their corresponding INS segment',
          suggestion: 'Ensure NM1*IL segments are properly associated with INS segments'
        });
      }
    }
  });
}

function validate820BusinessRules(transaction: EDITransaction, errors: EDIError[]): void {
  const bprSegments = transaction.segments.filter(s => s.tag === 'BPR');
  
  if (bprSegments.length === 0) {
    errors.push({
      id: 'missing-bpr',
      type: 'critical',
      segment: transaction.segments[0],
      message: 'Missing BPR segment',
      description: 'EDI 820 transactions must include at least one BPR (Financial Information) segment',
      suggestion: 'Add a BPR segment with payment details'
    });
  }
  
  // Validate payment amounts
  bprSegments.forEach(segment => {
    const amount = segment.elements[2];
    if (amount && !/^\d+(\.\d{2})?$/.test(amount)) {
      errors.push({
        id: `bpr-invalid-amount-${segment.lineNumber}`,
        type: 'warning',
        segment,
        message: 'Invalid payment amount format',
        description: `Amount "${amount}" should be in decimal format with up to 2 decimal places`,
        suggestion: 'Use decimal format like 1234.56 for payment amounts'
      });
    }
  });
}