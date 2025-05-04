import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { User as SupabaseUser } from "@supabase/supabase-js";

// Simplified auth context focusing primarily on Supabase auth
type AuthContextType = {
  user: SupabaseUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SupabaseUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SupabaseUser, Error, RegisterData>;
};

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = LoginData;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize auth state and set up listeners
  useEffect(() => {
    async function getUser() {
      try {
        setIsLoading(true);
        
        // Get current session
        const { data: { user } } = await supabase.auth.getUser();
        console.log("Initial auth check:", user ? "Logged in" : "No user");
        setUser(user);
      } catch (err) {
        console.error("Error checking auth status:", err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    getUser();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
      }
    );

    // Clean up
    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      // Use Supabase auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.username, // Using username as email
        password: credentials.password,
      });
      
      if (error) throw new Error(error.message);
      if (!data.user) throw new Error("Login succeeded but no user was returned");
      
      return data.user;
    },
    onSuccess: (user: SupabaseUser) => {
      setUser(user);
      toast({
        title: "Login successful",
        description: "Welcome back to Terminal+",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      // Register with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: credentials.username, // Using username as email
        password: credentials.password,
      });
      
      if (error) throw new Error(error.message);
      if (!data.user) throw new Error("Registration succeeded but no user was returned");
      
      return data.user;
    },
    onSuccess: (user: SupabaseUser) => {
      setUser(user);
      toast({
        title: "Registration successful",
        description: "Welcome to Terminal+",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
