// Terminal validation utilities

export const VALID_TERMINALS = {
  SYD: ['SYD-T1', 'SYD-T2', 'SYD-T3', 'SYD-TD'],
  SIN: ['SIN-T1', 'SIN-T2', 'SIN-T3', 'SIN-T4', 'SIN-JEWEL'],
  LHR: ['LHR-T2', 'LHR-T3', 'LHR-T4', 'LHR-T5']
};

export function isValidTerminalCode(code: string): boolean {
  if (!code) return false;
  
  const upperCode = code.toUpperCase();
  
  // Check if it matches any valid terminal
  return Object.values(VALID_TERMINALS).flat().includes(upperCode);
}

export function getValidTerminals(): string[] {
  return Object.values(VALID_TERMINALS).flat();
}

export function getAirportFromTerminal(terminalCode: string): string {
  const upperCode = terminalCode.toUpperCase();
  const parts = upperCode.split('-');
  return parts[0] || '';
}

export function getTerminalNumber(terminalCode: string): string {
  const upperCode = terminalCode.toUpperCase();
  const parts = upperCode.split('-');
  return parts[1] || '';
}

export function formatTerminalCode(airport: string, terminal: string): string {
  return `${airport.toUpperCase()}-${terminal.toUpperCase()}`;
}

export function getTerminalName(terminalCode: string): string {
  const upperCode = terminalCode.toUpperCase();
  
  if (upperCode.includes('JEWEL')) {
    return 'Jewel';
  }
  
  const terminal = getTerminalNumber(upperCode);
  if (terminal.startsWith('T')) {
    return `Terminal ${terminal.substring(1)}`;
  }
  
  return terminal;
}
