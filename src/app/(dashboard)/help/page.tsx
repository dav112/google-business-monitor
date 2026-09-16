const C = { navy: "#0F1E3A", yellow: "#FFD600", cream: "#FFFBEB", header: "#FF6A00" };

export default function HelpPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="rounded-[20px] border-[3px] p-5" style={{ background: C.header, borderColor: C.navy }}>
        <h1 className="font-black tracking-tight leading-none" style={{ color: C.navy, fontSize: "28px" }}>HELP CENTER</h1>
        <p className="text-sm font-medium mt-1" style={{ color: C.navy }}>Tutorial relevan fitur sekarang — semua card di Menu sudah real + ada tabel input.</p>
      </div>

      {/* Google */}
      <div className="rounded-[20px] border-[3px] overflow-hidden bg-white" style={{ borderColor: C.navy }}>
        <div className="px-5 py-3 border-b-[3px] flex items-center gap-3" style={{ background: C.cream, borderColor: C.navy }}>
          <span className="w-8 h-8 rounded-xl border-2 flex items-center justify-center bg-white" style={{ borderColor: C.navy }}>📍</span>
          <div className="font-black text-sm" style={{ color: C.navy }}>Google Business — Konek & Import Lokasi</div>
          <span className="ml-auto text-xs font-bold px-2 py-1 rounded-full border-2 bg-white" style={{ borderColor: C.navy, color: C.navy }}>7 langkah • per-user</span>
        </div>
        <div className="p-5 space-y-4 text-sm leading-relaxed" style={{ color: C.navy }}>
          <div className="rounded-xl border-2 p-3 text-xs font-bold" style={{ background: C.cream, borderColor: C.navy }}>Sekarang config Google ada di <b>Settings → Google</b> (per-user, terenkripsi). <b>.env hanya fallback</b>. Isi di web, tanpa akses server.</div>
          <ol className="list-decimal pl-5 space-y-2">
            <li><a href="https://console.cloud.google.com/" target="_blank" className="underline font-bold" style={{ color: "#0057FF" }}>console.cloud.google.com</a> → pilih / buat Project <code>gb-monitor</code></li>
            <li>Enable 3 API → klik Enable tiap link: <a href="https://console.cloud.google.com/apis/library/mybusinessaccountmanagement.googleapis.com" target="_blank" className="underline" style={{ color: "#0057FF" }}>Account Management</a> • <a href="https://console.cloud.google.com/apis/library/mybusinessbusinessinformation.googleapis.com" target="_blank" className="underline" style={{ color: "#0057FF" }}>Business Info</a> • <a href="https://console.cloud.google.com/apis/library/businessprofileperformance.googleapis.com" target="_blank" className="underline" style={{ color: "#0057FF" }}>Performance</a></li>
            <li><a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" className="underline" style={{ color: "#0057FF" }}>OAuth consent</a> → Get Started → App name <code>Google Business Monitor</code> → Audience → Test users → Add email kamu</li>
            <li><a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="underline" style={{ color: "#0057FF" }}>Credentials → Create → OAuth Client ID</a> → Web application → Authorized redirect URI: <code className="px-1 py-0.5 rounded text-white" style={{ background: C.navy }}>http://localhost:3000/api/google/callback</code> → Create → copy <b>Client ID</b> + <b>Client Secret</b></li>
            <li>Buka <a href="/settings" className="underline" style={{ color: "#0057FF" }}>Settings → Google</a> → paste Client ID & Secret → Simpan Config Saya (terenkripsi AES-256). Atau isi <code>.env</code> + <code>openssl rand -hex 32</code> → ENCRYPTION_KEY → restart <code>npm run dev</code></li>
            <li>Buka <a href="/locations" className="underline" style={{ color: "#0057FF" }}>/locations → Connect Google</a> → Allow → <b>Load Locations</b> → centang toko → Import → toggle Monitoring ON</li>
            <li>Lanjut ke <a href="/reviews" className="underline" style={{ color: "#0057FF" }}>/reviews → Sync Now</a> (mock: 6-9 review/lokasi jika belum live) & <a href="/analytics" className="underline" style={{ color: "#0057FF" }}>/analytics → Sync</a> untuk Maps/Search views</li>
          </ol>
          <div className="flex gap-2">
            <a href="/settings" className="px-4 py-2 rounded-full text-xs font-black border-2 text-white" style={{ background: C.navy, borderColor: C.navy }}>Ke Settings Google →</a>
            <a href="/locations" className="px-4 py-2 rounded-full text-xs font-black border-2 bg-white" style={{ borderColor: C.navy, color: C.navy }}>Ke Locations</a>
          </div>
        </div>
      </div>

      {/* Telegram */}
      <div className="rounded-[20px] border-[3px] overflow-hidden bg-white" style={{ borderColor: C.navy }}>
        <div className="px-5 py-3 border-b-[3px] flex items-center gap-3" style={{ background: C.cream, borderColor: C.navy }}>
          <span className="w-8 h-8 rounded-xl border-2 flex items-center justify-center bg-white" style={{ borderColor: C.navy }}>✈️</span>
          <div className="font-black text-sm" style={{ color: C.navy }}>Telegram Alerts — Bot + Chat ID</div>
          <span className="ml-auto text-xs font-bold px-2 py-1 rounded-full border-2 bg-white" style={{ borderColor: C.navy, color: C.navy }}>⭐1-3 auto</span>
        </div>
        <div className="p-5 space-y-4 text-sm leading-relaxed" style={{ color: C.navy }}>
          <div className="rounded-xl border-2 p-3 text-xs font-bold" style={{ background: "#C8F7C5", borderColor: C.navy }}>Format alert: 🚨 GOOGLE REVIEW ALERT — Location, Rating, Reviewer, Comment, Date/Time, Link. Dedup by reviewId, tidak spam.</div>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Buka Telegram → chat <b>@BotFather</b> → <code>/newbot</code> → nama bot → copy <b>Bot Token</b> <code>123456:ABC...</code></li>
            <li>Chat bot kamu → kirim <code>/start</code> sekali (biar chat terdaftar)</li>
            <li>Dapat Chat ID — cara A: chat <b>@userinfobot</b> → copy ID, atau cara B: buka <code>https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</code> di browser → cari <code>chat {'{'}&quot;id&quot;: 123456{'}'}</code></li>
            <li>Buka <a href="/integrations/telegram" className="underline" style={{ color: "#0057FF" }}>/integrations/telegram</a> → isi <b>Bot Token</b> + <b>Chat ID</b> → <b>Save & Connect</b> → tombol <b>Test Telegram</b> → cek HP ✅</li>
            <li>Atur <b>Alert Toggles</b> di card kedua: ⭐1/2/3 ON default, ⭐4/5 OFF. Toggle <b>Enabled</b> untuk pause semua.</li>
            <li>Trigger auto: setiap <b>Sync Reviews</b> baru ⭐1-3 akan kirim Telegram + masuk tabel <b>Recent Notifications</b> + <b>Activity Log</b>. Jika gagal, status failed → tombol <b>Retry</b>.</li>
          </ol>
          <div className="rounded-xl border-2 p-3 text-xs" style={{ background: C.cream, borderColor: C.navy }}>
            <b>Tabel input:</b> Card Connect (2 input + 3 tombol) • Card Alert Toggles (6 checkbox) • Card Recent Notifications (10 terbaru, retry jika failed). Token disimpan terenkripsi, list hanya tampil <code>tokenMasked</code>.
          </div>
          <div className="flex gap-2">
            <a href="/integrations/telegram" className="px-4 py-2 rounded-full text-xs font-black border-2 text-white" style={{ background: C.navy, borderColor: C.navy }}>Ke Telegram →</a>
            <a href="/reviews" className="px-4 py-2 rounded-full text-xs font-black border-2 bg-white" style={{ borderColor: C.navy, color: C.navy }}>Test via Reviews Sync</a>
          </div>
        </div>
      </div>

      {/* Sheets + Billing + Team */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-[20px] border-[3px] p-5 bg-white" style={{ borderColor: C.navy }}>
          <div className="font-black text-sm flex items-center gap-2" style={{ color: C.navy }}><span className="w-7 h-7 rounded-xl border-2 flex items-center justify-center bg-white" style={{ borderColor: C.navy }}>📑</span> Google Sheets</div>
          <ol className="list-decimal pl-5 mt-3 space-y-1 text-sm" style={{ color: C.navy }}>
            <li>Buat spreadsheet baru → Share → Editor ke email Google yang connect</li>
            <li>Buka <a href="/integrations/google-sheets" className="underline" style={{ color: "#0057FF" }}>/integrations/google-sheets</a> → paste URL → Connect → Sync Now</li>
            <li>Auto buat 2 sheet: <b>Reviews</b> & <b>Performance</b>. Tabel list tampil status + lastSynced + Open Sheet.</li>
          </ol>
          <div className="text-xs mt-2 p-2 rounded border-2" style={{ background: C.cream, borderColor: C.navy }}>DB tetap source of truth — gagal sync tidak hapus data.</div>
        </div>
        <div className="rounded-[20px] border-[3px] p-5 bg-white" style={{ borderColor: C.navy }}>
          <div className="font-black text-sm flex items-center gap-2" style={{ color: C.navy }}><span className="w-7 h-7 rounded-xl border-2 flex items-center justify-center bg-white" style={{ borderColor: C.navy }}>👥</span> Team & Billing</div>
          <ul className="mt-3 space-y-2 text-sm list-disc pl-5" style={{ color: C.navy }}>
            <li><a href="/team" className="underline" style={{ color: "#0057FF" }}>/team</a> → input email → Undang → tabel anggota (Owner + Viewer). Delete pending, isActive flag.</li>
            <li><a href="/billing" className="underline" style={{ color: "#0057FF" }}>/billing</a> → tabel 3 paket (Free/Pro/Enterprise) + riwayat tagihan. Payment Stripe/Midtrans add when needed.</li>
            <li><a href="/settings" className="underline" style={{ color: "#0057FF" }}>/settings → Profil</a> → ganti email histori bisa diaktifkan ulang.</li>
          </ul>
        </div>
      </div>

      <div className="rounded-xl border p-5 bg-white space-y-3">
        <div className="font-bold text-sm">FAQ relevan</div>
        <details className="text-sm border rounded p-3"><summary className="font-medium">Google belum Approved (Test users)?</summary><div className="mt-2 text-zinc-600">Wajib Add email kamu di OAuth consent → Test users. Non-Gmail (Google Workspace) kadang perlu Publish App → External.</div></details>
        <details className="text-sm border rounded p-3"><summary className="font-medium">Lokasi tidak muncul?</summary><div className="mt-2 text-zinc-600">Pastikan akun Google adalah Owner/Manager di business.google.com → Locations. Lalu Load Locations lagi.</div></details>
        <details className="text-sm border rounded p-3"><summary className="font-medium">Sheets error failed?</summary><div className="mt-2 text-zinc-600">Cek Share spreadsheet ke email yang Connect (Editor). Lihat errorMessage di card, lalu Sync ulang.</div></details>
        <details className="text-sm border rounded p-3"><summary className="font-medium">Telegram tidak masuk?</summary><div className="mt-2 text-zinc-600">Cek toggle ⭐1-3 ON, isActive ON, lalu Test Telegram. Lihat Recent Notifications status — jika failed klik Retry.</div></details>
      </div>

      <div className="flex gap-2">
        <a href="/locations" className="px-4 py-2 bg-zinc-900 text-white rounded text-sm">Ke Locations →</a>
        <a href="/settings" className="px-4 py-2 border rounded text-sm">Ke Settings</a>
        <a href="/menu" className="px-4 py-2 border rounded text-sm">Ke Menu</a>
      </div>
    </div>
  );
}
