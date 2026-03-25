// components/useVoiceEmotion.ts
import { useState, useEffect, useCallback, useRef } from 'react';

export interface EmotionResult {
  emotion: string;
  confidence: number;
  timestamp: Date;
}

export interface EmotionJourneyPoint {
  id: string;
  timestamp: Date;
  emotion: string;
  confidence: number;
  journeyPhase: 'departure' | 'transit' | 'arrival';
  location?: string;
  userValidated?: boolean;
}

export interface EmotionalInsights {
  dominantEmotion: string;
  averageConfidence: number;
  trend: 'improving' | 'declining' | 'stable';
  phaseBreakdown: Record<string, number>;
  suggestions: string[];
}

export interface EnhancedEmotionHook {
  // Existing capabilities
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  recording: boolean;
  emotionResult: EmotionResult | null;
  
  // New capabilities
  ambientListening: boolean;
  emotionHistory: EmotionJourneyPoint[];
  confidence: number;
  isCalibrating: boolean;
  isProcessing: boolean;
  recordingTime: number;
  recordingTimeRemaining: number;
  error: string | null;
  recordingComplete: boolean;
  
  // New methods
  startAmbientListening: () => Promise<void>;
  stopAmbientListening: () => void;
  validateEmotion: (correctedEmotion: string, energyLevel?: number, context?: string) => void;
  getEmotionalInsights: () => EmotionalInsights;
  clearEmotionHistory: () => void;
  addEmotionToHistory: (emotion: EmotionResult, journeyPhase?: string, location?: string) => void;
  resetRecordingState: () => void;
  handleEarlyStop: () => void;
  handleRecordingComplete: () => void;
}

export const useVoiceEmotion = (): EnhancedEmotionHook => {
  const [recording, setRecording] = useState(false);
  const [emotionResult, setEmotionResult] = useState<EmotionResult | null>(null);
  const [ambientListening, setAmbientListening] = useState(false);
  const [emotionHistory, setEmotionHistory] = useState<EmotionJourneyPoint[]>([]);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingTimeRemaining, setRecordingTimeRemaining] = useState(6);
  const [error, setError] = useState<string | null>(null);
  const [recordingComplete, setRecordingComplete] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const ambientIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mock emotion detection (TODO: Replace with real API)
  const detectEmotion = async (audioBlob: Blob): Promise<EmotionResult> => {
    console.log('🎭 MOCK EMOTION DETECTION - Using preset responses');
    console.log('📊 Audio blob size:', audioBlob.size, 'bytes');
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate audio analysis (in real implementation, this would analyze the actual audio)
    const audioSize = audioBlob.size;
    const hasAudio = audioSize > 1000; // Simulate detecting actual audio
    
    if (!hasAudio) {
      console.log('🎭 Mock: No audio detected, returning neutral');
      return {
        emotion: 'neutral',
        confidence: 0.5,
        timestamp: new Date()
      };
    }
    
    // More realistic emotion distribution with positive bias
    const emotions = [
      'excited', 'excited', 'excited',     // 30% excited
      'relaxed', 'relaxed', 'relaxed',     // 30% relaxed  
      'focused', 'focused',                // 20% focused
      'neutral', 'neutral',                // 15% neutral
      'stressed'                           // 5% stressed (rare)
    ];
    
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    
    // Higher confidence for positive emotions, lower for negative
    let randomConfidence = 0.7 + Math.random() * 0.3; // 70-100% confidence
    if (randomEmotion === 'stressed') {
      randomConfidence = 0.6 + Math.random() * 0.2; // Lower confidence for stressed
    }
    
    console.log('🎭 Mock: Random emotion selected:', randomEmotion, 'confidence:', randomConfidence);
    
    return {
      emotion: randomEmotion,
      confidence: randomConfidence,
      timestamp: new Date()
    };
  };

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        // First, show recording complete state
        setRecordingComplete(true);
        setRecording(false);
        setRecordingTime(0);
        setRecordingTimeRemaining(6);
        
        // Wait 1.5 seconds to show completion
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Then start processing
        setIsProcessing(true);
        setRecordingComplete(false);
        
        try {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          const result = await detectEmotion(audioBlob);
          setEmotionResult(result);
          setConfidence(result.confidence);
          
          // Add to history
          addEmotionToHistory(result);
        } catch (error) {
          setError('Failed to analyze emotion. Please try again.');
          console.error('Failed to analyze emotion:', error);
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setRecording(true);
      setRecordingTime(0);
      setRecordingTimeRemaining(6);

      // Start countdown timer
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 100);
        setRecordingTimeRemaining(prev => Math.max(0, prev - 0.1));
      }, 100);

      // Auto-stop after 6 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          clearInterval(timer);
        }
      }, 6000);

      // Store timer reference for cleanup
      mediaRecorderRef.current = mediaRecorder;
    } catch (error) {
      console.error('Failed to start recording:', error);
      setError('Could not access microphone. Please check permissions.');
      throw error;
    }
  }, []);

  // Stop recording
  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setRecording(false);
      setRecordingTime(0);
      setRecordingTimeRemaining(6);
    }
  }, [recording]);

  // Start ambient listening
  const startAmbientListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAmbientListening(true);
      
      // Initialize audio context for ambient analysis
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
      }
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      if (analyserRef.current) {
        source.connect(analyserRef.current);
      }
      
      // Start ambient emotion detection
      ambientIntervalRef.current = setInterval(async () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          
          // Simple audio level analysis for ambient detection
          const averageLevel = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          
          // If significant audio activity detected, trigger emotion detection
          if (averageLevel > 50 && !recording) {
            console.log('🔍 Ambient listening detected significant audio activity');
            // Could trigger a gentle notification here
          }
        }
      }, 5000); // Check every 5 seconds
      
    } catch (error) {
      console.error('Failed to start ambient listening:', error);
      throw error;
    }
  }, [recording]);

  // Stop ambient listening
  const stopAmbientListening = useCallback(() => {
    setAmbientListening(false);
    if (ambientIntervalRef.current) {
      clearInterval(ambientIntervalRef.current);
      ambientIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  // Add emotion to history
  const addEmotionToHistory = useCallback((emotion: EmotionResult, journeyPhase?: string, location?: string) => {
    const journeyPoint: EmotionJourneyPoint = {
      id: `emotion_${Date.now()}`,
      timestamp: emotion.timestamp,
      emotion: emotion.emotion,
      confidence: emotion.confidence,
      journeyPhase: journeyPhase as 'departure' | 'transit' | 'arrival' || 'transit',
      location,
      userValidated: undefined
    };
    
    setEmotionHistory(prev => [...prev, journeyPoint]);
  }, []);

  // Validate emotion (user correction)
  const validateEmotion = useCallback((correctedEmotion: string, energyLevel?: number, context?: string) => {
    if (emotionResult) {
      // Update the most recent emotion in history
      setEmotionHistory(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          const lastIndex = updated.length - 1;
          updated[lastIndex] = {
            ...updated[lastIndex],
            emotion: correctedEmotion,
            userValidated: true
          };
        }
        return updated;
      });
      
      // Update current emotion result
      setEmotionResult(prev => prev ? {
        ...prev,
        emotion: correctedEmotion,
        confidence: 1.0 // User validation gives 100% confidence
      } : null);
      
      // Save to backend (mock)
      console.log('💾 Saving emotion validation:', {
        original: emotionResult.emotion,
        corrected: correctedEmotion,
        energyLevel,
        context
      });
    }
    
    setIsCalibrating(false);
  }, [emotionResult]);

  // Get emotional insights
  const getEmotionalInsights = useCallback((): EmotionalInsights => {
    if (emotionHistory.length === 0) {
      return {
        dominantEmotion: 'none',
        averageConfidence: 0,
        trend: 'stable',
        phaseBreakdown: {},
        suggestions: ['Start recording emotions to get insights']
      };
    }

    // Calculate dominant emotion
    const emotionCounts = emotionHistory.reduce((acc, emotion) => {
      acc[emotion.emotion] = (acc[emotion.emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const dominantEmotion = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)[0][0];

    // Calculate average confidence
    const averageConfidence = emotionHistory.reduce((sum, emotion) => sum + emotion.confidence, 0) / emotionHistory.length;

    // Calculate trend
    const sortedEmotions = [...emotionHistory].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const firstHalf = sortedEmotions.slice(0, Math.ceil(sortedEmotions.length / 2));
    const secondHalf = sortedEmotions.slice(Math.ceil(sortedEmotions.length / 2));
    
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (secondHalf.length > 0) {
      const firstAvg = firstHalf.reduce((sum, e) => sum + e.confidence, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, e) => sum + e.confidence, 0) / secondHalf.length;
      
      if (secondAvg > firstAvg + 0.1) trend = 'improving';
      else if (secondAvg < firstAvg - 0.1) trend = 'declining';
    }

    // Phase breakdown
    const phaseBreakdown = emotionHistory.reduce((acc, emotion) => {
      acc[emotion.journeyPhase] = (acc[emotion.journeyPhase] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Generate suggestions
    const suggestions: string[] = [];
    if (trend === 'declining') {
      suggestions.push('Consider finding a quiet space to relax');
    }
    if (dominantEmotion === 'stressed') {
      suggestions.push('Try some deep breathing exercises');
    }
    if (averageConfidence < 0.7) {
      suggestions.push('Help us improve by validating your emotions');
    }

    return {
      dominantEmotion,
      averageConfidence,
      trend,
      phaseBreakdown,
      suggestions
    };
  }, [emotionHistory]);

  // Clear emotion history
  const clearEmotionHistory = useCallback(() => {
    setEmotionHistory([]);
  }, []);

  // Reset recording state
  const resetRecordingState = useCallback(() => {
    setRecording(false);
    setIsProcessing(false);
    setRecordingTime(0);
    setRecordingTimeRemaining(6);
    setError(null);
  }, []);

  // Handle early stop
  const handleEarlyStop = useCallback(() => {
    if (recording && recordingTime >= 2000) { // Minimum 2 seconds
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    } else if (recording && recordingTime < 2000) {
      // Show error for too short recording
      setError('Please record for at least 2 seconds');
      setTimeout(() => setError(null), 3000);
    }
  }, [recording, recordingTime]);

  // Handle recording complete
  const handleRecordingComplete = useCallback(() => {
    setRecordingComplete(true);
    // Optionally, you might want to reset recording state or show a final result
    // For now, we'll just set it to true.
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ambientIntervalRef.current) {
        clearInterval(ambientIntervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    startRecording,
    stopRecording,
    recording,
    emotionResult,
    ambientListening,
    emotionHistory,
    confidence,
    isCalibrating,
    isProcessing,
    recordingTime,
    recordingTimeRemaining,
    error,
    recordingComplete,
    startAmbientListening,
    stopAmbientListening,
    validateEmotion,
    getEmotionalInsights,
    clearEmotionHistory,
    addEmotionToHistory,
    resetRecordingState,
    handleEarlyStop,
    handleRecordingComplete
  };
}; 