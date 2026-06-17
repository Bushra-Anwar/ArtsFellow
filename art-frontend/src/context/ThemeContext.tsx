import React, { createContext, useContext, useState, useEffect } from "react";

type Theme = {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  bg?: string;
  text?: string;
};

const themes: Record<string, Theme> = {
  "Art:Fellow": {
    name: "Art:Fellow",
    primary: "#008080",
    secondary: "#004d4d",
    accent: "#e0f2f1",
  },
  "Fire Ember": {
    name: "Fire Ember",
    primary: "#f44336",
    secondary: "#b71c1c",
    accent: "#ffebee",
  },
  "Pearl Essence": {
    name: "Pearl Essence",
    primary: "#9e9e9e",
    secondary: "#424242",
    accent: "#f5f5f5",
  },
  "Ethereal Mist": {
    name: "Ethereal Mist",
    primary: "#dce5d8",
    secondary: "#8a9a8a",
    accent: "#f1f8e9",
  },
  "Mossy Depths": {
    name: "Mossy Depths",
    primary: "#2d5a3f",
    secondary: "#1b3a26",
    accent: "#e8f5e9",
  },
  "Soft Sunrise": {
    name: "Soft Sunrise",
    primary: "#ff8a65",
    secondary: "#e64a19",
    accent: "#fff3e0",
  },
  "Forest Noir": {
    name: "Forest Noir",
    primary: "#112217",
    secondary: "#0a140d",
    accent: "#f1f8e9",
  },
};

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (name: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentThemeState] = useState<Theme>(themes["Art:Fellow"]);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : true; // Default dark
  });

  const setTheme = (name: string) => {
    if (themes[name]) {
      setCurrentThemeState(themes[name]);
      applyTheme(themes[name], isDarkMode);
    }
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("darkMode", JSON.stringify(newMode));
    applyTheme(currentTheme, newMode);
  };

  const applyTheme = (theme: Theme, dark: boolean) => {
    const root = document.documentElement;
    root.style.setProperty("--color-primary", theme.primary);
    root.style.setProperty("--primary", theme.primary);
    root.style.setProperty("--secondary", theme.secondary);
    root.style.setProperty("--color-accent", theme.accent);
    
    if (dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  useEffect(() => {
    applyTheme(currentTheme, isDarkMode);
  }, []);

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};
