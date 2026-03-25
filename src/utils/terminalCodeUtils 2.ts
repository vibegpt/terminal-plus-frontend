// =====================================================
// TERMINAL CODE UTILITIES
// Handles all terminal code formatting consistently
// =====================================================

export class TerminalCodeUtils {
  /**
   * Formats terminal code consistently
   * Handles: T1, SYD-T1, Terminal 1, t1, etc.
   * Always returns: AIRPORT-T# format (e.g., "SYD-T1")
   */
  static formatTerminalCode(airport: string, terminal: string): string {
    // Clean airport code
    const cleanAirport = airport.toUpperCase().trim();
    
    // Clean terminal - handle various formats
    let cleanTerminal = terminal.toUpperCase().trim();
    
    // Remove common prefixes
    cleanTerminal = cleanTerminal
      .replace(/^TERMINAL\s*/i, '')
      .replace(/^TERM\s*/i, '')
      .replace(/^T(?![\d])/i, '') // Remove T but not if followed by number
      .replace(/^GATE\s*/i, '')
      .trim();
    
    // Remove airport code if it's prefixed
    if (cleanTerminal.startsWith(cleanAirport + '-')) {
      cleanTerminal = cleanTerminal.substring(cleanAirport.length + 1);
    }
    if (cleanTerminal.startsWith(cleanAirport)) {
      cleanTerminal = cleanTerminal.substring(cleanAirport.length);
    }
    
    // Ensure T prefix for terminal number
    if (!cleanTerminal.startsWith('T') && !cleanTerminal.startsWith('JEWEL')) {
      cleanTerminal = 'T' + cleanTerminal;
    }
    
    // Special cases for specific airports
    if (cleanAirport === 'SIN' && cleanTerminal === 'TJEWEL') {
      cleanTerminal = 'JEWEL';
    }
    
    return `${cleanAirport}-${cleanTerminal}`;
  }
  
  /**
   * Extracts airport and terminal from various formats
   */
  static parseTerminalCode(code: string): { airport: string; terminal: string } {
    const cleanCode = code.toUpperCase().trim();
    
    // Try to split by hyphen first
    if (cleanCode.includes('-')) {
      const [airport, ...terminalParts] = cleanCode.split('-');
      return {
        airport: airport,
        terminal: terminalParts.join('-')
      };
    }
    
    // Try to extract airport code (usually 3 letters)
    const airportMatch = cleanCode.match(/^([A-Z]{3})/);
    if (airportMatch) {
      const airport = airportMatch[1];
      const terminal = cleanCode.substring(3).replace(/^[\s-]*/, '');
      return { airport, terminal: terminal || 'T1' };
    }
    
    // Default fallback
    return { airport: 'SYD', terminal: 'T1' };
  }
  
  /**
   * Get display-friendly terminal name
   */
  static getDisplayName(terminalCode: string): string {
    const { airport, terminal } = this.parseTerminalCode(terminalCode);
    
    // Special display names
    if (airport === 'SIN' && terminal === 'JEWEL') {
      return 'Jewel';
    }
    
    // Regular format
    return terminal.startsWith('T') ? `Terminal ${terminal.substring(1)}` : terminal;
  }
  
  /**
   * Validates if a terminal code is properly formatted
   */
  static isValidFormat(terminalCode: string): boolean {
    return /^[A-Z]{3}-[A-Z0-9]+$/.test(terminalCode);
  }
  
  /**
   * Get all possible variations of a terminal code for database queries
   */
  static getTerminalVariations(airport: string, terminal: string): string[] {
    const formatted = this.formatTerminalCode(airport, terminal);
    const { airport: a, terminal: t } = this.parseTerminalCode(formatted);
    
    return [
      formatted,                    // SYD-T1
      `${a} ${t}`,                 // SYD T1
      `${a}${t}`,                  // SYDT1
      t,                           // T1
      `${a}-${t.replace('T', '')}`, // SYD-1
      `${a} Terminal ${t.replace('T', '')}`, // SYD Terminal 1
    ];
  }
}
