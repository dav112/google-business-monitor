import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { ReviewSyncButton } from "@/components/review-sync-button";
import Link from "next/link";

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ rating?: string; q?: string; sort?: string; locationId?: string; page?: string }>;
}) {
  const user = await getCurrentUser();
  const sp = await searchParams;
  const rating = sp.rating ? parseInt(sp.rating) : undefined;
  const q = sp.q?.trim();
  const sort = sp.sort || "newest";
  const locationId = sp.locationId;
  const page = Math.max(1, parseInt(sp.page || "1"));
  const take = 20;

  const orderBy: any =
    sort === "oldest" ? { createTime: "asc" } : sort === "highest" ? { rating: "desc" } : sort === "lowest" ? { rating: "asc" } : { createTime: "desc" };

  const where: any = { location: { userId: user!.id } };
  if (locationId) where.locationId = locationId;
  if (rating) where.rating = rating;
  if (q) {
    where.OR = [
      { reviewerName: { contains: q, mode: "insensitive" } },
      { comment: { contains: q, mode: "insensitive" } },
      { location: { title: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [reviews, total, locations, ratingGroups] = await Promise.all([
    prisma.review.findMany({ where, orderBy, skip: (page - 1) * take, take, include: { location: true } }),
    prisma.review.count({ where }),
    prisma.location.findMany({ where: { userId: user!.id }, select: { id: true, title: true } }),
    prisma.review.groupBy({ by: ["rating"], where: { location: { userId: user!.id } }, _count: true }),
  ]);

  const counts: Record<number, number> = {};
  ratingGroups.forEach((g) => (counts[g.rating] = g._count));
  const totalPages = Math.max(1, Math.ceil(total / take));

  function href(over: Record<string, string>) {
    const p = new URLSearchParams();
    if (over.rating ?? (rating ? String(rating) : undefined)) p.set("rating", over.rating ?? String(rating));
    if (over.q ?? q) p.set("q", over.q ?? q!);
    if (over.sort ?? sort) p.set("sort", over.sort ?? sort);
    if (over.locationId ?? locationId) p.set("locationId", over.locationId ?? locationId!);
    if (over.page) p.set("page", over.page);
    // remove empty
    const s = p.toString();
    return `/reviews${s ? "?" + s : ""}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-semibold">Reviews</h1>
        <ReviewSyncButton locationId={locationId} />
      </div>

      {/* Location filter */}
      <div className="flex flex-wrap gap-2 text-sm items-center">
        <span className="text-zinc-500">Location:</span>
        <Link href="/reviews" className={`px-3 py-1 rounded border ${!locationId ? "bg-zinc-900 text-white" : "bg-white"}`}>
          Semua
        </Link>
        {locations.map((l) => (
          <Link
            key={l.id}
            href={`/reviews?locationId=${l.id}`}
            className={`px-3 py-1 rounded border ${locationId === l.id ? "bg-zinc-900 text-white" : "bg-white"}`}
          >
            {l.title}
          </Link>
        ))}
      </div>

      {/* Rating filter with counts */}
      <div className="flex flex-wrap gap-2 text-sm">
        <a href="/reviews" className={`px-3 py-1 rounded border ${!rating ? "bg-zinc-900 text-white" : "bg-white"}`}>
          Semua ({total})
        </a>
        {[5, 4, 3, 2, 1].map((s) => (
          <a
            key={s}
            href={`/reviews?rating=${s}${locationId ? `&locationId=${locationId}` : ""}`}
            className={`px-3 py-1 rounded border ${rating === s ? "bg-zinc-900 text-white" : "bg-white"}`}
          >
            ⭐{s} ({counts[s] || 0})
          </a>
        ))}
      </div>

      {/* Search + Sort */}
      <form className="flex gap-2" action="/reviews" method="GET">
        {rating && <input type="hidden" name="rating" value={rating} />}
        {locationId && <input type="hidden" name="locationId" value={locationId} />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Search reviewer / komentar / lokasi"
          className="flex-1 border rounded px-3 py-2 text-sm"
        />
        <button className="border rounded px-4 text-sm">Search</button>
      </form>

      <div className="flex gap-2 text-xs flex-wrap">
        <span>Sort:</span>
        {[
          ["newest", "terbaru"],
          ["oldest", "terlama"],
          ["highest", "rating tertinggi"],
          ["lowest", "rating terendah"],
        ].map(([k, label]) => (
          <Link key={k} href={href({ sort: k })} className={sort === k ? "font-bold underline" : "underline"}>
            {label}
          </Link>
        ))}
      </div>

      <div className="text-xs text-zinc-500">
        {total} review{total !== 1 ? "s" : ""} · halaman {page}/{totalPages}
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-zinc-500">
            Belum ada review. Klik <b>Sync Now</b> untuk ambil dari Google (mock akan generate 6-9 review per lokasi).
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {reviews.map((r) => (
            <Card key={r.id}>
              <CardContent className="pt-4 text-sm space-y-1">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">
                    📍 {r.location.title} · 👤 {r.reviewerName ?? "Anonymous"} · ⭐{r.rating}{" "}
                    <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${r.rating <= 3 ? "bg-red-100 text-red-700" : r.rating === 4 ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                      {r.rating <= 3 ? "alert" : r.rating === 4 ? "ok" : "great"}
                    </span>
                    {r.hasReply && <span className="ml-1 text-xs bg-zinc-100 px-1.5 py-0.5 rounded">replied</span>}
                  </span>
                  <span className="text-xs text-zinc-400 shrink-0">{r.createTime?.toLocaleDateString("id-ID")}</span>
                </div>
                <div className="text-zinc-700">{r.comment || "-"}</div>
                {r.reply && <div className="text-xs bg-zinc-50 border rounded p-2">↳ Reply: {r.reply}</div>}
                <div className="text-xs text-zinc-400">
                  Review ID: {r.reviewId.slice(0, 40)}... · Created: {r.createTime?.toLocaleString("id-ID")} · Updated: {r.updateTime?.toLocaleString("id-ID")} · {r.hasReply ? "Response: yes" : "Response: no"}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex gap-2 justify-center text-sm">
          {page > 1 && <Link href={href({ page: String(page - 1) })} className="border rounded px-3 py-1">Prev</Link>}
          <span className="px-3 py-1">{page} / {totalPages}</span>
          {page < totalPages && <Link href={href({ page: String(page + 1) })} className="border rounded px-3 py-1">Next</Link>}
        </div>
      )}
    </div>
  );
}
