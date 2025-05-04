import React, { useState, useEffect } from "react";
import { useLocation, Redirect } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plane, User, Lock, BugPlay } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const [_, navigate] = useLocation();
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ username: "", password: "", confirmPassword: "" });
  const [activeTab, setActiveTab] = useState("login");
  const [passwordError, setPasswordError] = useState("");

  // Log auth status for debugging
  console.log("Auth page - auth status:", { 
    user, 
    isLoading
  });
  
  // Direct navigation for testing/debugging
  const forcedNavigate = () => {
    navigate('/');
  };
  
  // Redirect if already authenticated
  if (user && !isLoading) {
    console.log("Auth page - already authenticated, redirecting to /");
    return <Redirect to="/" />;
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log("Auth page - attempting login with:", loginForm.username);
      await loginMutation.mutateAsync(loginForm);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerForm.password !== registerForm.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    
    setPasswordError("");
    try {
      console.log("Auth page - attempting registration with:", registerForm.username);
      await registerMutation.mutateAsync({
        username: registerForm.username,
        password: registerForm.password
      });
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Form Section */}
      <div className="w-full md:w-1/2 p-8 flex items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start">
              <Plane className="h-6 w-6 text-primary-600" />
              <h1 className="text-2xl font-bold ml-2">Terminal+</h1>
            </div>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Your personal flight journey companion</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">Email</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="login-username"
                      type="email"
                      placeholder="Enter your email"
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Logging in..." : "Login"}
                </Button>
                
                {/* Debug bypass button */}
                <div className="mt-4">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={forcedNavigate}
                    className="w-full"
                  >
                    <BugPlay className="w-4 h-4 mr-2" />
                    Debug: Skip Login
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-username">Email</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="register-username"
                      type="email"
                      placeholder="Enter your email"
                      value={registerForm.username}
                      onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Choose a password"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={registerForm.confirmPassword}
                      onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                  {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Hero Section */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-b from-primary-600 to-secondary-600 p-12 flex-col justify-center items-center text-white">
        <div className="max-w-md text-center">
          <Plane className="w-16 h-16 mx-auto mb-8" />
          <h2 className="text-3xl font-bold mb-4">Enhance Your Airport Experience</h2>
          <p className="text-lg mb-8">
            Plan your journeys, track your flights, and get personalized recommendations based on your travel style.
          </p>
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
              <h3 className="font-bold mb-2">🧘 Relax Mode</h3>
              <p className="text-sm opacity-90">Find lounges, spas, and quiet spaces to unwind before your flight.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
              <h3 className="font-bold mb-2">🧭 Explore Mode</h3>
              <p className="text-sm opacity-90">Discover shopping, dining and entertainment options at the terminal.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
              <h3 className="font-bold mb-2">💼 Work Mode</h3>
              <p className="text-sm opacity-90">Locate workspaces, charging stations and WiFi details.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
              <h3 className="font-bold mb-2">⚡ Quick Mode</h3>
              <p className="text-sm opacity-90">Get the fastest routes to your gate and time-saving tips.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
