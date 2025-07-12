import React, { useState, useRef, useEffect } from "react";

const vibePrompts: Record<string, string> = {
  Relax: "Respond in a calm, soothing, and friendly tone. Help the user unwind and feel at ease.",
  Explore: "Respond with excitement and curiosity. Encourage discovery and adventure.",
  Work: "Respond in a focused, efficient, and professional manner. Help the user stay productive.",
  Quick: "Respond concisely and help the user move fast. Be direct and to the point."
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

interface VibeSession {
  vibe: string;
  timestamp: number;
  flightNumber?: string;
  terminal?: string;
  gate?: string;
  boardingTime?: number;
}

export default function VibeManagerChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "assistant", content: "Hi! I'm your Vibe Manager. How can I help you today?" }
  ]);
  const [loading, setLoading] = useState(false);
  const [vibe, setVibe] = useState<string | null>(null);
  const [showVibeModal, setShowVibeModal] = useState(false);
  const [mood, setMood] = useState<string | null>(null);
  const [showMoodPrompt, setShowMoodPrompt] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [otherMood, setOtherMood] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  const isWithinBoardingWindow = (boardingTime?: number): boolean => {
    if (!boardingTime) return false;
    const currentTime = Date.now();
    const timeToBoarding = boardingTime - currentTime;
    return timeToBoarding > 0 && timeToBoarding <= 30 * 60 * 1000; // 30 minutes
  };

  const shouldAskForNewVibe = (): boolean => {
    const vibeSession = localStorage.getItem("vibeSession");
    if (!vibeSession) return true;

    try {
      const session: VibeSession = JSON.parse(vibeSession);
      const currentTime = Date.now();
      const timeElapsed = currentTime - session.timestamp;
      
      // Get current journey data
      const journeyData = sessionStorage.getItem("tempJourneyData");
      if (journeyData) {
        const journey = JSON.parse(journeyData);
        
        // If flight number changed, ask for new vibe
        if (journey.flight_number && session.flightNumber && 
            journey.flight_number !== session.flightNumber) {
          return true;
        }

        // If terminal changed, ask for new vibe
        if (journey.terminal && session.terminal && 
            journey.terminal !== session.terminal) {
          return true;
        }

        // If gate changed, ask for new vibe
        if (journey.gate && session.gate && 
            journey.gate !== session.gate) {
          return true;
        }

        // If we're within 30 minutes of boarding, don't ask for new vibe
        if (journey.boarding_time) {
          const boardingTime = new Date(journey.boarding_time).getTime();
          if (isWithinBoardingWindow(boardingTime)) {
            return false;
          }
        }

        // For international flights, ask after 4 hours
        if (timeElapsed > 4 * 60 * 60 * 1000) {
          return true;
        }

        // If less than 30 minutes have passed, don't ask
        if (timeElapsed < 30 * 60 * 1000) {
          return false;
        }
      }

      // Default: ask after 4 hours for international terminals
      return timeElapsed > 4 * 60 * 60 * 1000;
    } catch (e) {
      console.error("Error checking vibe session:", e);
      return true;
    }
  };

  const handleOpen = () => {
    if (shouldAskForNewVibe()) {
      setShowVibeModal(true);
    } else {
      const vibeSession = localStorage.getItem("vibeSession");
      if (vibeSession) {
        const session: VibeSession = JSON.parse(vibeSession);
        setVibe(session.vibe);
        setOpen(true);
      } else {
        setShowVibeModal(true);
      }
    }
  };

  const handleSelectVibe = (selected: string) => {
    setVibe(selected);
    setShowVibeModal(false);
    setOpen(true);

    // Save vibe session with journey context
    const journeyData = sessionStorage.getItem("tempJourneyData");
    const session: VibeSession = {
      vibe: selected,
      timestamp: Date.now(),
      flightNumber: journeyData ? JSON.parse(journeyData).flight_number : undefined,
      terminal: journeyData ? JSON.parse(journeyData).terminal : undefined,
      gate: journeyData ? JSON.parse(journeyData).gate : undefined,
      boardingTime: journeyData && JSON.parse(journeyData).boarding_time ? 
        new Date(JSON.parse(journeyData).boarding_time).getTime() : undefined
    };
    localStorage.setItem("vibeSession", JSON.stringify(session));
  };

  const handleChangeVibe = () => {
    setShowVibeModal(true);
    setOpen(false);
  };

  const handleSend = async () => {
    if (!input.trim() || !vibe) return;
    const userMsg = { role: "user", content: input };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput("");
    setLoading(true);
    
    try {
      // Get journey data for context-aware responses
      const journeyData = sessionStorage.getItem("tempJourneyData");
      let contextPrompt = "";
      
      if (journeyData) {
        const journey = JSON.parse(journeyData);
        if (journey.boarding_time) {
          const boardingTime = new Date(journey.boarding_time).getTime();
          if (isWithinBoardingWindow(boardingTime)) {
            contextPrompt = "The user is within 30 minutes of boarding. Focus on amenities and services near their gate within 5-10 minutes walking distance. Avoid recommending paid services, sit-down meals, or activities longer than 15 minutes. Prioritize quick, convenient options that won't risk missing boarding.";
          }
        }
      }

      const systemPrompt = `${vibePrompts[vibe] || vibePrompts["Relax"]} The user is currently feeling: ${mood || "unknown"}. ${contextPrompt} Respond with empathy and personalized support.`;
      
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: `You are the user's airport Vibe Manager. ${systemPrompt}` },
            ...messages,
            userMsg
          ],
          max_tokens: 120
        })
      });
      const data = await res.json();
      const aiMsg = data.choices?.[0]?.message?.content || "Sorry, I couldn't respond right now.";
      setMessages((msgs) => [...msgs, { role: "assistant", content: aiMsg }]);
    } catch (err) {
      setMessages((msgs) => [...msgs, { role: "assistant", content: "Sorry, there was an error connecting to Vibe Manager." }]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
      }, 100);
    }
  };

  const handleMoodPromptResponse = (yes: boolean) => {
    setShowMoodPrompt(false);
    if (yes) {
      setShowMoodModal(true);
    }
  };

  const handleSelectMood = (selected: string) => {
    if (selected === "Other") {
      setOtherMood("");
      return;
    }
    setMood(selected);
    setShowMoodModal(false);
  };

  const handleOtherMoodSubmit = () => {
    if (otherMood.trim()) {
      setMood(otherMood.trim());
      setShowMoodModal(false);
    }
  };

  const handleChangeMood = () => {
    setShowMoodModal(true);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-purple-600 to-indigo-600 text-white dark:text-white rounded-full shadow-lg px-6 py-3 text-lg font-semibold flex items-center gap-2 hover:scale-105 transition"
        onClick={handleOpen}
        style={{ display: open || showVibeModal ? "none" : "flex" }}
      >
        💬 Talk to your Vibe Manager
      </button>
      {/* Vibe Selection Modal */}
      {showVibeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-8 w-80 flex flex-col items-center">
            <h2 className="text-xl font-bold mb-4 text-purple-700">What's your vibe?</h2>
            <div className="flex flex-col gap-3 w-full mb-4">
              {['Relax', 'Explore', 'Work', 'Quick'].map((option) => (
                <button
                  key={option}
                  className="w-full py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-lg font-semibold text-slate-900 dark:text-white hover:bg-primary-100 dark:hover:bg-primary-900 transition"
                  onClick={() => handleSelectVibe(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Mood Prompt */}
      {showMoodPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-8 w-80 flex flex-col items-center">
            <h2 className="text-xl font-bold mb-4 text-purple-700">Still feeling {vibe}?</h2>
            <div className="flex gap-4">
              <button
                className="px-6 py-2 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 dark:text-white"
                onClick={() => handleMoodPromptResponse(true)}
              >
                Yes
              </button>
              <button
                className="px-6 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white font-semibold hover:bg-slate-300 dark:hover:bg-slate-600"
                onClick={() => handleMoodPromptResponse(false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Mood Selection Modal */}
      {showMoodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-8 w-80 flex flex-col items-center">
            <h2 className="text-xl font-bold mb-4 text-purple-700">How are you feeling?</h2>
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
                  className="w-full py-2 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 dark:text-white"
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
      {/* Chat Window */}
      {open && vibe && (
        <div className="fixed bottom-6 right-6 z-50 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
            <span className="font-bold text-lg text-purple-700">Vibe Manager</span>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">✖️</button>
          </div>
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Vibe: <strong>{vibe}</strong></span>
            <button onClick={handleChangeVibe} className="text-xs text-primary-600 underline">Change</button>
            <button onClick={handleChangeMood} className="text-xs text-primary-600 underline ml-2">Update Mood</button>
          </div>
          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: 320 }}>
            {messages.map((msg, i) => (
              <div key={i} className={`rounded-lg px-3 py-2 text-sm ${msg.role === "user" ? "bg-primary-100 text-primary-900 self-end ml-8" : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 self-start mr-8"}`}>
                {msg.content}
              </div>
            ))}
            {loading && <div className="text-xs text-slate-400 dark:text-slate-300">Vibe Manager is typing…</div>}
          </div>
          <div className="p-3 border-t border-slate-100 dark:border-slate-700 flex gap-2">
            <input
              className="flex-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 dark:focus-visible:ring-primary-500 text-slate-900 dark:text-white"
              placeholder="Type your message…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
              disabled={loading}
            />
            <button
              className="bg-primary-600 text-white dark:text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition"
              onClick={handleSend}
              disabled={loading}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
