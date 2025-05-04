import { Plane, History, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <nav className="py-2 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 md:hidden">
      <div className="flex justify-around">
        <button 
          onClick={() => onTabChange("journey")}
          className={cn(
            "flex flex-col items-center p-2", 
            activeTab === "journey" 
              ? "text-primary-600 dark:text-primary-400" 
              : "text-slate-400"
          )}
        >
          <Plane className="h-5 w-5" />
          <span className="text-xs mt-1">Journey</span>
        </button>
        <button 
          onClick={() => onTabChange("history")}
          className={cn(
            "flex flex-col items-center p-2", 
            activeTab === "history" 
              ? "text-primary-600 dark:text-primary-400" 
              : "text-slate-400"
          )}
        >
          <History className="h-5 w-5" />
          <span className="text-xs mt-1">History</span>
        </button>
        <button 
          onClick={() => onTabChange("profile")}
          className={cn(
            "flex flex-col items-center p-2", 
            activeTab === "profile" 
              ? "text-primary-600 dark:text-primary-400" 
              : "text-slate-400"
          )}
        >
          <User className="h-5 w-5" />
          <span className="text-xs mt-1">Profile</span>
        </button>
      </div>
    </nav>
  );
}
