// Global type declarations
declare global {
  interface Window {
    gtag?: (
      command: 'event',
      action: string,
      parameters: Record<string, any>
    ) => void;
  }
}

export {};
