export const THEMES = {
  colorful: {
    id: "colorful",
    outer: "#E6F0FF",
    header: "#FF6A00",
    yellow: "#FFD600",
    yellowLight: "#FFF0A0",
    cream: "#FFFBEB",
    navy: "#0F1E3A",
    blue: "#4DB8FF",
    heroBlue: "#4DB8FF",
    accentBar: "#FF6A00",
  },
  premium: {
    id: "premium",
    outer: "#F8FAFC",
    header: "#FFFFFF",
    yellow: "#FFFFFF",
    yellowLight: "#F8FAFC",
    cream: "#FFFFFF",
    navy: "#0F172A",
    blue: "#F1F5F9",
    heroBlue: "#F1F5F9",
    accentBar: "#FFFFFF",
  },
  dark: {
    id: "dark",
    outer: "#0F172A",
    header: "#1E293B",
    yellow: "#1E293B",
    yellowLight: "#334155",
    cream: "#1E293B",
    navy: "#F8FAFC",
    blue: "#334155",
    heroBlue: "#1E293B",
    accentBar: "#1E293B",
  },
} as const;

export type ThemeId = keyof typeof THEMES;
export function getTheme(id: string) {
  return (THEMES as any)[id] || THEMES.colorful;
}
