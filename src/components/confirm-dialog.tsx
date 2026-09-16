"use client";
import { useEffect } from "react";
export function ConfirmDialog({ open, title, message, onYes, onNo }: { open: boolean; title: string; message: string; onYes: () => void; onNo: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onNo(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onNo]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border-[3px] bg-white p-5 shadow-xl" style={{ borderColor: "#0F1E3A" }}>
        <div className="font-black text-sm" style={{ color: "#0F1E3A" }}>{title}</div>
        <div className="text-xs mt-2 leading-relaxed" style={{ color: "#0F1E3A" }}>{message}</div>
        <div className="flex gap-2 mt-4 justify-end">
          <button onClick={onNo} className="px-4 py-2 rounded-full text-xs font-black border-2 bg-white" style={{ borderColor: "#0F1E3A", color: "#0F1E3A" }}>No</button>
          <button onClick={onYes} className="px-4 py-2 rounded-full text-xs font-black border-2 text-white" style={{ background: "#00C853", borderColor: "#0F1E3A", color: "#FFFFFF" }}>Yes</button>
        </div>
      </div>
    </div>
  );
}
