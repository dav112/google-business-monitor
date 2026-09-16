// Google Business Profile abstraction - real API + mock fallback for dev
// ponytail: fetch only, no googleapis lib

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/business.manage",
  "https://www.googleapis.com/auth/businesscommunications",
  "https://www.googleapis.com/auth/spreadsheets",
].join(" ");

export async function getGoogleConfigForUser(userId: string): Promise<{ clientId: string; clientSecret: string; redirectUri: string }> {
  const { prisma } = await import("./db");
  const { decryptIfNeeded } = await import("./crypto");
  const cfg = await prisma.userGoogleConfig.findUnique({ where: { userId } });
  if (cfg) {
    return {
      clientId: cfg.clientId,
      clientSecret: decryptIfNeeded(cfg.clientSecret),
      redirectUri: cfg.redirectUri || process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`,
    };
  }
  return {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirectUri: process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`,
  };
}

export async function getGoogleAuthUrl(state: string, userId?: string) {
  let cid = process.env.GOOGLE_CLIENT_ID || "";
  let redirect = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`;
  if (userId) {
    const cfg = await getGoogleConfigForUser(userId);
    cid = cfg.clientId || cid;
    redirect = cfg.redirectUri || redirect;
  }
  const params = new URLSearchParams({
    client_id: cid,
    redirect_uri: redirect,
    response_type: "code",
    scope: GOOGLE_SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeCodeForTokens(code: string, userId?: string) {
  let cid = process.env.GOOGLE_CLIENT_ID || "";
  let csec = process.env.GOOGLE_CLIENT_SECRET || "";
  let redirect = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`;
  if (userId) {
    const cfg = await getGoogleConfigForUser(userId);
    cid = cfg.clientId || cid;
    csec = cfg.clientSecret || csec;
    redirect = cfg.redirectUri || redirect;
  }
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: cid,
      client_secret: csec,
      redirect_uri: redirect,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
  return (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
    token_type: string;
  };
}

export async function refreshAccessToken(refreshToken: string, userId?: string) {
  let cid = process.env.GOOGLE_CLIENT_ID || "";
  let csec = process.env.GOOGLE_CLIENT_SECRET || "";
  if (userId) {
    const cfg = await getGoogleConfigForUser(userId);
    cid = cfg.clientId || cid;
    csec = cfg.clientSecret || csec;
  }
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: cid,
      client_secret: csec,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Refresh failed: ${await res.text()}`);
  return (await res.json()) as { access_token: string; expires_in: number };
}

export async function getValidAccessToken(googleAccount: { accessToken: string; refreshToken: string; expiryDate: Date | null; userId: string }): Promise<string> {
  if (googleAccount.expiryDate && new Date(googleAccount.expiryDate).getTime() - Date.now() > 60_000) {
    return googleAccount.accessToken;
  }
  if (!googleAccount.refreshToken) return googleAccount.accessToken;
  const { decryptIfNeeded } = await import("./crypto");
  const rawRefresh = decryptIfNeeded(googleAccount.refreshToken);
  const data = await refreshAccessToken(rawRefresh, googleAccount.userId);
  return data.access_token;
}

// --- Real Google APIs (no fake data per spec 2) ---

export type BusinessAccountDTO = { name: string; accountName: string }; // name: accounts/123
export type LocationDTO = { name: string; title: string; address: string; rating?: number; reviewCount?: number };

export async function fetchBusinessAccounts(accessToken: string): Promise<BusinessAccountDTO[]> {
  const res = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const txt = await res.text();
    // Jangan buat data palsu — throw agar UI tampil error jujur (spec 2. BATASAN DATA GOOGLE)
    throw new Error(`Google Business Profile API error (${res.status}): ${txt.slice(0,300)} — Pastikan API enabled & akun Owner/Manager di business.google.com`);
  }
  const json = await res.json();
  return (json.accounts || []).map((a: any) => ({ name: a.name, accountName: a.accountName }));
}

export async function fetchLocations(accessToken: string, accountName: string): Promise<LocationDTO[]> {
  const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,storefrontAddress,metadata,profile`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Business Information API error (${res.status}): ${txt.slice(0,300)}`);
  }
  const json = await res.json();
  return (json.locations || []).map((l: any) => ({
    name: l.name,
    title: l.title || l.name,
    address: l.storefrontAddress ? `${l.storefrontAddress.addressLines?.join(", ") || ""} ${l.storefrontAddress.locality || ""}`.trim() : "",
    rating: undefined,
    reviewCount: undefined,
  }));
}

export type MetricDTO = {
  date: string; // YYYY-MM-DD
  mapsViews: number;
  searchViews: number;
  websiteClicks: number;
  phoneCalls: number;
  directionRequests: number;
  raw?: any;
};

export type ReviewDTO = {
  reviewId: string;
  reviewerName: string;
  reviewerPhoto?: string;
  rating: number; // 1-5
  comment: string;
  createTime: string;
  updateTime: string;
  reply?: string;
};

const STAR_MAP: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

export async function fetchReviews(accessToken: string, locationName: string): Promise<ReviewDTO[]> {
  const url = `https://mybusiness.googleapis.com/v4/${locationName}/reviews`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Reviews API error (${res.status}): ${txt.slice(0,300)}`);
  }
  const json = await res.json();
  return (json.reviews || []).map((r: any) => ({
    reviewId: r.reviewId || r.name?.split("/").pop() || r.name,
    reviewerName: r.reviewer?.displayName || "Anonymous",
    reviewerPhoto: r.reviewer?.profilePhotoUrl,
    rating: STAR_MAP[r.starRating] || 5,
    comment: r.comment || "",
    createTime: r.createTime,
    updateTime: r.updateTime,
    reply: r.reviewReply?.comment,
  }));
}

export async function fetchPerformanceMetrics(
  accessToken: string,
  locationName: string,
  dateRange: { startDate: string; endDate: string }
): Promise<MetricDTO[]> {
  const locationId = locationName;
  const fullName = locationId.startsWith("accounts/") ? locationId : `locations/${locationId}`;
  const url = `https://businessprofileperformance.googleapis.com/v1/${fullName}:fetchMultiDailyMetricsTimeSeries`;
  const body = {
    dailyMetrics: ["BUSINESS_IMPRESSIONS_DESKTOP_MAPS", "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH", "BUSINESS_IMPRESSIONS_MOBILE_MAPS", "BUSINESS_IMPRESSIONS_MOBILE_SEARCH", "WEBSITE_CLICKS", "CALL_CLICKS", "BUSINESS_DIRECTION_REQUESTS"],
    dailyRange: { startDate: toGDate(dateRange.startDate), endDate: toGDate(dateRange.endDate) },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Performance API error (${res.status}): ${txt.slice(0,300)}`);
  }
  const json = await res.json();
  // Parse multiDailyMetricTimeSeries; map to our DTO aggregately
  // Simplified: take first series per metric type and sum daily
  const series: any[] = json.multiDailyMetricTimeSeries || [];
  const byDate: Record<string, MetricDTO> = {};
  // init dates
  const start = new Date(dateRange.startDate);
  const end = new Date(dateRange.endDate);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const k = d.toISOString().slice(0, 10);
    byDate[k] = { date: k, mapsViews: 0, searchViews: 0, websiteClicks: 0, phoneCalls: 0, directionRequests: 0, raw: json };
  }
  for (const s of series) {
    const metric = s.dailyMetric;
    for (const p of s.timeSeries?.datedValues || []) {
      const k = `${p.date.year}-${String(p.date.month).padStart(2, "0")}-${String(p.date.day).padStart(2, "0")}`;
      const v = parseInt(p.value || "0");
      const dto = byDate[k];
      if (!dto) continue;
      if (metric.includes("MAPS")) dto.mapsViews += v;
      else if (metric.includes("SEARCH")) dto.searchViews += v;
      else if (metric === "WEBSITE_CLICKS") dto.websiteClicks = v;
      else if (metric === "CALL_CLICKS") dto.phoneCalls = v;
      else if (metric === "BUSINESS_DIRECTION_REQUESTS") dto.directionRequests = v;
    }
  }
  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
}

function toGDate(iso: string) {
  const d = new Date(iso);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}
