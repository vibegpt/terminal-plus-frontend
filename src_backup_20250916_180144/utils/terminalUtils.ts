// terminalUtils.ts - Terminal resolution and transit logic
// Used in: Terminal lookups, airline logic, transit checks

// Terminal lookup data
const AIRLINE_TERMINAL_MAPPING: Record<string, string> = {
  'QF': 'T1', // Qantas
  'JQ': 'T1', // Jetstar
  'VA': 'T2', // Virgin Australia
  'NZ': 'T1', // Air New Zealand
  'SQ': 'T1', // Singapore Airlines
  'EK': 'T1', // Emirates
  'EY': 'T1', // Etihad
  'QR': 'T1', // Qatar Airways
  'TG': 'T1', // Thai Airways
  'MH': 'T1', // Malaysia Airlines
  'CX': 'T1', // Cathay Pacific
  'BR': 'T1', // EVA Air
  'CI': 'T1', // China Airlines
  'KE': 'T1', // Korean Air
  'OZ': 'T1', // Asiana Airlines
  'JL': 'T1', // Japan Airlines
  'NH': 'T1', // All Nippon Airways
  'CA': 'T1', // Air China
  'MU': 'T1', // China Eastern
  'CZ': 'T1', // China Southern
  'HU': 'T1', // Hainan Airlines
  '3U': 'T1', // Sichuan Airlines
  'MF': 'T1', // Xiamen Airlines
  'GS': 'T1', // Tianjin Airlines
  'JD': 'T1', // Beijing Capital Airlines
  'PN': 'T1', // West Air
  '9C': 'T1', // Spring Airlines
  'HO': 'T1', // Juneyao Airlines
  'FM': 'T1', // Shanghai Airlines
  'KN': 'T1', // China United Airlines
  'GJ': 'T1', // Loong Air
  'KY': 'T1', // Kunming Airlines
  '8L': 'T1', // Lucky Air
  'DR': 'T1', // Ruili Airlines
  'EU': 'T1', // Chengdu Airlines
  'TV': 'T1', // Tibet Airlines
  'UQ': 'T1', // Urumqi Air
  'GT': 'T1', // Air Guilin
  'FU': 'T1', // Fuzhou Airlines
  'RY': 'T1', // Jiangxi Air
  'QW': 'T1', // Qingdao Airlines
  'BK': 'T1', // Okay Airways
  'CN': 'T1', // Grand China Air
};

// Terminal resolution logic
export const resolveTerminal = (flightNumber: string, airlineCode?: string): string => {
  // Extract airline code from flight number if not provided
  const code = airlineCode || extractAirlineCode(flightNumber);
  
  // Look up terminal from airline code
  const terminal = AIRLINE_TERMINAL_MAPPING[code];
  
  if (terminal) {
    return terminal;
  }
  
  // Fallback logic based on flight number patterns
  if (flightNumber.startsWith('QF') || flightNumber.startsWith('JQ')) {
    return 'T1';
  }
  
  if (flightNumber.startsWith('VA')) {
    return 'T2';
  }
  
  // Default to T1 for international flights, T2 for domestic
  return isInternationalFlight(flightNumber) ? 'T1' : 'T2';
};

export const extractAirlineCode = (flightNumber: string): string => {
  // Extract 2-letter airline code from flight number
  const match = flightNumber.match(/^([A-Z]{2})/);
  return match ? match[1] : '';
};

export const isInternationalFlight = (flightNumber: string): boolean => {
  // Simple heuristic: flights with 4+ digits are usually international
  const digits = flightNumber.replace(/\D/g, '');
  return digits.length >= 4;
};

// Transit and self-transfer logic
export const checkTransitOrSelfTransfer = (
  flight1: string,
  flight2: string,
  layoverDuration: number
): {
  type: 'transit' | 'self-transfer' | 'unknown';
  requiresTerminalChange: boolean;
  estimatedTransferTime: number;
  risk: 'low' | 'medium' | 'high';
} => {
  // MVP placeholder - this is demo logic, not production-ready
  const terminal1 = resolveTerminal(flight1);
  const terminal2 = resolveTerminal(flight2);
  const requiresTerminalChange = terminal1 !== terminal2;
  
  // Estimate transfer time based on terminal change and layover duration
  let estimatedTransferTime = 30; // Base 30 minutes
  let risk: 'low' | 'medium' | 'high' = 'low';
  
  if (requiresTerminalChange) {
    estimatedTransferTime += 20; // Additional 20 minutes for terminal change
    risk = layoverDuration < 90 ? 'high' : layoverDuration < 120 ? 'medium' : 'low';
  } else {
    risk = layoverDuration < 60 ? 'medium' : 'low';
  }
  
  // Determine if it's a self-transfer (usually same airline, short layover)
  const isSelfTransfer = extractAirlineCode(flight1) === extractAirlineCode(flight2) && layoverDuration < 120;
  
  return {
    type: isSelfTransfer ? 'self-transfer' : 'transit',
    requiresTerminalChange,
    estimatedTransferTime,
    risk
  };
};

// Terminal information and amenities
export const getTerminalInfo = (terminal: string): {
  name: string;
  description: string;
  facilities: string[];
  transferTime: number;
} => {
  const terminalInfo = {
    'T1': {
      name: 'Terminal 1',
      description: 'International Terminal',
      facilities: ['International flights', 'Customs', 'Immigration', 'Duty-free shops', 'Premium lounges'],
      transferTime: 45
    },
    'T2': {
      name: 'Terminal 2',
      description: 'Domestic Terminal',
      facilities: ['Domestic flights', 'Food courts', 'Retail shops', 'Business lounges'],
      transferTime: 30
    },
    'T3': {
      name: 'Terminal 3',
      description: 'Regional Terminal',
      facilities: ['Regional flights', 'Quick service', 'Basic amenities'],
      transferTime: 20
    }
  };
  
  return terminalInfo[terminal as keyof typeof terminalInfo] || terminalInfo['T1'];
};

// Gate and terminal proximity
export const calculateTerminalDistance = (terminal1: string, terminal2: string): number => {
  const distances: Record<string, Record<string, number>> = {
    'T1': { 'T2': 800, 'T3': 1200 },
    'T2': { 'T1': 800, 'T3': 600 },
    'T3': { 'T1': 1200, 'T2': 600 }
  };
  
  if (terminal1 === terminal2) return 0;
  return distances[terminal1]?.[terminal2] || 1000; // Default 1km
};

export const estimateWalkingTime = (terminal1: string, terminal2: string): number => {
  const distance = calculateTerminalDistance(terminal1, terminal2);
  const walkingSpeed = 80; // meters per minute
  return Math.ceil(distance / walkingSpeed);
};

// Flight status and terminal updates
export const getTerminalFromGate = (gate: string): string => {
  // Simple gate to terminal mapping
  if (gate.startsWith('A') || gate.startsWith('B') || gate.startsWith('C')) {
    return 'T1';
  }
  if (gate.startsWith('D') || gate.startsWith('E') || gate.startsWith('F')) {
    return 'T2';
  }
  if (gate.startsWith('G') || gate.startsWith('H')) {
    return 'T3';
  }
  return 'T1'; // Default
}; 