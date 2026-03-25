import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import supabase from "@/lib/supabase";
import { User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export const useSupabaseAuth = () => {
  const { toast } = useToast();
  const [supabaseSession, setSupabaseSession] = useState<SupabaseSession | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verify token with our backend
  const verifyToken = async (token: string) => {
    try {
      const response = await apiRequest('POST', '/api/auth/verify-token', { token });
      return await response.json();
    } catch (error) {
      console.error('Error verifying token:', error);
      return { valid: false, error: 'Failed to verify token' };
    }
  };
  
  // Get user information from our server using Supabase token
  const { data: serverUser, error: serverUserError } = useQuery({
    queryKey: ['/api/auth/user'],
    enabled: !!supabaseUser,
    queryFn: async () => {
      try {
        if (!supabaseSession?.access_token) {
          throw new Error('No access token available');
        }
        
        const res = await fetch('/api/auth/user', {
          headers: {
            'Authorization': `Bearer ${supabaseSession.access_token}`
          }
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        return await res.json();
      } catch (error) {
        console.error('Error fetching server user data:', error);
        throw error;
      }
    }
  });

  // Sign in mutation
  const signInMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw new Error(error.message);
      
      // Verify token with our backend
      const verificationResult = await verifyToken(data.session?.access_token || '');
      if (!verificationResult.valid) {
        throw new Error('Server could not verify your authentication');
      }
      
      return data.user;
    },
    onError: (error: Error) => {
      toast({
        title: 'Login failed',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      // Invalidate auth-related queries to refresh user data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/journeys'] });
      
      toast({
        title: 'Login successful',
        description: 'You are now signed in',
        variant: 'default',
      });
    },
  });

  // Sign up mutation
  const signUpMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw new Error(error.message);
      return data.user;
    },
    onError: (error: Error) => {
      toast({
        title: 'Registration failed',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Registration successful',
        description: 'Please check your email to confirm your account',
        variant: 'default',
      });
    },
  });

  // Sign out mutation
  const signOutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
    },
    onError: (error: Error) => {
      toast({
        title: 'Sign out failed',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      // Reset user data after signing out
      queryClient.setQueryData(['/api/auth/user'], null);
      queryClient.resetQueries();
      
      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully',
        variant: 'default',
      });
    },
  });

  // Listen for auth state changes
  useEffect(() => {
    setIsLoading(true);
    
    // Initial session check
    const getInitialSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSupabaseSession(data.session);
        setSupabaseUser(data.session?.user || null);
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    getInitialSession();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSupabaseSession(session);
        setSupabaseUser(session?.user || null);
        setIsLoading(false);
        
        // Update the API client with the new session token
        if (session?.access_token) {
          // Force refresh of user data when auth state changes
          queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        }
      }
    );
    
    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    supabaseUser,
    supabaseSession,
    serverUser,
    serverUserError,
    isLoading,
    signInMutation,
    signUpMutation,
    signOutMutation,
  };
};