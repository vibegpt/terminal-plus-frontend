import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Heart, Zap, Coffee, Clock, X, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceEmotion } from '@/hooks/useVoiceEmotion';
import { useVibeColors } from '@/hooks/useVibeColors';

interface EmotionCaptureInterfaceProps {
  onEmotionDetected?: (emotion: any) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

const EmotionCaptureInterface: React.FC<EmotionCaptureInterfaceProps> = ({
  onEmotionDetected,
  onRecordingStart,
  onRecordingStop,
  onError,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isBreathing, setIsBreathing] = useState(false);
  const [ambientListening, setAmbientListening] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [showTooltip, setShowTooltip] = useState(false);
  
  const { 
    startRecording, 
    stopRecording, 
    recording, 
    emotionResult, 
    isProcessing, 
    recordingTimeRemaining, 
    recordingTime,
    error,
    recordingComplete,
    handleEarlyStop 
  } = useVoiceEmotion();
  const { getVibeColor } = useVibeColors();
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  // Breathing animation effect
  useEffect(() => {
    if (ambientListening) {
      setIsBreathing(true);
      const interval = setInterval(() => {
        setIsBreathing(prev => !prev);
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setIsBreathing(false);
    }
  }, [ambientListening]);

  // Show tooltip for first-time users
  useEffect(() => {
    if (isVisible && !recording && !emotionResult) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowTooltip(false);
    }
  }, [isVisible, recording, emotionResult]);

  // Initialize audio context for waveform
  const initializeAudioContext = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
      }
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  };

  // Update waveform visualization
  const updateWaveform = () => {
    if (analyserRef.current && recording) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteTimeDomainData(dataArray);
      
      const waveform = Array.from(dataArray).slice(0, 64);
      setWaveformData(waveform);
      
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    }
  };

  // Start ambient listening
  const startAmbientListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAmbientListening(true);
      setPermissionStatus('granted');
      
      // Initialize audio context
      await initializeAudioContext();
      
      if (audioContextRef.current && analyserRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
      }
    } catch (error) {
      console.error('Failed to start ambient listening:', error);
      setPermissionStatus('denied');
    }
  };

  // Stop ambient listening
  const stopAmbientListening = () => {
    setAmbientListening(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // Handle recording start
  const handleStartRecording = async () => {
    try {
      onRecordingStart?.();
      await startRecording();
      updateWaveform();
      triggerHapticFeedback('recording');
    } catch (error) {
      console.error('Failed to start recording:', error);
      onError?.('Could not start recording. Please check microphone permissions.');
    }
  };

  // Handle recording stop
  const handleStopRecording = async () => {
    try {
      await stopRecording();
      onRecordingStop?.();
      setWaveformData([]);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      triggerHapticFeedback('success');
      
      // Show celebration animation
      setTimeout(() => {
        if (emotionResult) {
          onEmotionDetected?.(emotionResult);
        }
      }, 500);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      onError?.('Failed to stop recording.');
    }
  };

  // Handle permission request
  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionStatus('granted');
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      setPermissionStatus('denied');
    }
  };

  // Haptic feedback
  const triggerHapticFeedback = (pattern: 'success' | 'error' | 'recording') => {
    if ('vibrate' in navigator) {
      switch (pattern) {
        case 'success':
          navigator.vibrate([100, 50, 100]);
          break;
        case 'error':
          navigator.vibrate([200, 100, 200]);
          break;
        case 'recording':
          navigator.vibrate([50, 50, 50, 50, 50]);
          break;
      }
    }
  };

  // Get emotion color
  const getEmotionColor = () => {
    if (emotionResult?.emotion) {
      return getVibeColor(emotionResult.emotion);
    }
    return 'bg-blue-500';
  };

  // Get emotion icon
  const getEmotionIcon = () => {
    if (isProcessing) return <Activity className="w-6 h-6 animate-spin" />;
    if (recording) return <Mic className="w-6 h-6" />;
    if (emotionResult?.emotion) {
      switch (emotionResult.emotion) {
        case 'excited':
          return <Zap className="w-6 h-6" />;
        case 'relaxed':
          return <Heart className="w-6 h-6" />;
        case 'focused':
          return <Coffee className="w-6 h-6" />;
        default:
          return <Mic className="w-6 h-6" />;
      }
    }
    return <Mic className="w-6 h-6" />;
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="relative"
          >
            {/* Permission Request */}
            {permissionStatus === 'prompt' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-16 right-0 bg-white rounded-lg shadow-lg p-4 w-64"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <Mic className="w-5 h-5 text-blue-500" />
                  <span className="font-medium text-gray-900">Voice Emotion Detection</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Help us understand your mood to provide better recommendations. We only listen when you tap the button.
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={requestPermission}
                    className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                  >
                    Allow
                  </button>
                  <button
                    onClick={() => setIsVisible(false)}
                    className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                  >
                    Later
                  </button>
                </div>
              </motion.div>
            )}

            {/* First-time User Tooltip */}
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-32 right-4 bg-blue-50 border border-blue-200 rounded-lg p-4 w-64 shadow-lg max-w-[calc(100vw-2rem)] z-50"
                style={{
                  maxWidth: 'min(16rem, calc(100vw - 2rem))',
                  zIndex: 1000
                }}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Mic className="w-4 h-4 text-blue-500" />
                  <span className="font-medium text-blue-900">Quick Voice Check</span>
                </div>
                <p className="text-sm text-blue-700 mb-2">
                  Tap to start a 6-second voice check to understand your mood.
                </p>
                <p className="text-xs text-blue-600">
                  Try saying: "I'm feeling pretty good" or "This airport is stressful"
                </p>
              </motion.div>
            )}

            {/* Main Floating Button */}
            <motion.button
              data-emotion-button
              onClick={recording ? handleEarlyStop : handleStartRecording}
              disabled={permissionStatus === 'denied' || isProcessing || recordingComplete}
              className={`
                relative w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-white font-medium
                ${recording ? 'bg-red-500 hover:bg-red-600' : 
                  isProcessing ? 'bg-purple-500' : 
                  recordingComplete ? 'bg-green-500' :
                  emotionResult ? 'bg-green-500' : getEmotionColor()}
                ${permissionStatus === 'denied' ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                ${isProcessing || recordingComplete ? 'cursor-not-allowed' : ''}
                transition-all duration-200
              `}
              animate={{
                scale: recording ? [1, 1.05, 1] : isBreathing ? [1, 1.1, 1] : 1,
                boxShadow: recording 
                  ? '0 0 25px rgba(239, 68, 68, 0.6)' 
                  : isProcessing
                    ? '0 0 25px rgba(139, 92, 246, 0.6)'
                    : recordingComplete
                      ? '0 0 25px rgba(16, 185, 129, 0.6)'
                      : emotionResult
                        ? '0 0 25px rgba(16, 185, 129, 0.6)'
                        : isBreathing 
                          ? '0 0 20px rgba(59, 130, 246, 0.5)' 
                          : '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
              transition={{
                scale: { duration: 1, repeat: Infinity, ease: "easeInOut" },
                boxShadow: { duration: 1, repeat: Infinity, ease: "easeInOut" }
              }}
            >
              {recording ? (
                <Mic className="w-6 h-6" />
              ) : isProcessing ? (
                <Activity className="w-6 h-6 animate-spin" />
              ) : recordingComplete ? (
                <div className="text-2xl">✅</div>
              ) : emotionResult ? (
                <div className="text-2xl">✅</div>
              ) : (
                getEmotionIcon()
              )}
              
              {/* Recording Progress Ring */}
              {recording && (
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-white border-opacity-30"
                  style={{
                    background: `conic-gradient(from 0deg, white ${(6 - recordingTimeRemaining) / 6 * 360}deg, transparent ${(6 - recordingTimeRemaining) / 6 * 360}deg)`
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.button>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-32 right-4 bg-red-500 rounded-lg shadow-lg p-4 min-w-48 z-50"
                style={{
                  maxWidth: 'min(20rem, calc(100vw - 2rem))',
                  zIndex: 1000
                }}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">⚠️</div>
                  <div className="text-lg font-bold text-white mb-2">
                    {error}
                  </div>
                  <div className="text-sm text-red-100">
                    Please try again
                  </div>
                </div>
              </motion.div>
            )}

            {/* Prominent Countdown Timer */}
            {recording && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="fixed bottom-32 right-4 bg-white rounded-lg shadow-lg p-4 min-w-48 z-50 border-2 border-red-500"
                style={{
                  maxWidth: 'min(20rem, calc(100vw - 2rem))',
                  zIndex: 1000
                }}
              >
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    Recording... {Math.ceil(recordingTimeRemaining)}
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    Speak naturally about how you're feeling
                  </div>
                  
                  {/* Waveform Visualization */}
                  <div className="flex items-end space-x-1 h-12 mb-2 justify-center">
                    {waveformData.slice(0, 16).map((value, index) => (
                      <motion.div
                        key={index}
                        className="bg-red-500 rounded-sm"
                        style={{
                          width: '3px',
                          height: `${(value / 255) * 40 + 4}px`
                        }}
                        animate={{
                          height: `${(value / 255) * 40 + 4}px`
                        }}
                        transition={{ duration: 0.1 }}
                      />
                    ))}
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm font-medium text-red-600">
                      {recordingTime < 2000 ? 
                        `Keep recording... (${Math.ceil((2000 - recordingTime) / 1000)}s more)` : 
                        'Tap to stop early'
                      }
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Recording Complete State */}
            {recordingComplete && !isProcessing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="fixed bottom-32 right-4 bg-green-500 rounded-lg shadow-lg p-4 min-w-48 z-50"
                style={{
                  maxWidth: 'min(20rem, calc(100vw - 2rem))',
                  zIndex: 1000
                }}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">✅</div>
                  <div className="text-xl font-bold text-white mb-2">
                    Recording Complete!
                  </div>
                  <div className="text-sm text-green-100">
                    Analyzing your voice...
                  </div>
                </div>
              </motion.div>
            )}

            {/* Processing State */}
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="fixed bottom-32 right-4 bg-purple-500 rounded-lg shadow-lg p-4 min-w-48 z-50"
                style={{
                  maxWidth: 'min(20rem, calc(100vw - 2rem))',
                  zIndex: 1000
                }}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2 animate-spin">🧠</div>
                  <div className="text-xl font-bold text-white mb-2">
                    Understanding your mood...
                  </div>
                  <div className="text-sm text-purple-100">
                    This will just take a moment
                  </div>
                </div>
              </motion.div>
            )}

            {/* Emotion Result Celebration */}
            {emotionResult && !recording && !isProcessing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                className="fixed bottom-32 right-4 bg-white rounded-lg shadow-lg p-4 min-w-48 z-50 border-2 border-green-500"
                style={{
                  maxWidth: 'min(20rem, calc(100vw - 2rem))',
                  zIndex: 1000
                }}
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">
                    {emotionResult.emotion === 'excited' ? '⚡' :
                     emotionResult.emotion === 'relaxed' ? '😌' :
                     emotionResult.emotion === 'focused' ? '🎯' :
                     emotionResult.emotion === 'neutral' ? '😐' : '😰'}
                  </div>
                  <div className="text-xl font-bold text-gray-900 mb-2 capitalize">
                    Got it! You seem {emotionResult.emotion}
                  </div>
                  <div className="text-sm text-gray-600">
                    {Math.round(emotionResult.confidence * 100)}% confidence
                  </div>
                </div>
              </motion.div>
            )}

            {/* State Indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed bottom-2 right-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded-lg text-sm font-medium z-50"
            >
              {recording ? (
                <span className="text-red-300">Recording...</span>
              ) : recordingComplete ? (
                <span className="text-green-300">Complete!</span>
              ) : isProcessing ? (
                <span className="text-purple-300">Processing...</span>
              ) : emotionResult ? (
                <span className="text-green-300">Done!</span>
              ) : (
                <span className="text-blue-300">Ready</span>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show/Hide Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="absolute -top-2 -right-2 w-6 h-6 bg-gray-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-gray-600 transition-colors"
      >
        {isVisible ? <X className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
      </button>
    </div>
  );
};

export default EmotionCaptureInterface; 