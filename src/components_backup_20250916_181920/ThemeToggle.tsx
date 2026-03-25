import React from "react";
import { useTheme, Theme } from "@/context/ThemeProvider";
import { Sun, Moon, Monitor } from "lucide-react";

const options: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: "light", label: "Light", icon: <Sun className="h-4 w-4" /> },
  { value: "dark", label: "Dark", icon: <Moon className="h-4 w-4" /> },
  { value: "system", label: "System", icon: <Monitor className="h-4 w-4" /> },
];

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        className="flex items-center gap-2 rounded-md border px-3 py-2 bg-background text-foreground shadow hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Toggle theme"
        type="button"
      >
        {theme === "light" && <Sun className="h-4 w-4" />}
        {theme === "dark" && <Moon className="h-4 w-4" />}
        {theme === "system" && <Monitor className="h-4 w-4" />}
        <span className="sr-only">Change theme</span>
      </button>
      {open && (
        <ul
          className="absolute right-0 z-10 mt-2 w-36 origin-top-right rounded-md bg-popover shadow-lg ring-1 ring-black/5 focus:outline-none"
          tabIndex={-1}
          role="listbox"
        >
          {options.map((opt) => (
            <li
              key={opt.value}
              className={`flex items-center gap-2 px-4 py-2 cursor-pointer text-popover-foreground hover:bg-accent hover:text-accent-foreground ${theme === opt.value ? "font-semibold" : ""}`}
              onClick={() => {
                setTheme(opt.value);
                setOpen(false);
              }}
              role="option"
              aria-selected={theme === opt.value}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setTheme(opt.value);
                  setOpen(false);
                }
              }}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}; 