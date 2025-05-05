import { useState } from "react";
import supabase from "@/lib/supabase";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
  };

  const handleSignUp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) setError(error.message);
  };

  return (
    <div className="flex flex-col items-center gap-4 mt-20">
      <h1 className="text-2xl font-bold">Sign In or Sign Up</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border px-4 py-2 rounded"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border px-4 py-2 rounded"
      />
      {error && <p className="text-red-500">{error}</p>}
      <button onClick={handleSignIn} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
        {loading ? "Loading..." : "Sign In"}
      </button>
      <button onClick={handleSignUp} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded">
        {loading ? "Loading..." : "Sign Up"}
      </button>
    </div>
  );
}