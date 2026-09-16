import { getCurrentUser } from "@/lib/auth";
import { SettingsTabs } from "@/components/settings-tabs";

const C = { header: "#FF6A00", navy: "#0F1E3A" };

export default async function SettingsPage() {
  await getCurrentUser();
  const isMock = !process.env.GOOGLE_CLIENT_ID;
  return (
    <div className="space-y-6">
      <div className="rounded-[20px] border-[3px] p-5" style={{ background: C.header, borderColor: C.navy }}>
        <h1 className="font-black tracking-tight leading-none" style={{ color: C.navy, fontSize: "28px", letterSpacing: "-0.03em" }}>SETTINGS</h1>
        <p className="text-sm font-medium mt-1" style={{ color: C.navy }}>Bagi per kategori — pilih tab di bawah. Semua ada tabel & input.</p>
      </div>
      <SettingsTabs isMock={isMock} />
    </div>
  );
}
