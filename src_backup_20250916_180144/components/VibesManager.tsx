import React, { useState } from "react";
import { supabase } from '../lib/supabaseClient';
import { EmotionLogDashboard } from './EmotionLogDashboard';

// TEMP: replace with Supabase user name or prop later
const USER_NAME = "John";

export default function VibesManager() {
  const [recording, setRecording] = useState(false);
  const [step, setStep] = useState<"intro" | "analyzing" | "confirmed">("intro");
  const [emotionTone, setEmotionTone] = useState<string | null>(null); // from voice
  const [emotionLabel, setEmotionLabel] = useState<string | null>(null); // from user words
  const [confidence, setConfidence] = useState<number | null>(null);
  const [gptReply, setGptReply] = useState<string | null>(null);

  let mediaRecorder: MediaRecorder;
  let audioChunks: Blob[] = [];

  const startCheckIn = async () => {
    setStep("analyzing");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        await detectTone(audioBlob);
        const transcribedText = await transcribeVoice(audioBlob); // TODO: integrate Whisper.js or fake for now
        const labeledEmotion = extractEmotionFromText(transcribedText);
        setEmotionLabel(labeledEmotion);
        await getGPTResponse(labeledEmotion, emotionTone);
        setStep("confirmed");
      };

      mediaRecorder.start();
      setRecording(true);
      console.log("🎙 Recording user emotional check-in...");

      setTimeout(() => {
        mediaRecorder.stop();
        setRecording(false);
        console.log("🛑 Stopped recording check-in");
      }, 4000); // record for 4 seconds

    } catch (err) {
      console.error("Mic error", err);
      alert("Please allow mic access.");
      setStep("intro");
    }
  };

  const detectTone = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append("inputs", audioBlob);

    const res = await fetch("https://api-inference.huggingface.co/models/superb/hubert-large-superb-er", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_HUGGINGFACE_API_KEY || ''}`
      },
      body: formData
    });

    const data = await res.json();
    const detected = data?.[0]?.label;
    const score = data?.[0]?.score;

    if (detected && score) {
      setEmotionTone(detected);
      setConfidence(score);
    } else {
      alert("Could not detect emotion tone.");
    }
  };

  const transcribeVoice = async (audioBlob: Blob): Promise<string> => {
    // 💡 For now, fake it — swap this with Whisper or speech-to-text
    return "I'm stressed. Help me get to Gate A1.";
  };

  const extractEmotionFromText = (text: string): string => {
    const lower = text.toLowerCase();
    if (lower.includes("stressed")) return "stressed";
    if (lower.includes("angry") || lower.includes("annoyed") || lower.includes("pissed")) return "angry";
    if (lower.includes("sad") || lower.includes("upset")) return "sad";
    if (lower.includes("happy") || lower.includes("excited")) return "happy";
    return "neutral";
  };

  const getTonePrompt = (emotion: string): string => {
    const map: Record<string, string> = {
      stressed: "calm, reassuring, focused",
      angry: "gentle, non-confrontational, efficient",
      sad: "supportive, kind, empathetic",
      happy: "enthusiastic, playful",
      neutral: "professional, helpful",
    };
    return map[emotion] || "friendly and clear";
  };

  const getGPTResponse = async (emotion: string, tone: string | null) => {
    const style = getTonePrompt(emotion);
    const prompt = `The user just said they're feeling "${emotion}". Their tone also seems "${tone}". Respond to help them get to Gate A1 in a ${style} tone.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY || ''}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a helpful, emotionally-aware airport assistant." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      })
    });

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content;
    setGptReply(reply || "I'm here to help however I can.");
    
    // Log emotion data to Supabase
    await logEmotionToDatabase(emotion, tone, confidence, reply);
  };

  const logEmotionToDatabase = async (emotion: string, tone: string | null, confidence: number | null, gptReply: string) => {
    try {
      // Call the Supabase Edge Function
      const response = await fetch('/functions/v1/log-emotion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`, // auto-added via Supabase auth
        },
        body: JSON.stringify({
          user_id: null, // TODO: Replace with session?.user.id when auth is implemented
          emotion: emotion,
          detailed_emotion: tone,
          confidence: confidence,
          source: 'voice_analysis',
          tone: tone,
          pace: null, // TODO: Add pace detection
          warmth: null, // TODO: Add warmth detection
          language: 'en',
          gpt_response: gptReply
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('Error logging emotion:', result.error);
      } else {
        console.log('✅ Emotion logged successfully:', result);
      }
    } catch (err) {
      console.error('Failed to log emotion:', err);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow max-w-md mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4">🎧 Vibes Manager</h2>

      {step === "intro" && (
        <>
          <p className="mb-4 text-gray-700">Hi {USER_NAME}, how are you feeling right now?</p>
          <button
            onClick={startCheckIn}
            disabled={recording}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            {recording ? "🎙 Listening..." : "Speak Now"}
          </button>
        </>
      )}

      {step === "analyzing" && (
        <div className="text-gray-500">
          🔍 Analyzing your voice and words for emotion...
        </div>
      )}

      {step === "confirmed" && (
        <>
          <div className="mt-4 text-gray-700">
            🧠 <strong>Emotion you said:</strong> {emotionLabel} <br />
            🎧 <strong>Tone detected:</strong> {emotionTone} ({(confidence! * 100).toFixed(1)}%)
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="italic text-blue-800">🗣 Vibe Assistant:</p>
            <p className="mt-2 text-gray-800">{gptReply}</p>
          </div>
        </>
      )}

      {/* Emotion Logs Dashboard */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <EmotionLogDashboard />
      </div>
    </div>
  );
} 