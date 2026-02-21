import { Button } from "@/components/ui/button";
import { Plane, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AppHeader() {
  const { logoutMutation, user } = useAuth();
  const [_, navigate] = useLocation();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate('/auth');
  };

  return (
    <header className="py-4 px-5 flex justify-between items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center">
        <Plane className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        <h1 className="ml-2 font-bold text-lg text-slate-900 dark:text-white">Terminal+</h1>
      </div>
      <div className="flex gap-2">
        {user && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="mr-2 flex items-center gap-1 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
