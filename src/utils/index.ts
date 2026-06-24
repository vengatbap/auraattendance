/**
 * Calculate the Haversine distance between two GPS coordinates in meters.
 */
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Find the nearest site within radius for a GPS position.
 */
export function detectSite<T extends { id: string; latitude: number; longitude: number; radius: number; status: string }>(
  lat: number,
  lon: number,
  sites: T[]
): T | null {
  const activeSites = sites.filter((s) => s.status === "active");
  for (const site of activeSites) {
    const dist = haversineDistance(lat, lon, site.latitude, site.longitude);
    if (dist <= site.radius) return site;
  }
  // Return the nearest even if outside radius (as fallback per spec)
  let nearest: T | null = null;
  let minDist = Infinity;
  for (const site of activeSites) {
    const dist = haversineDistance(lat, lon, site.latitude, site.longitude);
    if (dist < minDist) { minDist = dist; nearest = site; }
  }
  return nearest;
}

/**
 * Cosine similarity between two embedding vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] ** 2;
    normB += b[i] ** 2;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Find the best-matching employee embedding. Returns { employeeId, score }.
 * Threshold: 0.6 cosine similarity (InsightFace standard).
 */
export function matchEmbedding(
  queryEmbedding: number[],
  profiles: { employeeId: string; embedding: number[] }[],
  threshold = 0.6
): { employeeId: string; score: number } | null {
  let best: { employeeId: string; score: number } | null = null;
  for (const p of profiles) {
    const score = cosineSimilarity(queryEmbedding, p.embedding);
    if (score >= threshold && (!best || score > best.score)) {
      best = { employeeId: p.employeeId, score };
    }
  }
  return best;
}

/** Format date as YYYY-MM-DD */
export function toDateString(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}

/** Get browser/device info string */
export function getDeviceInfo(): string {
  if (typeof window === "undefined") return "server";
  return navigator.userAgent;
}
