// Sheets sync helper — ponytail: fetch only, mock fallback
import { prisma } from "./db";
import { getValidAccessToken } from "./google";

export const MASTER_SHEET_ID = "15DamHskowz8-_Xji_KqrXpm-u_TykAOYGfTcfisPhM4";
export const MASTER_SHEET_URL = `https://docs.google.com/spreadsheets/d/${MASTER_SHEET_ID}`;

export function extractSpreadsheetId(urlOrId: string): string | null {
  const trimmed = urlOrId.trim();
  // direct ID case (44 chars alphanumeric + _-)
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed) && !trimmed.includes("/")) return trimmed;
  const m = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return m ? m[1] : null;
}

function isMockMode() {
  return !process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === "";
}

async function sheetsPutValues(accessToken: string, spreadsheetId: string, range: string, values: (string | number)[][]) {
  // range e.g. Reviews!A1 or Performance!A1
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ range, majorDimension: "ROWS", values }),
  });
  if (!res.ok) throw new Error(`Sheets put failed ${res.status}: ${await res.text()}`);
  return res.json();
}
async function sheetsClear(accessToken: string, spreadsheetId: string, range: string) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`;
  await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } });
}

async function ensureSheetsExist(accessToken: string, spreadsheetId: string, titles: string[]) {
  // GET spreadsheet to check sheets
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  const res = await fetch(getUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Sheets get failed: ${await res.text()}`);
  const json = await res.json();
  const existing: string[] = (json.sheets || []).map((s: any) => s.properties.title);
  const missing = titles.filter((t) => !existing.includes(t));
  if (missing.length === 0) return;
  // batchUpdate addSheet
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
  const body = { requests: missing.map((title) => ({ addSheet: { properties: { title } } })) };
  const r2 = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r2.ok) throw new Error(`Sheets batchUpdate failed: ${await r2.text()}`);
}

async function applyMasterFormatting(accessToken: string, users: { status: string; lastActiveAt: Date | null }[]) {
  // warna: suspend=putih, online hijau muda (<5m), offline merah muda
  const now = Date.now();
  const sheetRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${MASTER_SHEET_ID}`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!sheetRes.ok) return;
  const sj = await sheetRes.json();
  const sh = (sj.sheets || []).find((s:any)=> s.properties.title==="Users");
  const sheetId = sh?.properties?.sheetId;
  if (sheetId==null) return;
  const requests:any[] = [];
  users.forEach((u, idx)=>{
    const row = idx+1; // 0 header, jadi row 1..n di 0-index, need startRow 1
    let bg:any = null;
    if (u.status==="suspended") bg = {red:1, green:1, blue:1}; // putih
    else if (u.lastActiveAt && now - new Date(u.lastActiveAt).getTime() < 5*60*1000) bg = {red:0.85, green:0.95, blue:0.85}; // hijau muda
    else bg = {red:0.98, green:0.85, blue:0.85}; // merah muda
    requests.push({
      repeatCell: {
        range: { sheetId, startRowIndex: row, endRowIndex: row+1, startColumnIndex: 0, endColumnIndex: 10 },
        cell: { userEnteredFormat: { backgroundColor: bg } },
        fields: "userEnteredFormat.backgroundColor"
      }
    });
  });
  // header: A1:J1 dark navy
  requests.push({
    repeatCell: {
      range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 10 },
      cell: { userEnteredFormat: { backgroundColor: {red:0.06, green:0.12, blue:0.23}, textFormat:{ foregroundColor:{red:1, green:1, blue:1}, bold:true } } },
      fields: "userEnteredFormat.backgroundColor,userEnteredFormat.textFormat"
    }
  });
  // dropdown Status J2:J
  requests.push({
    setDataValidation: {
      range: { sheetId, startRowIndex: 1, endRowIndex: 1000, startColumnIndex: 9, endColumnIndex: 10 },
      rule: { condition:{ type:"ONE_OF_LIST", values:[{userEnteredValue:"AKTIF"},{userEnteredValue:"SUSPEND"},{userEnteredValue:"HAPUS"}]}, showCustomUi:true, strict:false, inputMessage:"Pilih AKTIF / SUSPEND / HAPUS" }
    }
  });
  // auto resize + freeze header
  requests.push({ updateSheetProperties:{ properties:{ sheetId, gridProperties:{ frozenRowCount:1 } }, fields:"gridProperties.frozenRowCount" }});
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${MASTER_SHEET_ID}:batchUpdate`, {
    method:"POST", headers:{Authorization:`Bearer ${accessToken}`, "Content-Type":"application/json"}, body: JSON.stringify({requests})
  });
}

export async function syncSheetsForUser(userId: string) {
  const sheets = await prisma.googleSheet.findMany({ where: { userId, isActive: true } });
  if (sheets.length === 0) throw new Error("No active spreadsheet. Connect one first.");

  // pick first active sheet (multi-tenant: one per user, but support many)
  const sheet = sheets[0];

  // get google account token (first one)
  const ga = await prisma.googleAccount.findFirst({ where: { userId } });
  let accessToken: string | null = null;
  if (ga) {
    try {
      accessToken = await getValidAccessToken(ga as any);
      if (accessToken !== ga.accessToken) await prisma.googleAccount.update({ where: { id: ga.id }, data: { accessToken, expiryDate: new Date(Date.now() + 3600 * 1000) } });
    } catch {}
  }

  // Build data from DB (source of truth)
  const [reviews, metrics, locations] = await Promise.all([
    prisma.review.findMany({ where: { location: { userId } }, include: { location: true }, orderBy: { createTime: "desc" }, take: 500 }),
    prisma.performanceMetric.findMany({ where: { location: { userId } }, include: { location: true }, orderBy: { date: "asc" }, take: 1000 }),
    prisma.location.findMany({ where: { userId } }),
  ]);

  // Reviews sheet headers per spec
  const reviewHeader = ["Location", "Reviewer", "Rating", "Comment", "Review Date", "Review Time", "Created At", "Updated At", "Review ID", "Status"];
  const reviewRows = reviews.map((r) => {
    const d = r.createTime ? new Date(r.createTime) : new Date(r.createdAt);
    return [
      r.location.title,
      r.reviewerName || "",
      String(r.rating),
      r.comment || "",
      d.toISOString().slice(0, 10),
      d.toISOString().slice(11, 19),
      r.createdAt.toISOString(),
      (r.updateTime || r.updatedAt).toISOString(),
      r.reviewId,
      r.hasReply ? "replied" : "new",
    ];
  });

  const perfHeader = ["Date", "Location", "Maps Views", "Search Views", "Website Clicks", "Phone Calls", "Direction Requests", "Other Available Metrics"];
  const perfRows = metrics.map((m) => [
    m.date.toISOString().slice(0, 10),
    m.location.title,
    String(m.mapsViews),
    String(m.searchViews),
    String(m.websiteClicks),
    String(m.phoneCalls),
    String(m.directionRequests),
    JSON.stringify(m.raw || {}),
  ]);

  // Mock mode: no real API call, just mark synced
  // ponytail: allow per-user OAuth config to override env mock
  let hasClientId = !isMockMode();
  if (!hasClientId) {
    const cfg = await prisma.userGoogleConfig.findUnique({ where: { userId } });
    hasClientId = !!cfg?.clientId;
  }
  if (!hasClientId || !accessToken || accessToken === "mock_access") {
    await prisma.googleSheet.update({ where: { id: sheet.id }, data: { lastSyncedAt: new Date(), status: "connected (mock)", errorMessage: null } });
    await prisma.activityLog.create({ data: { userId, type: "sheets_synchronized", status: "success", message: `Mock sync ${reviews.length} reviews, ${metrics.length} metrics to ${sheet.spreadsheetId}` } });
    return { mock: true, sheetId: sheet.spreadsheetId, reviews: reviews.length, metrics: metrics.length };
  }

  // Real Sheets API
  try {
    await ensureSheetsExist(accessToken, sheet.spreadsheetId, ["Reviews", "Performance"]);
    await sheetsPutValues(accessToken, sheet.spreadsheetId, "Reviews!A1", [reviewHeader, ...reviewRows]);
    await sheetsPutValues(accessToken, sheet.spreadsheetId, "Performance!A1", [perfHeader, ...perfRows]);
    await prisma.googleSheet.update({ where: { id: sheet.id }, data: { lastSyncedAt: new Date(), status: "connected", errorMessage: null } });
    await prisma.activityLog.create({ data: { userId, type: "sheets_synchronized", status: "success", message: `Sheets sync ${reviews.length} reviews, ${metrics.length} metrics` } });
    return { mock: false, sheetId: sheet.spreadsheetId, reviews: reviews.length, metrics: metrics.length };
  } catch (e: any) {
    await prisma.googleSheet.update({ where: { id: sheet.id }, data: { status: "failed", errorMessage: e.message } });
    await prisma.activityLog.create({ data: { userId, type: "sheets_synchronized", status: "failed", message: e.message } });
    throw e;
  }
}

// --- Master rekap: semua akun (baru + sudah terdaftar) → 15DamH...!Users ---
export async function syncMasterUserSheet(triggerUserId?: string) {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, include: { googleAccounts: true, telegramConfigs: true, locations: true, googleSheets: true } });
  const header = ["Email","Name","CreatedAt","EmailVerified","GoogleAccounts","Telegram","Locations","Sheets","UserId","Status"];
  const now = Date.now();
  const rows = users.map((u) => {
    const statusLabel = u.status === "suspended" ? "SUSPEND" : "AKTIF";
    return [u.email, u.name, u.createdAt.toISOString(), String(u.emailVerified), String(u.googleAccounts.length), String(u.telegramConfigs.length), String(u.locations.length), String(u.googleSheets.length), u.id, statusLabel];
  });
  const values = [header, ...rows];

  // cari token yang bisa tulis ke MASTER_SHEET_ID — prioritas triggerUser, lalu admin pertama, lalu siapa saja
  const candidates: string[] = [];
  if (triggerUserId) candidates.push(triggerUserId);
  const firstUser = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (firstUser && !candidates.includes(firstUser.id)) candidates.push(firstUser.id);

  let accessToken: string | null = null;
  let ownerUserId: string | null = null;
  let ownerEmail = "";
  for (const uid of candidates) {
    const ga = await prisma.googleAccount.findFirst({ where: { userId: uid } });
    if (!ga) continue;
    try {
      const t = await getValidAccessToken(ga as any);
      if (t && t !== "mock_access") { accessToken = t; ownerUserId = uid; const u = users.find((x) => x.id === uid); ownerEmail = u?.email || ga.email; break; }
    } catch {}
  }
  // fallback: cari googleAccount mana saja yang valid
  if (!accessToken) {
    const anyGa = await prisma.googleAccount.findFirst({ orderBy: { createdAt: "asc" } });
    if (anyGa) {
      try { const t = await getValidAccessToken(anyGa as any); if (t && t !== "mock_access") { accessToken = t; ownerUserId = anyGa.userId; ownerEmail = anyGa.email; } } catch {}
    }
  }

  const hasClientId = !!process.env.GOOGLE_CLIENT_ID || !!(ownerUserId && (await prisma.userGoogleConfig.findUnique({ where: { userId: ownerUserId } }))?.clientId);
  const logUserId = triggerUserId || ownerUserId || users[0]?.id || firstUser?.id;
  if (!accessToken || !hasClientId) {
    if (logUserId) await prisma.activityLog.create({ data: { userId: logUserId, type: "master_users_sync_mock", status: "success", message: `Mock master sync ${users.length} users → ${MASTER_SHEET_ID} (butuh Connect Google + share sheet ke ${ownerEmail || "admin"} sebagai Editor)` } });
    return { mock: true, sheetId: MASTER_SHEET_ID, sheetUrl: MASTER_SHEET_URL, count: users.length, header, rows, csv: [header.join(","), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g,'""')}"`).join(","))].join("\n") };
  }

  try {
    await ensureSheetsExist(accessToken, MASTER_SHEET_ID, ["Users"]);
    await sheetsClear(accessToken, MASTER_SHEET_ID, "Users!A2:J1000");
    await sheetsPutValues(accessToken, MASTER_SHEET_ID, "Users!A1", values);
    try { await applyMasterFormatting(accessToken, users); } catch {}
    if (logUserId) await prisma.activityLog.create({ data: { userId: logUserId, type: "master_users_sync", status: "success", message: `Synced ${users.length} users → ${MASTER_SHEET_ID} Users!A1 via ${ownerEmail}` } });
    return { mock: false, sheetId: MASTER_SHEET_ID, sheetUrl: MASTER_SHEET_URL, count: users.length, header, rows };
  } catch (e: any) {
    if (logUserId) await prisma.activityLog.create({ data: { userId: logUserId, type: "master_users_sync", status: "failed", message: e.message } });
    throw e;
  }
}

// pull: Sheet Users! → DB (tambah/hapus/suspend via Sheet langsung terdaftar + realtime) — ponytail: minimal, no new dep
export async function pullUsersFromMasterSheet(triggerUserId?: string) {
  // cari token
  const candidates: string[] = [];
  if (triggerUserId) candidates.push(triggerUserId);
  const firstUser = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (firstUser && !candidates.includes(firstUser.id)) candidates.push(firstUser.id);
  let accessToken: string | null = null;
  let ownerUserId: string | null = null;
  for (const uid of candidates) {
    const ga = await prisma.googleAccount.findFirst({ where: { userId: uid } });
    if (!ga) continue;
    try { const t = await getValidAccessToken(ga as any); if (t && t !== "mock_access") { accessToken = t; ownerUserId = uid; break; } } catch {}
  }
  if (!accessToken) {
    const anyGa = await prisma.googleAccount.findFirst({ orderBy: { createdAt: "asc" } });
    if (anyGa) try { const t = await getValidAccessToken(anyGa as any); if (t && t !== "mock_access") { accessToken = t; ownerUserId = anyGa.userId; } } catch {}
  }
  if (!accessToken) throw new Error("No valid Google token — Connect Google dulu sebagai admin");

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${MASTER_SHEET_ID}/values/${encodeURIComponent("Users!A1:J")}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Sheets read failed ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const values: string[][] = json.values || [];
  if (values.length < 1) return { created: 0, deleted: 0, updated: 0, message: "Sheet kosong (hanya header?)" };
  const header = values[0].map((h) => h.toLowerCase());
  const emailIdx = header.indexOf("email");
  const nameIdx = header.indexOf("name");
  const statusIdx = header.indexOf("status"); // J
  if (emailIdx === -1) throw new Error("Header Email tidak ditemukan di Users!A1");

  const sheetRows = values.slice(1).filter((r) => r[emailIdx] && r[emailIdx].includes("@"));
  // HAPUS = di sheet tapi minta hapus → perlakukan sebagai tidak ada
  const sheetActiveRows = sheetRows.filter((r) => (r[statusIdx]||"").toUpperCase() !== "HAPUS");
  const sheetEmails = new Set(sheetActiveRows.map((r) => r[emailIdx].trim().toLowerCase()));
  const sheetMap = new Map(sheetRows.map((r) => [r[emailIdx].trim().toLowerCase(), (r[nameIdx] || r[emailIdx].split("@")[0]).trim()]));
  const sheetStatusMap = new Map(sheetRows.map((r) => [r[emailIdx].trim().toLowerCase(), (r[statusIdx]||"AKTIF").toUpperCase()]));

  const dbUsers = await prisma.user.findMany();
  const dbMap = new Map(dbUsers.map((u) => [u.email.trim().toLowerCase(), u]));

  const ADMIN_SET = new Set((process.env.ADMIN_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean));
  // jangan auto-hapus admin & jangan hapus massal jika sheet tiba-tiba kosong
  if (sheetEmails.size === 0 && dbUsers.length > 3) throw new Error(`Safety: Sheet kosong tapi DB ada ${dbUsers.length} users — batal hapus massal. Isi Sheet dulu atau sync DB→Sheet.`);

  let created = 0, deleted = 0, updated = 0;
  const { hashPassword } = await import("./auth");
  const { default: crypto } = await import("crypto");

  for (const email of sheetEmails) {
    if (!dbMap.has(email)) {
      const name = sheetMap.get(email) || email.split("@")[0];
      const st = (sheetStatusMap.get(email) || "AKTIF").toUpperCase();
      const status = st === "SUSPEND" ? "suspended" : "active";
      const randomPass = crypto.randomBytes(9).toString("base64url"); // 12 chars
      const hashed = await hashPassword(randomPass);
      // avatar optional — pakai null (schema nullable)
      const u = await prisma.user.create({ data: { email, name, password: hashed, status } });
      await prisma.activityLog.create({ data: { userId: triggerUserId || ownerUserId || u.id, type: "user_imported_from_sheet", status: "success", message: `Imported ${email} dari Sheet → DB (pass:*${randomPass.slice(-4)})` } });
      created++;
    } else {
      const dbU = dbMap.get(email)!;
      const sheetName = sheetMap.get(email)!;
      if (sheetName && sheetName !== dbU.name) {
        await prisma.user.update({ where: { id: dbU.id }, data: { name: sheetName } });
        updated++;
      }
      const sheetStatus = (sheetStatusMap.get(email) || "AKTIF").toUpperCase();
      const wantSuspended = sheetStatus === "SUSPEND";
      const isSuspended = (dbU as any).status === "suspended";
      if (wantSuspended && !isSuspended) {
        await prisma.user.update({ where: { id: dbU.id }, data: { status: "suspended" } });
        await prisma.activityLog.create({ data: { userId: triggerUserId || ownerUserId || dbU.id, type: "user_suspended_from_sheet", status: "success", message: `Suspended ${email} via Sheet` } });
        updated++;
      } else if (!wantSuspended && isSuspended) {
        await prisma.user.update({ where: { id: dbU.id }, data: { status: "active", lastActiveAt: new Date() } });
        await prisma.activityLog.create({ data: { userId: triggerUserId || ownerUserId || dbU.id, type: "user_unsuspended_from_sheet", status: "success", message: `Unsuspended ${email} via Sheet` } });
        updated++;
      }
    }
  }
  for (const [email, u] of dbMap) {
    if (!sheetEmails.has(email) && !ADMIN_SET.has(email)) {
      await prisma.user.delete({ where: { id: u.id } });
      await prisma.activityLog.create({ data: { userId: triggerUserId || ownerUserId || u.id, type: "user_deleted_from_sheet", status: "success", message: `Deleted ${email} karena dihapus dari Sheet` } });
      deleted++;
    }
  }
  // re-push sisa DB ke Sheet biar rapi (jika ada create/delete)
  if (created || deleted || updated) await syncMasterUserSheet(triggerUserId || ownerUserId || undefined);
  if (triggerUserId || ownerUserId) await prisma.activityLog.create({ data: { userId: (triggerUserId || ownerUserId)!, type: "sheet_pull", status: "success", message: `Pull ${created} created, ${deleted} deleted, ${updated} updated` } });
  return { created, deleted, updated, totalSheet: sheetEmails.size, totalDb: dbUsers.length };
}
