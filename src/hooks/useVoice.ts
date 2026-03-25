import { useCallback, useEffect, useRef, useState } from 'react';

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'unavailable';

interface UseVoiceOptions {
  onTranscript: (text: string) => void;
  ttsEnabled?: boolean;
  lang?: string;
  maxDuration?: number;
}

export interface UseVoiceReturn {
  status: VoiceStatus;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  ttsEnabled: boolean;
  setTtsEnabled: (v: boolean) => void;
  supported: boolean;
}

const SpeechRecognitionCtor =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : undefined;

const synthSupported =
  typeof window !== 'undefined' && 'speechSynthesis' in window;

function pickVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | undefined {
  const langLower = lang.toLowerCase();
  const exact = voices.find((v) => v.lang.toLowerCase() === langLower);
  if (exact) return exact;
  const prefix = langLower.split('-')[0];
  return voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
}

export function useVoice(options: UseVoiceOptions): UseVoiceReturn {
  const { onTranscript, lang = 'en-SG', maxDuration = 10000 } = options;

  const supported = !!SpeechRecognitionCtor;
  const [status, setStatus] = useState<VoiceStatus>(supported ? 'idle' : 'unavailable');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [ttsEnabled, setTtsEnabled] = useState(options.ttsEnabled ?? false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const ttsWarmedUp = useRef(false);

  // Keep callback ref in sync
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  // Cache voices (iOS returns empty on first call)
  useEffect(() => {
    if (!synthSupported) return;
    const loadVoices = () => {
      voicesRef.current = speechSynthesis.getVoices();
    };
    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (synthSupported) {
      speechSynthesis.cancel();
    }
    setStatus((s) => (s === 'speaking' ? 'idle' : s));
  }, []);

  const stopListening = useCallback(() => {
    clearTimer();
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setInterimTranscript('');
    setStatus((s) => (s === 'listening' ? 'idle' : s));
  }, [clearTimer]);

  const startListening = useCallback(() => {
    if (!SpeechRecognitionCtor) return;

    // Stop any current TTS or STT
    stopSpeaking();
    stopListening();

    // iOS TTS warm-up on first user gesture
    if (synthSupported && !ttsWarmedUp.current) {
      const warmUp = new SpeechSynthesisUtterance('');
      warmUp.volume = 0;
      speechSynthesis.speak(warmUp);
      ttsWarmedUp.current = true;
    }

    // Fresh instance per activation (iOS Safari reuse bug)
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    let gotFinal = false;

    recognition.onstart = () => {
      setStatus('listening');
      setInterimTranscript('');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        gotFinal = true;
        setInterimTranscript('');
        setStatus('processing');
        clearTimer();
        onTranscriptRef.current(final.trim());
      } else {
        setInterimTranscript(interim);
      }
    };

    recognition.onerror = () => {
      clearTimer();
      recognitionRef.current = null;
      setInterimTranscript('');
      setStatus('idle');
    };

    recognition.onend = () => {
      clearTimer();
      recognitionRef.current = null;
      if (!gotFinal) {
        setInterimTranscript('');
        setStatus('idle');
      }
    };

    recognition.start();

    // Max duration timeout
    timeoutRef.current = setTimeout(() => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }, maxDuration);
  }, [lang, maxDuration, stopSpeaking, stopListening, clearTimer]);

  const speak = useCallback(
    (text: string) => {
      if (!synthSupported || !text) return;

      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const voice = pickVoice(voicesRef.current, lang);
      if (voice) utterance.voice = voice;
      utterance.lang = lang;
      utterance.rate = 1;

      utterance.onstart = () => setStatus('speaking');
      utterance.onend = () => setStatus('idle');
      utterance.onerror = () => setStatus('idle');

      speechSynthesis.speak(utterance);
    },
    [lang],
  );

  // When status goes to 'processing' → eventually back to 'idle' (driven by message arrival)
  useEffect(() => {
    if (status === 'processing') {
      // Reset to idle once chat loading finishes (handled externally via message arrival)
      // This timeout is a safety net in case something goes wrong
      const t = setTimeout(() => setStatus('idle'), 15000);
      return () => clearTimeout(t);
    }
  }, [status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      if (synthSupported) speechSynthesis.cancel();
      clearTimer();
    };
  }, [clearTimer]);

  return {
    status,
    interimTranscript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    ttsEnabled,
    setTtsEnabled,
    supported,
  };
}
