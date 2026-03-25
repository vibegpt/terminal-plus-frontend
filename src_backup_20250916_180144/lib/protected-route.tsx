import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useState } from "react";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  const [renderError, setRenderError] = useState<Error | null>(null);
  
  // Simple debug log
  if (import.meta.env.MODE !== 'production') {
    console.log(`Protected route (${path}) - user: ${user?.id}, loading: ${isLoading}`);
  }

  // Add a safeguard for rendering the component
  const renderComponentSafely = () => {
    try {
      return <Component />;
    } catch (error) {
      console.error("Error rendering protected component:", error);
      setRenderError(error as Error);
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h2 className="text-xl font-bold text-red-500 mb-4">Error Loading Page</h2>
          <p className="text-sm mb-4">{(error as Error).message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded"
          >
            Reload Page
          </button>
        </div>
      );
    }
  };

  // Show any render errors
  if (renderError) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h2 className="text-xl font-bold text-red-500 mb-4">Something Went Wrong</h2>
          <p className="text-sm mb-4">{renderError.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded"
          >
            Reload Page
          </button>
        </div>
      </Route>
    );
  }

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border mb-4" />
          <p className="text-sm text-slate-500">Checking authentication...</p>
        </div>
      </Route>
    );
  }

  // Check if user is authenticated
  if (!user) {
    console.log("Protected route - not authenticated, redirecting to /auth");
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  console.log("Protected route - authenticated, rendering component");
  return (
    <Route path={path}>
      {renderComponentSafely()}
    </Route>
  );
}
