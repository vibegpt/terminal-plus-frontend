import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";
import {
  User,
  Moon,
  Bell,
  Lock,
  Plane,
  LogOut,
  ChevronRight,
  Settings,
} from "lucide-react";

export function ProfileScreen() {
  const { user, logoutMutation } = useAuth();
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === "dark";

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleDarkMode = () => {
    setTheme(isDarkMode ? "light" : "dark");
  };

  const getInitials = () => {
    const email = user?.email || "";
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="p-5 space-y-6 bg-white dark:bg-slate-900 min-h-screen">
      <div className="flex items-center">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
          {getInitials()}
        </div>
        <div className="ml-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user?.email}</h2>
          <p className="text-slate-500 dark:text-slate-400">{user?.email || "No email provided"}</p>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
          <h3 className="font-medium mb-3 text-slate-900 dark:text-white">App Preferences</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Moon className="text-slate-500 dark:text-slate-400 mr-3 h-5 w-5" />
                <span className="text-slate-900 dark:text-white">Dark Mode</span>
              </div>
              <Switch id="dark-mode" checked={isDarkMode} onCheckedChange={toggleDarkMode} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Bell className="text-slate-500 dark:text-slate-400 mr-3 h-5 w-5" />
                <span className="text-slate-900 dark:text-white">Notifications</span>
              </div>
              <Switch id="notifications" defaultChecked />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-medium text-slate-900 dark:text-white">Account Settings</h3>
          </div>
          
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            <Button variant="ghost" className="w-full flex items-center justify-start py-3 px-4 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white">
              <User className="text-slate-500 dark:text-slate-400 mr-3 h-5 w-5" />
              <span>Edit Profile</span>
            </Button>
            <Button variant="ghost" className="w-full flex items-center justify-start py-3 px-4 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white">
              <Lock className="text-slate-500 dark:text-slate-400 mr-3 h-5 w-5" />
              <span>Change Password</span>
            </Button>
            <Button variant="ghost" className="w-full flex items-center justify-start py-3 px-4 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white">
              <Plane className="text-slate-500 dark:text-slate-400 mr-3 h-5 w-5" />
              <span>Linked Airlines</span>
            </Button>
            <Button 
              variant="ghost" 
              className="w-full flex items-center justify-start py-3 px-4 hover:bg-slate-50 dark:hover:bg-slate-700 text-red-500"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="mr-3 h-5 w-5" />
              <span>{logoutMutation.isPending ? "Signing out..." : "Sign Out"}</span>
            </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-4">
          <h3 className="font-medium mb-3 text-slate-900 dark:text-white">About</h3>
          <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex justify-between">
              <span>App Version</span>
              <span>1.0.0</span>
            </div>
            <Button variant="ghost" className="w-full flex items-center justify-between p-0 h-auto text-slate-900 dark:text-white">
              <span>Terms of Service</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" className="w-full flex items-center justify-between p-0 h-auto text-slate-900 dark:text-white">
              <span>Privacy Policy</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" className="w-full flex items-center justify-between p-0 h-auto text-slate-900 dark:text-white">
              <span>FAQ</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
