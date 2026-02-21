// Terminal lookup map by airport and airline code
export const terminalLookup: Record<string, Record<string, string>> = {
  // Sydney Airport
  "SYD": {
    "QF": "T1", // Qantas
    "JQ": "T2", // Jetstar
    "VA": "T2", // Virgin Australia
    "TT": "T2", // TigerAir
    "SQ": "T1", // Singapore Airlines
    "EK": "T1", // Emirates
    "CX": "T1", // Cathay Pacific
    "QR": "T1", // Qatar Airways
    "MH": "T1", // Malaysia Airlines
  },
  // Singapore Changi Airport
  "SIN": {
    "SQ": "T3", // Singapore Airlines
    "MI": "T2", // SilkAir
    "TR": "T2", // Scoot
    "QF": "T1", // Qantas
    "BA": "T1", // British Airways
    "EK": "T3", // Emirates
    "CX": "T4", // Cathay Pacific
    "KA": "T4", // Cathay Dragon
    "TG": "T1", // Thai Airways
  },
  // London Heathrow
  "LHR": {
    "BA": "T5", // British Airways
    "IB": "T5", // Iberia
    "QF": "T3", // Qantas
    "EK": "T3", // Emirates
    "QR": "T4", // Qatar Airways
    "SQ": "T2", // Singapore Airlines
    "AA": "T3", // American Airlines
    "UA": "T2", // United Airlines
    "LH": "T2", // Lufthansa
  },
  // Default fallback for any airport
  "DEFAULT": {
    "SQ": "T3", // Singapore Airlines (common default)
    "QF": "T1", // Qantas
    "BA": "T5", // British Airways (for LHR)
    "EK": "T3", // Emirates
  }
};

/**
 * Resolve terminal based on airline code and airport
 */
export function resolveTerminal({ 
  airport, 
  flightNumber 
}: { 
  airport: string, 
  flightNumber?: string 
}): string {
  if (!flightNumber) return "T1"; // Default if missing
  
  const airlineCode = flightNumber.slice(0, 2).toUpperCase();
  
  // Try airport-specific lookup
  if (terminalLookup[airport]?.[airlineCode]) {
    return terminalLookup[airport][airlineCode];
  }
  
  // Fallback to DEFAULT lookup
  if (terminalLookup.DEFAULT[airlineCode]) {
    return terminalLookup.DEFAULT[airlineCode];
  }
  
  return "T1"; // Ultimate fallback
}

// Alias for backwards compatibility
export const guessTerminal = resolveTerminal;

/**
 * Check if a flight is likely a transit or self-transfer
 */
export async function checkTransitOrSelfTransfer(flightNumber: string): Promise<"transit" | "self-transfer" | "none"> {
  // Mock simple check for demo purposes
  const scheduledTransitFlights = ["QF1", "BA16", "SQ308"]; // Scheduled transit flights (e.g. SYD-SIN-LHR)
  const selfTransferFlights = ["EK405", "QR908", "TK23"]; // Example where user likely self-transfer (different airlines)

  if (selfTransferFlights.includes(flightNumber.toUpperCase())) {
    return "self-transfer";
  }
  if (scheduledTransitFlights.includes(flightNumber.toUpperCase())) {
    return "transit";
  }
  return "none";
}