// src/utils/parseUserAgent.ts

export function parseDeviceName(userAgent: string | null): string {
  if (!userAgent) return "Appareil inconnu";

  const ua = userAgent.toLowerCase();

  // App mobile (React Native / Expo utilise souvent okhttp sur Android)
  if (ua.includes("okhttp")) return "Application Android";
  if (ua.includes("cfnetwork") || ua.includes("darwin")) return "Application iOS";

  // Navigateurs
  if (ua.includes("edg/")) return "Microsoft Edge";
  if (ua.includes("chrome") && !ua.includes("edg")) return "Google Chrome";
  if (ua.includes("firefox")) return "Mozilla Firefox";
  if (ua.includes("safari") && !ua.includes("chrome")) return "Safari";

  // OS générique en fallback
  if (ua.includes("android")) return "Appareil Android";
  if (ua.includes("iphone") || ua.includes("ipad")) return "Appareil Apple";
  if (ua.includes("windows")) return "Ordinateur Windows";
  if (ua.includes("mac os")) return "Ordinateur Mac";
  if (ua.includes("linux")) return "Ordinateur Linux";

  return "Appareil inconnu";
}

export function deviceIcon(userAgent: string | null): string {
  if (!userAgent) return "❓";
  const ua = userAgent.toLowerCase();

  if (ua.includes("okhttp") || ua.includes("android")) return "🤖";
  if (ua.includes("cfnetwork") || ua.includes("iphone") || ua.includes("ipad") || ua.includes("darwin")) return "🍎";
  if (ua.includes("windows")) return "🖥️";
  if (ua.includes("mac os")) return "💻";
  return "📱";
}