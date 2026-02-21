// Voice interface types for Terminal+

import type { Vibe } from './common.types';

// Voice command types
export type VoiceCommandType = 'navigation' | 'search' | 'vibe' | 'system' | 'unknown';

export type VoiceAction = 
  | 'explore' 
  | 'search_amenities' 
  | 'show_map' 
  | 'set_vibe' 
  | 'help' 
  | 'unknown';

// Voice state types
export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

// Voice response types
export type VoiceResponseType = 'success' | 'error' | 'info' | 'warning';

// Voice command interface
export interface VoiceCommand {
  type: VoiceCommandType;
  action: VoiceAction;
  confidence: number; // 0-1
  parameters: Record<string, any>;
  timestamp: Date;
  metadata?: {
    transcript?: string;
    alternatives?: string[];
    language?: string;
    duration?: number;
  };
}

// Voice response interface
export interface VoiceResponse {
  id: string;
  text: string;
  command: VoiceCommand;
  timestamp: Date;
  type: VoiceResponseType;
  metadata?: {
    audioUrl?: string;
    duration?: number;
    language?: string;
    voice?: string;
  };
}

// Audio configuration interface
export interface AudioConfig {
  volume: number; // 0-1
  rate: number; // 0.1-10
  pitch: number; // 0-2
  voice: string;
  language?: string;
  quality?: 'low' | 'medium' | 'high';
}

// Speech recognition result interface
export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  alternatives?: Array<{
    transcript: string;
    confidence: number;
  }>;
  timestamp: Date;
}

// Voice command mapping
export interface VoiceCommandMapping {
  pattern: string | RegExp;
  command: VoiceCommand;
  aliases?: string[];
  examples?: string[];
  description?: string;
}

// Voice command category
export interface VoiceCommandCategory {
  name: string;
  description: string;
  commands: VoiceCommandMapping[];
  icon?: string;
  color?: string;
}

// Voice interface configuration
export interface VoiceInterfaceConfig {
  enabled: boolean;
  autoStart: boolean;
  showVisualizer: boolean;
  continuous: boolean;
  interimResults: boolean;
  language: string;
  commands: VoiceCommandMapping[];
  responses: Record<string, string>;
  audioConfig: AudioConfig;
  privacy: {
    storeTranscripts: boolean;
    shareData: boolean;
    anonymizeData: boolean;
  };
}

// Voice analytics
export interface VoiceAnalytics {
  totalCommands: number;
  successfulCommands: number;
  failedCommands: number;
  averageConfidence: number;
  mostUsedCommands: Array<{
    command: string;
    count: number;
    successRate: number;
  }>;
  averageResponseTime: number;
  languageDistribution: Record<string, number>;
  deviceTypes: Record<string, number>;
}

// Voice session
export interface VoiceSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  commands: VoiceCommand[];
  responses: VoiceResponse[];
  analytics: {
    totalCommands: number;
    averageConfidence: number;
    successRate: number;
  };
  metadata?: {
    deviceType?: string;
    browser?: string;
    location?: string;
  };
}

// Voice error
export interface VoiceError {
  code: string;
  message: string;
  type: 'recognition' | 'synthesis' | 'network' | 'permission' | 'unknown';
  timestamp: Date;
  recoverable: boolean;
  suggestions?: string[];
}

// Voice notification
export interface VoiceNotification {
  id: string;
  type: 'command' | 'response' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

// Voice export data
export interface VoiceExportData {
  sessions: VoiceSession[];
  commands: VoiceCommand[];
  responses: VoiceResponse[];
  analytics: VoiceAnalytics;
  exportDate: Date;
  exportFormat: 'json' | 'csv' | 'pdf';
  privacyLevel: 'full' | 'anonymized' | 'aggregated';
}

// Voice API response
export interface VoiceApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  confidence?: number;
  processingTime?: number;
}

// Voice API error
export interface VoiceApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  retryable: boolean;
}

// Voice command processor
export interface VoiceCommandProcessor {
  processCommand: (transcript: string) => VoiceCommand | null;
  getConfidence: (transcript: string, command: VoiceCommand) => number;
  generateResponse: (command: VoiceCommand) => VoiceResponse;
  validateCommand: (command: VoiceCommand) => boolean;
}

// Voice synthesis interface
export interface VoiceSynthesis {
  speak: (text: string, config?: AudioConfig) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  getVoices: () => SpeechSynthesisVoice[];
  setVoice: (voice: SpeechSynthesisVoice) => void;
}

// Voice recognition interface
export interface VoiceRecognition {
  start: () => Promise<void>;
  stop: () => void;
  isListening: () => boolean;
  onResult: (callback: (result: SpeechRecognitionResult) => void) => void;
  onError: (callback: (error: VoiceError) => void) => void;
  onStateChange: (callback: (state: VoiceState) => void) => void;
}

// Voice command suggestions
export interface VoiceCommandSuggestion {
  id: string;
  command: string;
  description: string;
  category: string;
  confidence: number;
  examples: string[];
  icon?: string;
}

// Voice command history
export interface VoiceCommandHistory {
  id: string;
  userId: string;
  commands: VoiceCommand[];
  responses: VoiceResponse[];
  sessionDuration: number;
  startTime: Date;
  endTime: Date;
  analytics: {
    totalCommands: number;
    successRate: number;
    averageConfidence: number;
    mostUsedAction: string;
  };
}

// Voice interface state
export interface VoiceInterfaceState {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  currentCommand: string;
  confidence: number;
  error: string | null;
  audioLevel: number;
  voiceState: VoiceState;
  commandHistory: VoiceCommand[];
  responseHistory: VoiceResponse[];
  audioConfig: AudioConfig;
}

// Voice command context
export interface VoiceCommandContext {
  location?: string;
  timeOfDay?: string;
  userPreferences?: Record<string, any>;
  recentCommands?: VoiceCommand[];
  currentVibe?: Vibe;
  availableAmenities?: string[];
}

// Voice command validation
export interface VoiceCommandValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  confidence: number;
  alternatives?: VoiceCommand[];
}

// Voice command execution
export interface VoiceCommandExecution {
  command: VoiceCommand;
  response: VoiceResponse;
  executionTime: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

// Utility types for voice features
export type VoiceFeature = 'recognition' | 'synthesis' | 'commands' | 'analytics' | 'notifications';

export type VoiceQuality = 'low' | 'medium' | 'high';

export type VoiceLanguage = 'en-US' | 'en-GB' | 'es-ES' | 'fr-FR' | 'de-DE' | 'it-IT' | 'pt-BR' | 'ja-JP' | 'ko-KR' | 'zh-CN';

export type VoiceDeviceType = 'mobile' | 'desktop' | 'tablet' | 'smartwatch' | 'headphones';

// Voice command patterns
export const VOICE_COMMAND_PATTERNS = {
  EXPLORE: /explore|discover|find|search/i,
  FOOD: /food|eat|hungry|restaurant|cafe|coffee/i,
  MAP: /map|show map|where|location/i,
  VIBE: /vibe|mood|chill|work|relax/i,
  HELP: /help|assist|support|what can you do/i
} as const;

// Voice response templates
export const VOICE_RESPONSE_TEMPLATES = {
  EXPLORE: "I'll help you explore the terminal. What are you looking for?",
  FOOD: "I found several food options nearby. Let me show you the best ones.",
  MAP: "Opening the terminal map for you.",
  VIBE_CHILL: "Setting chill vibe mode. I'll find relaxing spots for you.",
  VIBE_WORK: "Switching to work mode. I'll find quiet spaces with good connectivity.",
  HELP: "I can help you explore, find food, show the map, or set your vibe. What would you like to do?",
  UNKNOWN: "I didn't catch that. Could you please repeat your request?",
  ERROR: "Sorry, I encountered an error. Please try again."
} as const; 