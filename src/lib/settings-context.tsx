"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

export type LinkPreference = "temp" | "perma";
export type ThemeMode = "dark" | "midnight" | "amoled" | "light";
export type AccentColor = "red" | "orange" | "amber" | "emerald" | "cyan" | "blue" | "violet" | "pink" | "rose";
export type ImageQuality = "original" | "high" | "medium";
export type LayoutMode = "compact" | "comfortable" | "immersive";
export type ReducedAnimationsMode = "auto" | "on" | "off";
export type QrLinkType = "view" | "embed" | "raw";
export type QrStyle = "squares" | "dots" | "rounded";
export type QrErrorLevel = "L" | "M" | "Q" | "H";
export type QrCornerStyle = "square" | "rounded" | "extra-rounded";

export interface QrSettings {
  defaultLinkType: QrLinkType;
  foregroundColor: string;
  backgroundColor: string;
  style: QrStyle;
  size: number;
  errorLevel: QrErrorLevel;
  showLogo: boolean;
  logoSize: number;
  margin: number;
  cornerStyle: QrCornerStyle;
  useAccentColor: boolean;
}

export interface UserSettings {
  linkPreference: LinkPreference;
  theme: ThemeMode;
  accentColor: AccentColor;
  imageQuality: ImageQuality;
  layoutMode: LayoutMode;
  animationsEnabled: boolean;
  reducedAnimationsMode: ReducedAnimationsMode;
  autoCompression: boolean;
  generateThumbnails: boolean;
  emailNotifications: boolean;
  publicIndexing: boolean;
  showUsername: boolean;
  imagesPerPage: number;
  qr: QrSettings;
}

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  getEmbedLink: (imageId: string, rawUrl: string) => string;
  isLoaded: boolean;
  accentHex: string;
}

export const accentColors: Record<AccentColor, { hex: string; rgb: string; name: string }> = {
  red: { hex: "#ff0040", rgb: "255, 0, 64", name: "Ruby" },
  orange: { hex: "#f97316", rgb: "249, 115, 22", name: "Sunset" },
  amber: { hex: "#f59e0b", rgb: "245, 158, 11", name: "Gold" },
  emerald: { hex: "#10b981", rgb: "16, 185, 129", name: "Emerald" },
  cyan: { hex: "#06b6d4", rgb: "6, 182, 212", name: "Ocean" },
  blue: { hex: "#3b82f6", rgb: "59, 130, 246", name: "Sky" },
  violet: { hex: "#8b5cf6", rgb: "139, 92, 246", name: "Violet" },
  pink: { hex: "#ec4899", rgb: "236, 72, 153", name: "Sakura" },
  rose: { hex: "#f43f5e", rgb: "244, 63, 94", name: "Rose" },
};

const defaultSettings: UserSettings = {
  linkPreference: "temp",
  theme: "dark",
  accentColor: "red",
  imageQuality: "original",
  layoutMode: "comfortable",
  animationsEnabled: true,
  reducedAnimationsMode: "auto",
  autoCompression: false,
  generateThumbnails: true,
  emailNotifications: true,
  publicIndexing: true,
  showUsername: true,
  imagesPerPage: 24,
  qr: {
    defaultLinkType: "view",
    foregroundColor: "#000000",
    backgroundColor: "#FFFFFF",
    style: "squares",
    size: 200,
    errorLevel: "H",
    showLogo: true,
    logoSize: 40,
    margin: 2,
    cornerStyle: "square",
    useAccentColor: false,
  },
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  const accentHex = accentColors[settings.accentColor]?.hex || accentColors.red.hex;

  useEffect(() => {
    const stored = localStorage.getItem("anipic-settings");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsed, qr: { ...defaultSettings.qr, ...parsed.qr } });
      } catch {
        setSettings(defaultSettings);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("anipic-settings", JSON.stringify(settings));
      document.documentElement.setAttribute("data-layout", settings.layoutMode);
      document.documentElement.setAttribute("data-animations", settings.animationsEnabled ? "true" : "false");
      document.documentElement.setAttribute("data-theme", settings.theme);
      
      const accent = accentColors[settings.accentColor] || accentColors.red;
      document.documentElement.style.setProperty("--accent-color", accent.hex);
      document.documentElement.style.setProperty("--accent-color-rgb", accent.rgb);
    }
  }, [settings, isLoaded]);

  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const getEmbedLink = useCallback((imageId: string, rawUrl: string) => {
    if (settings.linkPreference === "perma") return rawUrl;
    if (typeof window !== "undefined") return `${window.location.origin}/e/${imageId}`;
    return `/e/${imageId}`;
  }, [settings.linkPreference]);

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      updateSettings, 
      getEmbedLink, 
      isLoaded,
      accentHex,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within a SettingsProvider");
  return context;
}
