import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Settings,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Headphones,
  MessageSquare,
  Zap,
  Brain,
  Target
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import type { 
  VoiceCommand, 
  VoiceResponse, 
  VoiceState, 
  AudioConfig,
  SpeechRecognitionResult
} from '@/types/voice.types';

interface VoiceInterfaceProps {
  onCommandReceived: (command: VoiceCommand) => void;
  onVoiceResponse: (response: VoiceResponse) => void;
  enabled?: boolean;
  autoStart?: boolean;
  showVisualizer?: boolean;
  className?: string;
}

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  onCommandReceived,
  onVoiceResponse,
  enabled = true,
  autoStart = false,
  showVisualizer = true,
  className = ''
}) => {
  const { theme } = useTheme();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentCommand, setCurrentCommand] = useState<string>('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [commandHistory, setCommandHistory] = useState<VoiceCommand[]>([]);
  const [responseHistory, setResponseHistory] = useState<VoiceResponse[]>([]);
  const [audioConfig, setAudioConfig] = useState<AudioConfig>({
    volume: 0.8,
    rate: 1.0,
    pitch: 1.0,
    voice: 'default'
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Voice commands mapping
  const voiceCommands: Record<string, VoiceCommand> = {
    'explore': {
      type: 'navigation',
      action: 'explore',
      confidence: 0.9,
      parameters: {},
      timestamp: new Date()
    },
    'find food': {
      type: 'search',
      action: 'search_amenities',
      confidence: 0.9,
      parameters: { category: 'food' },
      timestamp: new Date()
    },
    'show map': {
      type: 'navigation',
      action: 'show_map',
      confidence: 0.9,
      parameters: {},
      timestamp: new Date()
    },
    'chill vibe': {
      type: 'vibe',
      action: 'set_vibe',
      confidence: 0.9,
      parameters: { vibe: 'chill' },
      timestamp: new Date()
    },
    'work mode': {
      type: 'vibe',
      action: 'set_vibe',
      confidence: 0.9,
      parameters: { vibe: 'work' },
      timestamp: new Date()
    },
    'quick bite': {
      type: 'search',
      action: 'search_amenities',
      confidence: 0.9,
      parameters: { category: 'food', vibe: 'quick' },
      timestamp: new Date()
    },
    'help': {
      type: 'system',
      action: 'help',
      confidence: 0.9,
      parameters: {},
      timestamp: new Date()
    }
  };

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceState('listening');
        setError(null);
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence;

          if (event.results[i].isFinal) {
            finalTranscript += transcript;
            setConfidence(confidence * 100);
          } else {
            interimTranscript += transcript;
          }
        }

        setCurrentCommand(finalTranscript || interimTranscript);

        if (finalTranscript) {
          processVoiceCommand(finalTranscript.toLowerCase());
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
        setVoiceState('error');
      };

      recognition.onend = () => {
        setIsListening(false);
        setVoiceState('idle');
      };
    } else {
      setError('Speech recognition not supported in this browser');
    }

    // Initialize speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis;
    }

    // Initialize audio context for visualization
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      audioContextRef.current = new AudioContext();
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && enabled && !isListening) {
      startListening();
    }
  }, [autoStart, enabled, isListening]);

  const startListening = useCallback(async () => {
    try {
      if (!recognitionRef.current) {
        setError('Speech recognition not available');
        return;
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio visualization
      if (audioContextRef.current && showVisualizer) {
        const audioContext = audioContextRef.current;
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        
        analyser.fftSize = 256;
        microphone.connect(analyser);
        
        analyserRef.current = analyser;
        microphoneRef.current = microphone;
        
        updateAudioVisualization();
      }

      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setError('Failed to access microphone');
    }
  }, [showVisualizer]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setAudioLevel(0);
  }, []);

  const updateAudioVisualization = useCallback(() => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    // Calculate average audio level
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    setAudioLevel(average);

    animationFrameRef.current = requestAnimationFrame(updateAudioVisualization);
  }, []);

  const processVoiceCommand = useCallback((transcript: string) => {
    setIsProcessing(true);
    setVoiceState('processing');

    // Simulate processing delay
    setTimeout(() => {
      let bestMatch: VoiceCommand | null = null;
      let bestConfidence = 0;

      // Find the best matching command
      Object.entries(voiceCommands).forEach(([key, command]) => {
        if (transcript.includes(key)) {
          const matchConfidence = transcript.includes(key) ? 0.9 : 0.5;
          if (matchConfidence > bestConfidence) {
            bestMatch = { ...command, confidence: matchConfidence };
            bestConfidence = matchConfidence;
          }
        }
      });

      if (bestMatch) {
        const command: VoiceCommand = {
          ...bestMatch,
          timestamp: new Date()
        };

        setCommandHistory(prev => [command, ...prev.slice(0, 9)]);
        onCommandReceived(command);

        // Generate voice response
        const response = generateVoiceResponse(command);
        setResponseHistory(prev => [response, ...prev.slice(0, 9)]);
        onVoiceResponse(response);

        // Speak the response
        speakResponse(response.text);
      } else {
        const unknownCommand: VoiceCommand = {
          type: 'unknown',
          action: 'unknown',
          confidence: 0.3,
          parameters: {},
          timestamp: new Date()
        };
        setCommandHistory(prev => [unknownCommand, ...prev.slice(0, 9)]);
        
        const response = generateVoiceResponse(unknownCommand);
        speakResponse(response.text);
      }

      setIsProcessing(false);
      setVoiceState('idle');
      setCurrentCommand('');
    }, 1000);
  }, [onCommandReceived, onVoiceResponse]);

  const generateVoiceResponse = useCallback((command: VoiceCommand): VoiceResponse => {
    const responses: Record<string, string> = {
      'explore': "I'll help you explore the terminal. What are you looking for?",
      'find food': "I found several food options nearby. Let me show you the best ones.",
      'show map': "Opening the terminal map for you.",
      'chill vibe': "Setting chill vibe mode. I'll find relaxing spots for you.",
      'work mode': "Switching to work mode. I'll find quiet spaces with good connectivity.",
      'quick bite': "I found some quick food options. Here are the nearest ones.",
      'help': "I can help you explore, find food, show the map, or set your vibe. What would you like to do?",
      'unknown': "I didn't catch that. Could you please repeat your request?"
    };

    return {
      id: `response_${Date.now()}`,
      text: responses[command.action] || responses['unknown'],
      command: command,
      timestamp: new Date(),
      type: command.type === 'unknown' ? 'error' : 'success'
    };
  }, []);

  const speakResponse = useCallback((text: string) => {
    if (!synthesisRef.current) return;

    setIsSpeaking(true);
    setVoiceState('speaking');

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = audioConfig.volume;
    utterance.rate = audioConfig.rate;
    utterance.pitch = audioConfig.pitch;

    utterance.onend = () => {
      setIsSpeaking(false);
      setVoiceState('idle');
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      setVoiceState('error');
    };

    synthesisRef.current.speak(utterance);
  }, [audioConfig]);

  const getVoiceStateColor = (state: VoiceState) => {
    const colors = {
      idle: 'bg-gray-100 text-gray-800 border-gray-200',
      listening: 'bg-blue-100 text-blue-800 border-blue-200',
      processing: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      speaking: 'bg-green-100 text-green-800 border-green-200',
      error: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[state] || colors.idle;
  };

  const getVoiceStateIcon = (state: VoiceState) => {
    switch (state) {
      case 'listening':
        return <Mic className="w-5 h-5 animate-pulse" />;
      case 'processing':
        return <Brain className="w-5 h-5 animate-spin" />;
      case 'speaking':
        return <Volume2 className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Mic className="w-5 h-5" />;
    }
  };

  if (!enabled) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Voice Interface Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Headphones className="w-5 h-5" />
            <span>Voice Assistant</span>
            <Badge variant="outline" className={getVoiceStateColor(voiceState)}>
              {getVoiceStateIcon(voiceState)}
              <span className="ml-1 capitalize">{voiceState}</span>
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Voice Controls */}
          <div className="flex items-center space-x-3">
            <Button
              onClick={isListening ? stopListening : startListening}
              variant={isListening ? "destructive" : "default"}
              disabled={isProcessing || isSpeaking}
              className="flex-1"
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4 mr-2" />
                  Stop Listening
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  Start Listening
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAudioConfig(prev => ({ ...prev, volume: prev.volume > 0 ? 0 : 0.8 }))}
            >
              {audioConfig.volume > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          </div>

          {/* Audio Visualizer */}
          {showVisualizer && isListening && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Audio Level</span>
                <span className="text-sm">{Math.round(audioLevel)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-100"
                  style={{ width: `${audioLevel}%` }}
                />
              </div>
            </div>
          )}

          {/* Current Command Display */}
          {currentCommand && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <MessageSquare className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">Heard:</span>
              </div>
              <p className="text-sm text-gray-700">{currentCommand}</p>
              {confidence > 0 && (
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-xs text-gray-500">Confidence:</span>
                  <Progress value={confidence} className="w-20 h-1" />
                  <span className="text-xs text-gray-500">{confidence.toFixed(0)}%</span>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Brain className="w-4 h-4 animate-spin" />
              <span>Processing your request...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Command History */}
      {commandHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Recent Commands</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {commandHistory.slice(0, 5).map((command, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">{command.action}</span>
                    <Badge variant="outline" className="text-xs">
                      {command.type}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500">
                    {command.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voice Commands Help */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>Voice Commands</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(voiceCommands).map(([key, command]) => (
              <div key={key} className="p-2 bg-gray-50 rounded">
                <div className="font-medium text-sm">"{key}"</div>
                <div className="text-xs text-gray-600">{command.action}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 