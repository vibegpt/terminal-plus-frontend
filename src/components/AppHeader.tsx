import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Plane, Moon, Sun, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export function AppHeader() {
  const { setTheme, theme } = useTheme();
  const { logoutMutation, user } = useAuth();
  const [_, navigate] = useLocation();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate('/auth');
  };

  return (
    <header className="py-4 px-5 flex justify-between items-center">
      <div className="flex items-center">
        <Plane className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        <h1 className="ml-2 font-bold text-lg">Terminal+</h1>
      </div>
      <div className="flex gap-2">
        {user && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="mr-2 flex items-center gap-1"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </header>
  );
}
