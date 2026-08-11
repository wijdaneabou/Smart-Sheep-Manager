import type { Context } from "hono";

/**
 * GET /api/geocode/search?q=...
 * Proxy vers Nominatim (OpenStreetMap) — évite d'appeler l'API externe
 * directement depuis le mobile (headers Referer non fiables côté RN,
 * risque de blocage 403/429 qui casse le JSON.parse côté client).
 */
export async function searchLocationHandler(c: Context) {
  const q = c.req.query("q");
  if (!q || q.trim().length < 2) {
    return c.json({ data: [] }, 200);
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      q
    )}&limit=5&accept-language=fr`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "SmartSheepManager/1.0 (contact@smartsheepmanager.local)",
        Referer: "https://smartsheepmanager.local",
      },
    });

    if (!response.ok) {
      console.error(`Nominatim a renvoyé ${response.status}`);
      return c.json({ data: [] }, 200); // on renvoie une liste vide plutôt qu'une erreur bloquante
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      console.error("Réponse Nominatim non-JSON, probablement une page de blocage.");
      return c.json({ data: [] }, 200);
    }

    const data = await response.json();
    return c.json({ data: Array.isArray(data) ? data : [] }, 200);
  } catch (error) {
    console.error("Erreur proxy geocode :", error);
    return c.json({ data: [] }, 200);
  }
}