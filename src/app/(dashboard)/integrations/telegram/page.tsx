import { TelegramManager } from "@/components/telegram-manager";

export default function TelegramPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Telegram Integration</h1>
      <TelegramManager />
    </div>
  );
}
