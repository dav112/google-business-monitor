import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function BillingPage() {
  const user = await getCurrentUser();
  const locCount = await prisma.location.count({ where: { userId: user!.id } });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Billing</h1>
      <p className="text-sm text-zinc-600">Kelola paket langganan. Saat ini semua fitur gratis (ponytail: pembayaran add when needed). Lokasi terpakai: <b>{locCount}</b></p>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { name: "Free", price: "Rp 0 / bulan", features: ["2 lokasi", "Sync manual", "Telegram alert ⭐1-3", "Google Sheets 1"], cta: "Paket Aktif", active: true },
          { name: "Pro", price: "Rp 99k / bulan", features: ["10 lokasi", "Auto sync 15m", "Pub/Sub realtime", "Sheets unlimited"], cta: "Upgrade", active: false },
          { name: "Enterprise", price: "Custom", features: ["Unlimited lokasi", "Team + role", "Priority support", "SLA"], cta: "Hubungi", active: false },
        ].map(p => (
          <div key={p.name} className={`border rounded-xl p-5 bg-white ${p.active ? "ring-2 ring-zinc-900" : ""}`}>
            <div className="font-bold">{p.name} {p.active && <span className="ml-2 text-xs bg-zinc-900 text-white px-2 py-0.5 rounded-full">Aktif</span>}</div>
            <div className="text-lg font-semibold mt-1">{p.price}</div>
            <ul className="text-sm mt-3 space-y-1 list-disc pl-5">{p.features.map(f => <li key={f}>{f}</li>)}</ul>
            <button disabled={p.active} className={`mt-4 w-full py-2 rounded text-sm font-medium border ${p.active ? "bg-zinc-100 text-zinc-400" : "bg-zinc-900 text-white"}`}>{p.cta}</button>
          </div>
        ))}
      </div>

      <div className="border rounded-xl bg-white">
        <div className="p-4 border-b font-medium text-sm">Riwayat Tagihan</div>
        <table className="w-full text-sm">
          <thead className="text-xs text-zinc-500 border-b"><tr><th className="text-left p-3">Tanggal</th><th className="text-left p-3">Paket</th><th className="text-left p-3">Jumlah</th><th className="text-left p-3">Status</th></tr></thead>
          <tbody><tr className="border-b"><td className="p-3">—</td><td className="p-3">Free</td><td className="p-3">Rp 0</td><td className="p-3"><span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">Aktif</span></td></tr></tbody>
        </table>
        <div className="p-3 text-xs text-zinc-500">Pembayaran Stripe/Midtrans belum diintegrasi — add when upgrade flow dibutuhkan. Skipped: payment gateway.</div>
      </div>
    </div>
  );
}
