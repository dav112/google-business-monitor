export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto p-8 space-y-6 text-sm leading-relaxed">
      <h1 className="text-2xl font-bold">Privacy Policy — Google Business Monitor</h1>
      <p className="text-zinc-500">Last updated: 2026-09-14</p>
      <section className="space-y-2"><h2 className="font-semibold">1. Data yang dikumpulkan</h2><p>Kami mengumpulkan: akun (name/email/password hash), token OAuth Google (terenkripsi at-rest), data Business Profile (lokasi, review, performance agregat via API resmi), Telegram bot token/chatId terenkripsi, spreadsheet ID. Tidak mengumpulkan password Google, histori Maps pribadi, atau identitas viewer individual — hanya data agregat yang Google berikan.</p></section>
      <section className="space-y-2"><h2 className="font-semibold">2. Mengapa data digunakan</h2><p>Untuk monitoring review, menampilkan analytics, mengirim alert Telegram ⭐1-3, dan sinkron ke Google Sheets. Semua atas izin OAuth consent screen Google.</p></section>
      <section className="space-y-2"><h2 className="font-semibold">3. Penyimpanan credential</h2><p>Refresh token & bot token dienkripsi AES-256-GCM dengan key dari <code>ENCRYPTION_KEY</code> env, tidak pernah ke frontend, tidak di log, tidak di Git. Access token hanya di server memory/expiry.</p></section>
      <section className="space-y-2"><h2 className="font-semibold">4. Disconnect & Delete</h2><p>User dapat Disconnect Google (hapus credential, hentikan sync) dan Delete Account (hapus credential + data owned) via /settings/security. Data historis tanpa credential dapat dipertahankan sesuai retensi.</p></section>
      <section className="space-y-2"><h2 className="font-semibold">5. Sharing</h2><p>Data tidak dijual. Hanya dikirim ke Telegram/Sheets atas konfigurasi user. Pub/Sub webhook validasi token & dedup reviewId.</p></section>
      <p><a href="/terms" className="underline">Terms</a> · <a href="/login" className="underline">Back</a></p>
    </div>
  );
}
