import { prisma } from "./db";

// ponytail: fetch only, notifications table = dedup
export async function sendTelegramMessage(botToken: string, chatId: string, text: string) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
  if (!res.ok) throw new Error(`Telegram failed ${res.status}: ${await res.text()}`);
  return res.json();
}

export function formatReviewAlert(p: { location: string; rating: number; reviewer: string; comment: string; date: string; time: string; link?: string }) {
  // Exact format per spec section 7
  return `🚨 GOOGLE REVIEW ALERT

📍 Location:
${p.location}

⭐ Rating:
${p.rating}/5

👤 Reviewer:
${p.reviewer}

💬 Comment:
${p.comment}

🕐 Date:
${p.date}

🕐 Time:
${p.time}

🔗 Review:
${p.link || "-"}`;
}

export async function shouldAlertForRating(userId: string, rating: number): Promise<boolean> {
  const cfg = await prisma.telegramConfig.findFirst({ where: { userId, isActive: true } });
  if (!cfg) return false;
  if (rating === 1) return cfg.alertOn1;
  if (rating === 2) return cfg.alertOn2;
  if (rating === 3) return cfg.alertOn3;
  if (rating === 4) return cfg.alertOn4;
  if (rating === 5) return cfg.alertOn5;
  return false;
}

export async function sendReviewAlertIfNeeded(opts: {
  userId: string;
  reviewId: string; // our DB id, but dedup via Review.reviewId + channel
  rating: number;
  locationTitle: string;
  reviewerName: string;
  comment: string;
  createTime: Date;
  reviewLink?: string;
}) {
  if (!(await shouldAlertForRating(opts.userId, opts.rating))) return { skipped: "rating not enabled" as const };

  // dedup: check notifications exists for this review
  const review = await prisma.review.findUnique({ where: { id: opts.reviewId } });
  if (!review) return { skipped: "review not found" as const };
  const existing = await prisma.notification.findFirst({ where: { reviewId: review.id, channel: "telegram", status: "sent" } });
  if (existing) return { skipped: "already sent" as const };

  const cfg = await prisma.telegramConfig.findFirst({ where: { userId: opts.userId, isActive: true } });
  if (!cfg) return { skipped: "no telegram config" as const };

  const d = opts.createTime;
  const date = d.toLocaleDateString("id-ID");
  const time = d.toLocaleTimeString("id-ID");

  const text = formatReviewAlert({
    location: opts.locationTitle,
    rating: opts.rating,
    reviewer: opts.reviewerName,
    comment: opts.comment || "-",
    date,
    time,
    link: opts.reviewLink,
  });

  const { decryptIfNeeded } = await import("./crypto");
  const token = decryptIfNeeded(cfg.botToken);
  const chat = decryptIfNeeded(cfg.chatId);
  // Mock mode: if token is mock, don't call real API, just log as sent
  const isMock = token.startsWith("mock") || token.length < 20;
  if (isMock) {
    await prisma.notification.create({ data: { reviewId: review.id, channel: "telegram", status: "sent", sentAt: new Date() } });
    await prisma.activityLog.create({ data: { userId: opts.userId, type: "telegram_notification_sent", status: "success", message: `Mock Telegram ⭐${opts.rating} ${opts.locationTitle} → ${chat}` } });
    return { mock: true as const, sent: true };
  }

  try {
    await sendTelegramMessage(token, chat, text);
    await prisma.notification.create({ data: { reviewId: review.id, channel: "telegram", status: "sent", sentAt: new Date() } });
    await prisma.activityLog.create({ data: { userId: opts.userId, type: "telegram_notification_sent", status: "success", message: `Telegram ⭐${opts.rating} ${opts.locationTitle}` } });
    return { sent: true as const };
  } catch (e: any) {
    await prisma.notification.create({ data: { reviewId: review.id, channel: "telegram", status: "failed", error: e.message } });
    await prisma.activityLog.create({ data: { userId: opts.userId, type: "telegram_notification_sent", status: "failed", message: e.message } });
    throw e;
  }
}

export async function testTelegram(userId: string) {
  const cfg = await prisma.telegramConfig.findFirst({ where: { userId } });
  if (!cfg) throw new Error("No config");
  const { decryptIfNeeded } = await import("./crypto");
  const token = decryptIfNeeded(cfg.botToken);
  const chat = decryptIfNeeded(cfg.chatId);
  const isMock = token.startsWith("mock") || token.length < 20;
  if (isMock) return { mock: true, message: "Mock mode: token looks like mock, would send but skipped. Use real Bot Token to test." };
  await sendTelegramMessage(token, chat, "✅ Google Business Monitor — Telegram connected! Test message OK.");
  return { ok: true };
}
