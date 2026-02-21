import { useEffect } from "react";

export default function MicAccessChecker() {
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        console.log("🎤 Mic ready");
      })
      .catch((err) => {
        console.error("Mic error", err);
      });
  }, []);

  return (
    <div className="p-4">
      <h2>Mic Test</h2>
      <p>Check console for microphone access status.</p>
    </div>
  );
} 