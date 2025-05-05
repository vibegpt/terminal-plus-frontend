import { useState } from "react";
import supabase from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plane } from "lucide-react";
import { logEvent } from "@/utils/analytics"; // ✅ Add this

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    logEvent("Auth_Submit_Magic_Link", { email }); // ✅ Log email submission

    const { error } = await supabase.auth.signInWithOtp({ email });

    if (error) {
      logEvent("Auth_Magic_Link_Failed", { error: error.message }); // ✅ Log failure
      setMessage("Something went wrong. Please try again.");
    } else {
      logEvent("Auth_Magic_Link_Sent", { email }); // ✅ Log success
      setMessage("Check your inbox for a magic link.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
      <form onSubmit={handleLogin} className="bg-card p-8 rounded-lg shadow-lg w-full max-w-sm">
        <div className="flex items-center justify-center mb-6">
          <Plane className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold ml-2">Terminal+</h1>
        </div>

        <Label htmlFor="email" className="mb-1">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            logEvent("Auth_Email_Typed"); // ✅ Track email typing
          }}
          required
          className="mb-4"
        />

        <Button type="submit" className="w-full">
          Send Magic Link
        </Button>

        {message && <p className="mt-4 text-sm text-center">{message}</p>}
      </form>
    </div>
  );
}