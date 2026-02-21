import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface Modal {
  id: string;
  component: string;
  props?: Record<string, any>;
  onClose?: () => void;
}

export interface SidebarState {
  isOpen: boolean;
  activeTab: string;
  width: number;
}

export interface UIState {
  // Theme and appearance
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
  
  // Layout
  sidebar: SidebarState;
  headerHeight: number;
  footerHeight: number;
  
  // Modals and overlays
  modals: Modal[];
  isModalOpen: boolean;
  
  // Toast notifications
  toasts: Toast[];
  
  // Loading states
  globalLoading: boolean;
  loadingStates: Record<string, boolean>;
  
  // Navigation
  currentRoute: string;
  previousRoute: string;
  navigationHistory: string[];
  
  // Mobile specific
  isMobileMenuOpen: boolean;
  isKeyboardOpen: boolean;
  orientation: 'portrait' | 'landscape';
  
  // Accessibility
  reducedMotion: boolean;
  highContrast: boolean;
  screenReader: boolean;
  
  // Actions
  setTheme: (theme: UIState['theme']) => void;
  setPrimaryColor: (color: string) => void;
  setFontSize: (fontSize: UIState['fontSize']) => void;
  
  // Sidebar actions
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setSidebarTab: (tab: string) => void;
  setSidebarWidth: (width: number) => void;
  
  // Modal actions
  openModal: (modal: Omit<Modal, 'id'>) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  
  // Toast actions
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
  hideAllToasts: () => void;
  
  // Loading actions
  setGlobalLoading: (loading: boolean) => void;
  setLoadingState: (key: string, loading: boolean) => void;
  clearLoadingState: (key: string) => void;
  
  // Navigation actions
  setCurrentRoute: (route: string) => void;
  navigateBack: () => void;
  clearNavigationHistory: () => void;
  
  // Mobile actions
  setMobileMenuOpen: (isOpen: boolean) => void;
  setKeyboardOpen: (isOpen: boolean) => void;
  setOrientation: (orientation: 'portrait' | 'landscape') => void;
  
  // Accessibility actions
  setReducedMotion: (reduced: boolean) => void;
  setHighContrast: (highContrast: boolean) => void;
  setScreenReader: (enabled: boolean) => void;
  
  // Computed
  getLoadingState: (key: string) => boolean;
  isAnyLoading: () => boolean;
  getCurrentModal: () => Modal | undefined;
}

const initialSidebarState: SidebarState = {
  isOpen: false,
  activeTab: 'search',
  width: 300,
};

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      immer((set, get) => ({
        theme: 'dark',
        primaryColor: '#667eea',
        fontSize: 'medium',
        sidebar: initialSidebarState,
        headerHeight: 64,
        footerHeight: 60,
        modals: [],
        isModalOpen: false,
        toasts: [],
        globalLoading: false,
        loadingStates: {},
        currentRoute: '/',
        previousRoute: '',
        navigationHistory: ['/'],
        isMobileMenuOpen: false,
        isKeyboardOpen: false,
        orientation: 'portrait',
        reducedMotion: false,
        highContrast: false,
        screenReader: false,
        
        // Theme actions
        setTheme: (theme) => set((state) => {
          state.theme = theme;
        }),
        
        setPrimaryColor: (color) => set((state) => {
          state.primaryColor = color;
        }),
        
        setFontSize: (fontSize) => set((state) => {
          state.fontSize = fontSize;
        }),
        
        // Sidebar actions
        toggleSidebar: () => set((state) => {
          state.sidebar.isOpen = !state.sidebar.isOpen;
        }),
        
        setSidebarOpen: (isOpen) => set((state) => {
          state.sidebar.isOpen = isOpen;
        }),
        
        setSidebarTab: (tab) => set((state) => {
          state.sidebar.activeTab = tab;
        }),
        
        setSidebarWidth: (width) => set((state) => {
          state.sidebar.width = Math.max(200, Math.min(600, width));
        }),
        
        // Modal actions
        openModal: (modal) => set((state) => {
          const newModal: Modal = {
            ...modal,
            id: `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          };
          state.modals.push(newModal);
          state.isModalOpen = true;
        }),
        
        closeModal: (id) => set((state) => {
          const modal = state.modals.find(m => m.id === id);
          if (modal?.onClose) {
            modal.onClose();
          }
          state.modals = state.modals.filter(m => m.id !== id);
          state.isModalOpen = state.modals.length > 0;
        }),
        
        closeAllModals: () => set((state) => {
          state.modals.forEach(modal => {
            if (modal.onClose) {
              modal.onClose();
            }
          });
          state.modals = [];
          state.isModalOpen = false;
        }),
        
        // Toast actions
        showToast: (toast) => set((state) => {
          const newToast: Toast = {
            ...toast,
            id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            duration: toast.duration || 5000,
          };
          state.toasts.push(newToast);
          
          // Auto-hide toast after duration
          setTimeout(() => {
            get().hideToast(newToast.id);
          }, newToast.duration);
        }),
        
        hideToast: (id) => set((state) => {
          state.toasts = state.toasts.filter(t => t.id !== id);
        }),
        
        hideAllToasts: () => set((state) => {
          state.toasts = [];
        }),
        
        // Loading actions
        setGlobalLoading: (loading) => set((state) => {
          state.globalLoading = loading;
        }),
        
        setLoadingState: (key, loading) => set((state) => {
          if (loading) {
            state.loadingStates[key] = true;
          } else {
            delete state.loadingStates[key];
          }
        }),
        
        clearLoadingState: (key) => set((state) => {
          delete state.loadingStates[key];
        }),
        
        // Navigation actions
        setCurrentRoute: (route) => set((state) => {
          if (state.currentRoute !== route) {
            state.previousRoute = state.currentRoute;
            state.currentRoute = route;
            state.navigationHistory.push(route);
            
            // Keep only last 50 routes
            if (state.navigationHistory.length > 50) {
              state.navigationHistory = state.navigationHistory.slice(-50);
            }
          }
        }),
        
        navigateBack: () => set((state) => {
          if (state.navigationHistory.length > 1) {
            state.navigationHistory.pop(); // Remove current route
            const previousRoute = state.navigationHistory[state.navigationHistory.length - 1];
            state.previousRoute = state.currentRoute;
            state.currentRoute = previousRoute;
          }
        }),
        
        clearNavigationHistory: () => set((state) => {
          state.navigationHistory = [state.currentRoute];
          state.previousRoute = '';
        }),
        
        // Mobile actions
        setMobileMenuOpen: (isOpen) => set((state) => {
          state.isMobileMenuOpen = isOpen;
        }),
        
        setKeyboardOpen: (isOpen) => set((state) => {
          state.isKeyboardOpen = isOpen;
        }),
        
        setOrientation: (orientation) => set((state) => {
          state.orientation = orientation;
        }),
        
        // Accessibility actions
        setReducedMotion: (reduced) => set((state) => {
          state.reducedMotion = reduced;
        }),
        
        setHighContrast: (highContrast) => set((state) => {
          state.highContrast = highContrast;
        }),
        
        setScreenReader: (enabled) => set((state) => {
          state.screenReader = enabled;
        }),
        
        // Computed
        getLoadingState: (key) => {
          const state = get();
          return state.loadingStates[key] || false;
        },
        
        isAnyLoading: () => {
          const state = get();
          return state.globalLoading || Object.keys(state.loadingStates).length > 0;
        },
        
        getCurrentModal: () => {
          const state = get();
          return state.modals[state.modals.length - 1];
        },
      })),
      {
        name: 'terminal-plus-ui',
        partialize: (state) => ({
          theme: state.theme,
          primaryColor: state.primaryColor,
          fontSize: state.fontSize,
          sidebar: state.sidebar,
          reducedMotion: state.reducedMotion,
          highContrast: state.highContrast,
          screenReader: state.screenReader,
        }),
      }
    ),
    {
      name: 'terminal-plus-ui',
    }
  )
);

// Selectors
export const useTheme = () => useUIStore((state) => state.theme);
export const useSidebar = () => useUIStore((state) => state.sidebar);
export const useModals = () => useUIStore((state) => state.modals);
export const useToasts = () => useUIStore((state) => state.toasts);
export const useGlobalLoading = () => useUIStore((state) => state.globalLoading);
export const useCurrentRoute = () => useUIStore((state) => state.currentRoute);
export const useMobileState = () => useUIStore((state) => ({
  isMobileMenuOpen: state.isMobileMenuOpen,
  isKeyboardOpen: state.isKeyboardOpen,
  orientation: state.orientation,
}));
export const useAccessibility = () => useUIStore((state) => ({
  reducedMotion: state.reducedMotion,
  highContrast: state.highContrast,
  screenReader: state.screenReader,
}));

// Action selectors
export const useUIActions = () => useUIStore((state) => ({
  setTheme: state.setTheme,
  toggleSidebar: state.toggleSidebar,
  openModal: state.openModal,
  closeModal: state.closeModal,
  showToast: state.showToast,
  hideToast: state.hideToast,
  setGlobalLoading: state.setGlobalLoading,
  setLoadingState: state.setLoadingState,
  setCurrentRoute: state.setCurrentRoute,
  navigateBack: state.navigateBack,
  setMobileMenuOpen: state.setMobileMenuOpen,
}));
