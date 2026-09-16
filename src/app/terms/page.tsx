export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto p-8 space-y-6 text-sm leading-relaxed">
      <h1 className="text-2xl font-bold">Terms of Service</h1>
      <section className="space-y-2"><h2 className="font-semibold">Layanan</h2><p>Google Business Monitor membantu monitor Google Business Profile via API resmi. Tidak mengklaim akses ke data pribadi Maps yang tidak disediakan Google.</p></section>
      <section className="space-y-2"><h2 className="font-semibold">Tanggung jawab user</h2><p>User wajib menjaga akun, tidak share password, dan hanya authorize Google/Sheets/Telegram yang mereka miliki.</p></section>
      <section className="space-y-2"><h2 className="font-semibold">Batasan</h2><p>Metrics adalah agregat; tidak ada tracking individual viewer. Fitur Pub/Sub butuh approval Google & GCP Pub/Sub config.</p></section>
      <p><a href="/privacy" className="underline">Privacy</a></p>
    </div>
  );
}
