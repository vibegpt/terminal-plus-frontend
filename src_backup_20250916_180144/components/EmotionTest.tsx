import React from 'react';
import { useVoiceEmotion } from '../hooks/useVoiceEmotion';

export default function EmotionTest() {
  const { startRecording, recording, emotionResult } = useVoiceEmotion();

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-2">🎧 Voice Emotion Test</h2>
      <button
        onClick={startRecording}
        disabled={recording}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {recording ? "Recording..." : "Start Voice Scan"}
      </button>
      {emotionResult && (
        <div className="mt-4 text-lg">
          🧠 Emotion: <strong>{emotionResult.label}</strong><br />
          🔍 Confidence: {(emotionResult.score * 100).toFixed(2)}%
        </div>
      )}
    </div>
  );
} 