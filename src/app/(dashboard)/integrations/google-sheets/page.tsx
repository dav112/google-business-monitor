import { SheetsManager } from "@/components/sheets-manager";

export default function SheetsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Google Sheets</h1>
      <SheetsManager />
    </div>
  );
}
