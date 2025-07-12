import { FC, ReactNode, useEffect, useState } from 'react';
import supabase from "@/lib/supabase";
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SupabaseAuthWrapperProps {
  children: ReactNode;
}

export const SupabaseAuthWrapper: FC<SupabaseAuthWrapperProps> = ({ children }) => {
  const [isInitializing, setIsInitializing] = useState(true);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing session and sync with server
    const checkAndSyncSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          // We found a Supabase session, sync it with our server
          await syncSupabaseUser(data.session.user);
          console.log('Auth state changed:', 'SIGNED_IN');
          console.log('Auth change - syncing Supabase user:', data.session.user.id);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (session && event === 'SIGNED_IN') {
          console.log('Auth change - syncing Supabase user:', session.user.id);
          await syncSupabaseUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          // Handle sign out - invalidate queries
          queryClient.resetQueries();
        }
      }
    );

    checkAndSyncSession();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient, toast]);

  // Function to sync Supabase user with our server
  const syncSupabaseUser = async (user: any) => {
    if (!user || !user.id || !user.email) return;

    try {
      const response = await fetch('/api/auth/supabase-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          supabase_uid: user.id,
          email: user.email
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to sync user: ${response.statusText}`);
      }

      // Successfully synced user, invalidate user query
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    } catch (error) {
      console.error('Error syncing Supabase user:', error);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-slate-900">
        <Loader2 className="h-10 w-10 animate-spin text-primary dark:text-primary-400" />
      </div>
    );
  }

  return <>{children}</>;
};