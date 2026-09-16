import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const rating = url.searchParams.get("rating");
  const q = url.searchParams.get("q");
  const sort = url.searchParams.get("sort") || "newest";
  const locationId = url.searchParams.get("locationId");
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const take = 20;
  const skip = (page - 1) * take;

  const where: any = { location: { userId: user.id } };
  if (locationId) where.locationId = locationId;
  if (rating) where.rating = parseInt(rating);
  if (q) where.OR = [
    { reviewerName: { contains: q, mode: "insensitive" } },
    { comment: { contains: q, mode: "insensitive" } },
    { location: { title: { contains: q, mode: "insensitive" } } },
  ];

  const orderBy: any = sort==="oldest" ? { createTime: "asc" } : sort==="highest" ? { rating: "desc" } : sort==="lowest" ? { rating: "asc" } : { createTime: "desc" };

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({ where, orderBy, skip, take, include: { location: true } }),
    prisma.review.count({ where }),
  ]);

  return Response.json({ reviews, total, page, take });
}
