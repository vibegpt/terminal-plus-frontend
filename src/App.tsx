import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "./lib/protected-route";
import { ThemeProvider } from "./components/ThemeProvider";
import { AuthProvider } from "@/hooks/useAuth";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useEffect } from "react";
import TransitionManager from "./components/TransitionManager";
import { useInitialNavigation } from "./hooks/useInitialNavigation";

// Import VibeChat
import VibeChat from "@/components/VibeChat";

// Import our new pages
import PlanJourneyPage from "@/pages/plan-journey";
import YourJourneysPage from "@/pages/your-journeys";
import JourneySuccessPage from "@/pages/journey-success";
import JourneyDetailPage from "@/pages/journey-detail";
import ExploreTerminalPage from "@/pages/explore-terminal";
import TerminalMapPage from "@/pages/terminal-map";

// Import simplified pages
import SimplifiedJourneyInput from "@/pages/simplified-journey-input";
import SimplifiedExplore from "@/pages/simplified-explore";
import SimplifiedMap from "@/pages/simplified-map";
import ComfortJourney from "@/pages/comfort-journey";
import MyJourney from "@/pages/my-journey";
import SavedJourneys from "@/pages/saved-journeys";
import StartJourney from "@/pages/start-journey";
import LandingScreen from "@/pages/landing-screen";
import SplashScreen from "@/components/SplashScreen";
import PlanTransit from "@/pages/plan-transit";
import MultiAirportJourneyPage from "@/pages/multi-airport-journey";
import SavedTrips from "@/pages/saved-trips";
import PublicTripPage from "@/pages/trip";

function Router() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    console.log("Current location:", location);
  }, [location]);

  return (
    <TransitionManager>
      <Switch>
        <Route path="/splash" component={SplashScreen} />
        <Route path="/" component={LandingScreen} />
        <Route path="/home" component={HomePage} />
        <Route path="/auth" component={AuthPage} />
        <ProtectedRoute path="/plan-journey" component={PlanJourneyPage} />
        <ProtectedRoute path="/your-journeys" component={YourJourneysPage} />
        <ProtectedRoute path="/journey-success" component={JourneySuccessPage} />
        <ProtectedRoute path="/journey/:id" component={JourneyDetailPage} />
        <ProtectedRoute path="/explore-terminal/:id" component={ExploreTerminalPage} />
        <ProtectedRoute path="/terminal-map/:id" component={TerminalMapPage} />
        <Route path="/home-direct" component={HomePage} />
        <Route path="/simplified-journey-input" component={SimplifiedJourneyInput} />
        <Route path="/simplified-explore" component={SimplifiedExplore} />
        <Route path="/simplified-map" component={SimplifiedMap} />
        <Route path="/comfort-journey" component={ComfortJourney} />
        <Route path="/my-journey" component={MyJourney} />
        <Route path="/start-journey" component={StartJourney} />
        <Route path="/saved-journeys" component={SavedJourneys} />
        <Route path="/plan-transit" component={PlanTransit} />
        <Route path="/multi-airport-journey" component={MultiAirportJourneyPage} />
        <Route path="/saved-trips" component={SavedTrips} />
        <Route path="/trip" component={PublicTripPage} />
        <Route component={NotFound} />
      </Switch>
    </TransitionManager>
  );
}

function App() {
  useInitialNavigation();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider defaultTheme="system" storageKey="terminal-plus-theme">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
          {/* ✅ VibeChat injected globally here */}
          <div data-theme="light" className="fixed bottom-4 right-4 z-50">
            <VibeChat />
          </div>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;