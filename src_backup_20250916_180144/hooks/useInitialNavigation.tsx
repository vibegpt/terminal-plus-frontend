import { useEffect } from "react";
import { useLocation } from "wouter";

export function useInitialNavigation() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Only redirect to splash if we're starting at the root and not coming from somewhere else
    if (location === "/" && !sessionStorage.getItem("app_initialized")) {
      sessionStorage.setItem("app_initialized", "true");
      setLocation("/splash");
    }
  }, [location, setLocation]);

  return null;
}