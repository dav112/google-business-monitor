import { prisma } from "./db";
import { fetchReviews, getValidAccessToken } from "./google";

export async function syncReviewsForLocation(locationId: string, userId: string) {
  const loc = await prisma.location.findFirst({ where: { id: locationId, userId }, include: { businessAccount: { include: { googleAccount: true } } } });
  if (!loc) throw new Error("Location not found");
  if (!loc.businessAccount?.googleAccount) throw new Error("No Google account linked");

  const ga = loc.businessAccount.googleAccount;
  let token: string;
  try {
    token = await getValidAccessToken(ga as any);
  } catch (e: any) {
    await prisma.activityLog.create({ data: { userId, locationId: loc.id, type: "review_sync_failed", status: "failed", message: e.message } });
    throw e;
  }

  let fetched: Awaited<ReturnType<typeof fetchReviews>>;
  try {
    fetched = await fetchReviews(token, loc.name);
  } catch (e: any) {
    await prisma.activityLog.create({ data: { userId, locationId: loc.id, type: "review_sync_failed", status: "failed", message: e.message } });
    throw e;
  }

  // update token if refreshed
  if (token !== ga.accessToken) {
    await prisma.googleAccount.update({ where: { id: ga.id }, data: { accessToken: token, expiryDate: new Date(Date.now() + 3600 * 1000) } });
  }

  let newCount = 0, updatedCount = 0;
  for (const r of fetched) {
    const existing = await prisma.review.findUnique({ where: { reviewId: r.reviewId } });
    if (existing) {
      if (existing.updateTime?.toISOString() !== new Date(r.updateTime).toISOString() || existing.comment !== r.comment) {
        await prisma.review.update({
          where: { reviewId: r.reviewId },
          data: {
            reviewerName: r.reviewerName,
            reviewerPhoto: r.reviewerPhoto,
            rating: r.rating,
            comment: r.comment,
            createTime: new Date(r.createTime),
            updateTime: new Date(r.updateTime),
            reply: r.reply,
            hasReply: !!r.reply,
          },
        });
        updatedCount++;
      }
    } else {
      const created = await prisma.review.create({
        data: {
          reviewId: r.reviewId,
          locationId: loc.id,
          reviewerName: r.reviewerName,
          reviewerPhoto: r.reviewerPhoto,
          rating: r.rating,
          comment: r.comment,
          createTime: new Date(r.createTime),
          updateTime: new Date(r.updateTime),
          reply: r.reply,
          hasReply: !!r.reply,
        },
      });
      newCount++;
      await prisma.activityLog.create({ data: { userId, locationId: loc.id, type: "new_review_received", status: "success", message: `New ⭐${r.rating} review from ${r.reviewerName}` } });
      // Phase 6: Telegram auto for ⭐1-3 (dedup via notifications)
      try {
        const { sendReviewAlertIfNeeded } = await import("./telegram");
        await sendReviewAlertIfNeeded({
          userId,
          reviewId: created.id,
          rating: r.rating,
          locationTitle: loc.title,
          reviewerName: r.reviewerName,
          comment: r.comment,
          createTime: new Date(r.createTime),
          reviewLink: `https://www.google.com/maps/place/?q=place_id:${loc.placeId || loc.name}`,
        });
      } catch (e: any) {
        console.warn("[review-sync] telegram failed:", e.message);
      }
    }
  }

  // update location aggregates
  const agg = await prisma.review.aggregate({ where: { locationId: loc.id }, _avg: { rating: true }, _count: true });
  await prisma.location.update({
    where: { id: loc.id },
    data: {
      rating: agg._avg.rating ?? undefined,
      reviewCount: agg._count,
      lastSyncedAt: new Date(),
    },
  });

  await prisma.activityLog.create({
    data: { userId, locationId: loc.id, type: "review_synchronized", status: "success", message: `Synced ${fetched.length} reviews (${newCount} new, ${updatedCount} updated)` },
  });

  // Phase 7: auto Sheets if user has active sheet (best effort, don't fail sync)
  if (newCount > 0) {
    try {
      const hasSheet = await prisma.googleSheet.findFirst({ where: { userId, isActive: true } });
      if (hasSheet) {
        const { syncSheetsForUser } = await import("./sheets");
        await syncSheetsForUser(userId);
      }
    } catch (e: any) {
      console.warn("[review-sync] auto sheets failed:", e.message);
    }
  }

  return { total: fetched.length, newCount, updatedCount };
}

export async function syncAllReviewsForUser(userId: string) {
  const locs = await prisma.location.findMany({ where: { userId, isMonitored: true } });
  const results = [];
  for (const l of locs) {
    try {
      const r = await syncReviewsForLocation(l.id, userId);
      results.push({ locationId: l.id, ...r });
    } catch (e: any) {
      results.push({ locationId: l.id, error: e.message });
    }
  }
  return results;
}
