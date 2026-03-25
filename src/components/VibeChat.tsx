import React, { useState, useRef, useEffect } from "react";

const VibeChat = () => {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;
    console.log("📤 Sending message:", input);
    setLoading(true);
    setResponse(null);

    try {
      console.log("📤 Sending request to /api/ask");
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache"
        },
        body: JSON.stringify({ message: input }),
      });

      console.log("📥 Response status:", res.status);
      const contentType = res.headers.get("content-type");
      console.log("📥 Content-Type:", contentType);

      if (!contentType?.includes("application/json")) {
        throw new Error(`Invalid content type: ${contentType}`);
      }

      const text = await res.text();
      console.log("📥 Raw response:", text);

      const data = JSON.parse(text);
      console.log("📥 Parsed data:", data);

      if (!res.ok || data.status === 'error') { //Added status check
        throw new Error(data.error || `Server error: ${res.status}`);
      }

      if (data.response) {
        setResponse(data.response);
        setInput("");
      } else {
        throw new Error("No response data received");
      }

    } catch (err) {
      console.error("❌ Error:", err);
      setResponse(`⚠️ ${err instanceof Error ? err.message : "Failed to get AI response"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        backgroundColor: "white",
        color: "black",
        border: "2px solid #000",
        borderRadius: "12px",
        padding: "16px",
        fontFamily: "sans-serif",
        width: "360px",
        zIndex: 9999,
      }}
    >
      <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "12px" }}>
        💬 Talk to Terminal+
      </h2>

      <div style={{ display: "flex", gap: "8px" }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Type your question..."
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "6px",
            fontSize: "16px",
            backgroundColor: "#ffffff",
            color: "#000000",
            border: "1px solid #000000",
            outline: "none",
            zIndex: 9999,
            opacity: 1,
            caretColor: "#000000",
          }}
          className="border border-gray-300 focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            padding: "10px 14px",
            backgroundColor: "#3b82f6",
            color: "white",
            fontWeight: "bold",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "..." : "Send"}
        </button>
      </div>

      {response !== null && (
        <div
          style={{
            marginTop: "16px",
            backgroundColor: "#f3f4f6",
            border: "1px solid #ccc",
            padding: "12px",
            borderRadius: "8px",
            color: "#111",
          }}
        >
          <strong>AI:</strong> {response}
        </div>
      )}
    </div>
  );
};

export default VibeChat;