import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  preferences: {
    terminal: string;
    favoriteVibes: string[];
    notifications: boolean;
    darkMode: boolean;
  };
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
  refreshToken: string | null;
  lastLoginTime: Date | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<void>;
  refreshAuthToken: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// Mock authentication functions (replace with actual API calls)
const mockLogin = async (email: string, password: string): Promise<{ user: AuthUser; token: string }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (email === 'demo@terminalplus.com' && password === 'demo123') {
    return {
      user: {
        id: '1',
        email: 'demo@terminalplus.com',
        name: 'Demo User',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
        preferences: {
          terminal: 'SIN-T3',
          favoriteVibes: ['comfort', 'refuel'],
          notifications: true,
          darkMode: true,
        },
      },
      token: 'mock-jwt-token-' + Date.now(),
    };
  }
  
  throw new Error('Invalid credentials');
};

const mockRegister = async (email: string, password: string, name: string): Promise<{ user: AuthUser; token: string }> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    user: {
      id: Date.now().toString(),
      email,
      name,
      preferences: {
        terminal: 'SIN-T1',
        favoriteVibes: [],
        notifications: true,
        darkMode: false,
      },
    },
    token: 'mock-jwt-token-' + Date.now(),
  };
};

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      immer((set, get) => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        token: null,
        refreshToken: null,
        lastLoginTime: null,
        
        login: async (email, password) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });
          
          try {
            const { user, token } = await mockLogin(email, password);
            
            set((state) => {
              state.user = user;
              state.token = token;
              state.isAuthenticated = true;
              state.lastLoginTime = new Date();
              state.isLoading = false;
            });
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Login failed';
              state.isLoading = false;
            });
          }
        },
        
        loginWithGoogle: async () => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });
          
          try {
            // Mock Google login
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const user: AuthUser = {
              id: 'google-' + Date.now(),
              email: 'user@gmail.com',
              name: 'Google User',
              avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
              preferences: {
                terminal: 'SIN-T2',
                favoriteVibes: ['quick', 'comfort'],
                notifications: true,
                darkMode: true,
              },
            };
            
            set((state) => {
              state.user = user;
              state.token = 'google-token-' + Date.now();
              state.isAuthenticated = true;
              state.lastLoginTime = new Date();
              state.isLoading = false;
            });
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Google login failed';
              state.isLoading = false;
            });
          }
        },
        
        register: async (email, password, name) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });
          
          try {
            const { user, token } = await mockRegister(email, password, name);
            
            set((state) => {
              state.user = user;
              state.token = token;
              state.isAuthenticated = true;
              state.lastLoginTime = new Date();
              state.isLoading = false;
            });
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Registration failed';
              state.isLoading = false;
            });
          }
        },
        
        resetPassword: async (email) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });
          
          try {
            // Mock password reset
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            set((state) => {
              state.isLoading = false;
            });
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Password reset failed';
              state.isLoading = false;
            });
          }
        },
        
        updateProfile: async (updates) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });
          
          try {
            // Mock profile update
            await new Promise(resolve => setTimeout(resolve, 500));
            
            set((state) => {
              if (state.user) {
                Object.assign(state.user, updates);
              }
              state.isLoading = false;
            });
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Profile update failed';
              state.isLoading = false;
            });
          }
        },
        
        refreshAuthToken: async () => {
          try {
            // Mock token refresh
            await new Promise(resolve => setTimeout(resolve, 500));
            
            set((state) => {
              state.token = 'refreshed-token-' + Date.now();
            });
          } catch (error) {
            // If refresh fails, logout user
            get().logout();
          }
        },
        
        logout: () => set((state) => {
          state.user = null;
          state.token = null;
          state.refreshToken = null;
          state.isAuthenticated = false;
          state.lastLoginTime = null;
          state.error = null;
        }),
        
        setUser: (user) => set((state) => {
          state.user = user;
        }),
        
        setToken: (token) => set((state) => {
          state.token = token;
        }),
        
        setLoading: (isLoading) => set((state) => {
          state.isLoading = isLoading;
        }),
        
        setError: (error) => set((state) => {
          state.error = error;
        }),
        
        clearError: () => set((state) => {
          state.error = null;
        }),
      })),
      {
        name: 'terminal-plus-auth',
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
          lastLoginTime: state.lastLoginTime,
        }),
      }
    ),
    {
      name: 'terminal-plus-auth',
    }
  )
);

// Selectors
export const useAuth = () => useAuthStore((state) => ({
  user: state.user,
  isAuthenticated: state.isAuthenticated,
  isLoading: state.isLoading,
  error: state.error,
}));

export const useAuthActions = () => useAuthStore((state) => ({
  login: state.login,
  logout: state.logout,
  register: state.register,
  loginWithGoogle: state.loginWithGoogle,
  resetPassword: state.resetPassword,
  updateProfile: state.updateProfile,
  clearError: state.clearError,
}));
