import { Plane, History, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <nav className="py-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 md:hidden">
      <div className="flex justify-around">
        <button 
          onClick={() => onTabChange("journey")}
          className={cn(
            "flex flex-col items-center p-2 transition-colors", 
            activeTab === "journey" 
              ? "text-primary-600 dark:text-primary-400" 
              : "text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-300"
          )}
        >
          <Plane className="h-5 w-5" />
          <span className="text-xs mt-1">Journey</span>
        </button>
        <button 
          onClick={() => onTabChange("history")}
          className={cn(
            "flex flex-col items-center p-2 transition-colors", 
            activeTab === "history" 
              ? "text-primary-600 dark:text-primary-400" 
              : "text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-300"
          )}
        >
          <History className="h-5 w-5" />
          <span className="text-xs mt-1">History</span>
        </button>
        <button 
          onClick={() => onTabChange("profile")}
          className={cn(
            "flex flex-col items-center p-2 transition-colors", 
            activeTab === "profile" 
              ? "text-primary-600 dark:text-primary-400" 
              : "text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-300"
          )}
        >
          <User className="h-5 w-5" />
          <span className="text-xs mt-1">Profile</span>
        </button>
      </div>
    </nav>
  );
}
