// Legacy types - use universalEDIParser.ts for new implementations
export type EDISegment = {
  tag: string;
  elements: string[];
  raw: string;
  lineNumber: number;
};

export type EDITransaction = {
  type: '834' | '820' | 'unknown';
  segments: EDISegment[];
  metadata: {
    sender: string;
    receiver: string;
    date: string;
    controlNumber: string;
  };
};

export function detectEDIType(content: string): '834' | '820' | 'unknown' {
  const lines = content.split(/\r?\n/);
  
  for (const line of lines) {
    if (line.includes('ST*834') || line.includes('ST*834*')) {
      return '834';
    }
    if (line.includes('ST*820') || line.includes('ST*820*')) {
      return '820';
    }
  }
  
  return 'unknown';
}

export function parseEDIContent(content: string): EDITransaction {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  const segments: EDISegment[] = [];
  const type = detectEDIType(content);
  
  let metadata = {
    sender: '',
    receiver: '',
    date: '',
    controlNumber: ''
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    // Split by * (standard EDI delimiter) or ~ (some variations)
    const elements = trimmedLine.split(/[\*~]/);
    const tag = elements[0] || '';

    // Extract metadata from key segments
    if (tag === 'ISA' && elements.length >= 13) {
      metadata.sender = elements[6] || '';
      metadata.receiver = elements[8] || '';
      metadata.date = elements[9] || '';
      metadata.controlNumber = elements[13] || '';
    }

    segments.push({
      tag,
      elements,
      raw: trimmedLine,
      lineNumber: index + 1
    });
  });

  return {
    type,
    segments,
    metadata
  };
}

export function highlightEDISegment(segment: EDISegment): string {
  const elements = segment.raw.split(/[\*~]/);
  
  return elements.map((element, index) => {
    if (index === 0) {
      return `<span class="edi-segment">${element}</span>`;
    } else {
      return `<span class="edi-separator">*</span><span class="${getElementClass(element, index)}">${element}</span>`;
    }
  }).join('');
}

function getElementClass(element: string, index: number): string {
  // Date patterns
  if (/^\d{8}$/.test(element) || /^\d{6}$/.test(element)) {
    return 'edi-date';
  }
  
  // Number patterns
  if (/^\d+(\.\d+)?$/.test(element)) {
    return 'edi-number';
  }
  
  // Qualifier patterns (short codes, usually 2-3 chars)
  if (element.length <= 3 && /^[A-Z0-9]+$/.test(element)) {
    return 'edi-qualifier';
  }
  
  return 'edi-element';
}

export function decodeEDI834Segment(segment: EDISegment): string {
  const { tag, elements } = segment;
  
  switch (tag) {
    case 'ISA':
      return `Interchange Control Header - Authorization: ${elements[1]}, Security: ${elements[3]}, Sender: ${elements[6]}, Receiver: ${elements[8]}`;
    case 'GS':
      return `Functional Group Header - Application Sender: ${elements[2]}, Application Receiver: ${elements[3]}`;
    case 'ST':
      return `Transaction Set Header - Type: ${elements[1]}, Control Number: ${elements[2]}`;
    case 'BGN':
      return `Beginning Segment - Transaction Purpose: ${elements[1]}, Reference ID: ${elements[2]}`;
    case 'REF':
      return `Reference Information - Qualifier: ${elements[1]}, Reference ID: ${elements[2]}`;
    case 'DTP':
      return `Date/Time - Qualifier: ${elements[1]}, Format: ${elements[2]}, Date: ${elements[3]}`;
    case 'QTY':
      return `Quantity - Qualifier: ${elements[1]}, Quantity: ${elements[2]}`;
    case 'N1':
      return `Entity Name - Type: ${elements[1]}, Name: ${elements[2]}`;
    case 'INS':
      return `Member Level Detail - Indicator: ${elements[1]}, Relationship: ${elements[2]}`;
    case 'NM1':
      return `Individual Name - Type: ${elements[1]}, Last Name: ${elements[3]}, First Name: ${elements[4]}`;
    case 'DMG':
      return `Demographic Information - Date Format: ${elements[1]}, Birth Date: ${elements[2]}, Gender: ${elements[3]}`;
    case 'HD':
      return `Health Coverage - Maintenance Type: ${elements[1]}, Insurance Line: ${elements[3]}`;
    case 'SE':
      return `Transaction Set Trailer - Segment Count: ${elements[1]}, Control Number: ${elements[2]}`;
    default:
      return `${tag} Segment - ${elements.slice(1).join(', ')}`;
  }
}

export function decodeEDI820Segment(segment: EDISegment): string {
  const { tag, elements } = segment;
  
  switch (tag) {
    case 'ISA':
      return `Interchange Control Header - Authorization: ${elements[1]}, Security: ${elements[3]}, Sender: ${elements[6]}, Receiver: ${elements[8]}`;
    case 'GS':
      return `Functional Group Header - Application Sender: ${elements[2]}, Application Receiver: ${elements[3]}`;
    case 'ST':
      return `Transaction Set Header - Type: ${elements[1]}, Control Number: ${elements[2]}`;
    case 'BPR':
      return `Financial Information - Transaction Type: ${elements[1]}, Amount: ${elements[2]}, Credit/Debit: ${elements[3]}`;
    case 'REF':
      return `Reference Information - Qualifier: ${elements[1]}, Reference ID: ${elements[2]}`;
    case 'DTM':
      return `Date/Time Reference - Qualifier: ${elements[1]}, Date: ${elements[2]}`;
    case 'N1':
      return `Entity Name - Type: ${elements[1]}, Name: ${elements[2]}`;
    case 'RMR':
      return `Remittance Advice - Reference ID: ${elements[1]}, Payment Action: ${elements[2]}`;
    case 'SE':
      return `Transaction Set Trailer - Segment Count: ${elements[1]}, Control Number: ${elements[2]}`;
    default:
      return `${tag} Segment - ${elements.slice(1).join(', ')}`;
  }
}