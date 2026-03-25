import React, { useState, useRef } from "react";

const vibePrompts: Record<string, string> = {
  Chill: "Respond in a calm, soothing, and friendly tone. Help the user unwind and feel at ease.",
  Explore: "Respond with excitement and curiosity. Encourage discovery and adventure.",
  Work: "Respond in a focused, efficient, and professional manner. Help the user stay productive.",
  Quick: "Respond concisely and help the user move fast. Be direct and to the point.",
  Shop: "Respond with enthusiasm for shopping and browsing. Suggest interesting stores, deals, and unique finds."
};

const moodOptions = [
  { value: "Relaxed", label: "😌 Relaxed" },
  { value: "Excited", label: "😃 Excited" },
  { value: "Neutral", label: "😐 Neutral" },
  { value: "Stressed", label: "😫 Stressed" },
  { value: "Tired", label: "😴 Tired" },
  { value: "Confused", label: "😕 Confused" },
  { value: "Other", label: "➕ Other" }
];

export default function VibeManagerChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "assistant", content: "Hi! I'm your Vibe Manager. How can I help you today?" }
  ]);
  const [loading, setLoading] = useState(false);
  const [vibe, setVibe] = useState<string | null>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [showMoodPrompt, setShowMoodPrompt] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [otherMood, setOtherMood] = useState("");
  const [pendingUserInput, setPendingUserInput] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const detectMoodFromText = async (userText: string): Promise<string> => {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "Detect mood from text. One word only: Stressed, Anxious, Calm, Happy, Angry, Tired, Unknown." },
          { role: "user", content: `Mood of this text: "${userText}"` }
        ],
        temperature: 0.2
      })
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content.trim() || "Unknown";
  };

  const processAIResponse = async (userInput: string) => {
    const systemPrompt = `${vibePrompts[vibe!] || vibePrompts["Chill"]} The user feels: ${mood || "unknown"}. Be emotionally aware and helpful.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: `You are the user's Vibe Manager. ${systemPrompt}` },
          ...messages,
          { role: "user", content: userInput }
        ],
        max_tokens: 120
      })
    });

    const data = await res.json();
    const aiMsg = data.choices?.[0]?.message?.content || "Sorry, I couldn't respond right now.";
    setMessages((msgs) => [...msgs, { role: "assistant", content: aiMsg }]);
    setLoading(false);
    setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }), 100);
  };

  const handleSend = async () => {
    if (!input.trim() || !vibe) return;
    const userMsg = { role: "user", content: input };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput("");
    setLoading(true);

    if (!mood) {
      const detectedMood = await detectMoodFromText(input);
      if (["Stressed", "Anxious", "Frustrated"].includes(detectedMood)) {
        setShowMoodPrompt(true);
        setPendingUserInput(input);
        setLoading(false);
        return;
      } else {
        setMood(detectedMood);
      }
    }

    await processAIResponse(input);
  };

  const handleMoodPromptResponse = (yes: boolean) => {
    setShowMoodPrompt(false);
    if (yes) {
      setMood("Stressed");
      if (pendingUserInput) {
        setLoading(true);
        processAIResponse(pendingUserInput);
        setPendingUserInput(null);
      }
    } else {
      setShowMoodModal(true);
    }
  };

  const handleSelectMood = (selected: string) => {
    setMood(selected);
    setShowMoodModal(false);
    if (pendingUserInput) {
      setLoading(true);
      processAIResponse(pendingUserInput);
      setPendingUserInput(null);
    }
  };

  const handleOtherMoodSubmit = () => {
    if (otherMood.trim()) {
      setMood(otherMood.trim());
      setShowMoodModal(false);
      if (pendingUserInput) {
        setLoading(true);
        processAIResponse(pendingUserInput);
        setPendingUserInput(null);
      }
    }
  };

  return (
    <>
      {showMoodPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-8 w-80 flex flex-col items-center">
            <h2 className="text-xl font-bold mb-4 text-purple-700">
              I sensed a bit of stress — is that right?
            </h2>
            <div className="flex gap-4">
              <button
                className="px-6 py-2 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700"
                onClick={() => handleMoodPromptResponse(true)}
              >
                ✅ Yes, I'm stressed
              </button>
              <button
                className="px-6 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white font-semibold hover:bg-slate-300 dark:hover:bg-slate-600"
                onClick={() => handleMoodPromptResponse(false)}
              >
                🗣️ No, I feel…
              </button>
            </div>
          </div>
        </div>
      )}

      {showMoodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-8 w-80 flex flex-col items-center">
            <h2 className="text-xl font-bold mb-4 text-purple-700">
              How are you feeling?
            </h2>
            <div className="flex flex-col gap-3 w-full mb-4">
              {moodOptions.map((option) => (
                <button
                  key={option.value}
                  className="w-full py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-lg font-semibold text-slate-900 dark:text-white hover:bg-primary-100 dark:hover:bg-primary-900 transition"
                  onClick={() => handleSelectMood(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {moodOptions.find((o) => o.value === "Other") && (
              <div className="w-full flex flex-col gap-2 mt-2">
                <input
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="Describe your mood..."
                  value={otherMood}
                  onChange={e => setOtherMood(e.target.value)}
                  disabled={mood !== "Other"}
                />
                <button
                  className="w-full py-2 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700"
                  onClick={handleOtherMoodSubmit}
                  disabled={!otherMood.trim()}
                >
                  Submit
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Your existing chat UI, input box, floating button, etc., remains unchanged here. */}
    </>
  );
}
