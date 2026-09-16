"use client";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "./confirm-dialog";

export function AvatarPositionEditor() {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [posX, setPosX] = useState(50);
  const [posY, setPosY] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [msg, setMsg] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [fileName, setFileName] = useState("");
  const [confirm, setConfirm] = useState<{ open: boolean; title: string; message: string; onYes: () => void } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; posX: number; posY: number } | null>(null);

  async function load() {
    const r = await fetch("/api/user/avatar");
    const d = await r.json();
    if (d.avatar) setAvatar(d.avatar);
    setPosX(d.posX ?? 50);
    setPosY(d.posY ?? 50);
    setZoom(d.zoom ?? 1);
  }
  useEffect(() => { load(); }, []);

  async function doSave() {
    try {
      const r = await fetch("/api/user/avatar", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ posX, posY, zoom }) });
      const text = await r.text();
      const d = text ? JSON.parse(text) : {};
      if (d.ok) {
        setMsg("✅ Posisi berhasil terupdate!");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000);
      } else setMsg(d.error || "Gagal simpan");
    } catch (e: any) {
      setMsg("Gagal: " + e.message);
    }
  }
  function save() {
    setConfirm({ open: true, title: "Simpan posisi?", message: "Yakin simpan posisi foto?", onYes: () => { setConfirm(null); doSave(); } });
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    if (f.size > 2 * 1024 * 1024) { setMsg("Maks 2MB"); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      const b64 = reader.result as string;
      setAvatar(b64);
      await fetch("/api/user/avatar", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avatar: b64 }) });
      setMsg("Foto terupdate — atur posisi di bawah");
    };
    reader.readAsDataURL(f);
  }

  return (
    <>
      {showPopup && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full border-2 font-black text-sm shadow-lg" style={{ background: "#00C853", borderColor: "#0F1E3A", color: "#FFFFFF" }}>✅ Berhasil terupdate!</div>}
      <div className="rounded-[20px] border-[3px] overflow-hidden" style={{ borderColor: "#0F1E3A", background: "#FFFBEB" }}>
      <div className="px-5 py-3 border-b-[3px] flex items-center justify-between" style={{ background: "#4DB8FF", borderColor: "#0F1E3A" }}>
        <div className="font-black text-sm" style={{ color: "#0F1E3A" }}>📸 Atur Posisi Foto Hero</div>
        <span className="text-xs font-bold px-2 py-1 rounded-full bg-white border-2" style={{ borderColor: "#0F1E3A", color: "#0F1E3A" }}>Geser & Zoom</span>
      </div>
      <div className="p-4 space-y-4">
        <div className="grid md:grid-cols-[320px_1fr] gap-4 items-start">
          <div className="space-y-2">
            <div className="text-xs font-bold" style={{ color: "#0F1E3A" }}>Preview (320×160):</div>
            <div
              className={`w-full md:w-[320px] h-[160px] rounded-xl border-2 overflow-hidden bg-white relative select-none ${avatar ? "cursor-grab active:cursor-grabbing touch-none" : ""}`}
              style={{ borderColor: "#0F1E3A" }}
              onMouseDown={(e) => {
                if (!avatar) return;
                setDragging(true);
                setDragStart({ x: e.clientX, y: e.clientY, posX, posY });
              }}
              onMouseUp={() => { setDragging(false); setDragStart(null); }}
              onMouseLeave={() => { setDragging(false); setDragStart(null); }}
              onMouseMove={(e) => {
                if (!dragging || !avatar || !dragStart) return;
                const dx = e.clientX - dragStart.x;
                const dy = e.clientY - dragStart.y;
                setPosX(Math.max(0, Math.min(100, Math.round(dragStart.posX + dx * 0.6))));
                setPosY(Math.max(0, Math.min(100, Math.round(dragStart.posY + dy * 0.6))));
              }}
              onTouchStart={(e) => {
                if (!avatar) return;
                const t = e.touches[0];
                setDragging(true);
                setDragStart({ x: t.clientX, y: t.clientY, posX, posY });
              }}
              onTouchEnd={() => { setDragging(false); setDragStart(null); }}
              onTouchMove={(e) => {
                if (!avatar || !dragStart) return;
                const t = e.touches[0];
                const dx = t.clientX - dragStart.x;
                const dy = t.clientY - dragStart.y;
                setPosX(Math.max(0, Math.min(100, Math.round(dragStart.posX + dx * 0.6))));
                setPosY(Math.max(0, Math.min(100, Math.round(dragStart.posY + dy * 0.6))));
              }}
              onWheel={(e) => {
                if (!avatar) return;
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                setZoom((z) => Math.max(0.5, Math.min(2, parseFloat((z + delta).toFixed(1)))));
              }}
            >
              {avatar ? (
                <div className="w-full h-full" style={{ backgroundImage: `url(${avatar})`, backgroundSize: `${zoom * 100}%`, backgroundPosition: `${posX}% ${posY}%`, backgroundRepeat: "no-repeat" }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
              )}
              {avatar && <div className="absolute bottom-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/90 border" style={{ borderColor: "#0F1E3A", color: "#0F1E3A" }}>drag foto • scroll zoom</div>}
            </div>
            <label className="block text-xs font-bold mt-2" style={{ color: "#0F1E3A" }}>Ganti Foto</label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <span className="px-3 py-1.5 rounded-full text-xs font-black border-2 shadow-[2px_2px_0px_rgba(15,30,58,1)] group-hover:shadow-[3px_3px_0px_rgba(15,30,58,1)] group-hover:-translate-y-0.5 transition-all" style={{ background: "#FF6A00", borderColor: "#0F1E3A", color: "#FFFFFF" }}>Choose File</span>
              <span className="text-xs font-medium truncate flex-1" style={{ color: fileName ? "#0F1E3A" : "#64748B" }}>{fileName || "No file chosen"}</span>
              <input type="file" accept="image/*" onChange={onFile} className="hidden" />
            </label>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold" style={{ color: "#0F1E3A" }}>Geser Horizontal: {posX}%</label>
              <div className="flex gap-1">
                <button onClick={() => setPosX((v) => Math.max(0, v - 5))} className="w-7 h-7 rounded-full border-2 bg-white text-xs font-black" style={{ borderColor: "#0F1E3A" }}>◀</button>
                <button onClick={() => setPosX((v) => Math.min(100, v + 5))} className="w-7 h-7 rounded-full border-2 bg-white text-xs font-black" style={{ borderColor: "#0F1E3A" }}>▶</button>
              </div>
            </div>
            <input type="range" min={0} max={100} value={posX} onChange={(e) => setPosX(parseInt(e.target.value))} className="w-full accent-[#FF6A00]" />
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold" style={{ color: "#0F1E3A" }}>Geser Vertikal: {posY}%</label>
              <div className="flex gap-1">
                <button onClick={() => setPosY((v) => Math.max(0, v - 5))} className="w-7 h-7 rounded-full border-2 bg-white text-xs font-black" style={{ borderColor: "#0F1E3A" }}>▲</button>
                <button onClick={() => setPosY((v) => Math.min(100, v + 5))} className="w-7 h-7 rounded-full border-2 bg-white text-xs font-black" style={{ borderColor: "#0F1E3A" }}>▼</button>
              </div>
            </div>
            <input type="range" min={0} max={100} value={posY} onChange={(e) => setPosY(parseInt(e.target.value))} className="w-full accent-[#FF6A00]" />
            <div>
              <label className="text-xs font-bold" style={{ color: "#0F1E3A" }}>Zoom: {zoom.toFixed(1)}x</label>
              <input type="range" min={0.5} max={2} step={0.1} value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-full accent-[#FF6A00]" />
            </div>
            <button onClick={save} className="w-full py-2.5 rounded-full text-xs font-black border-2" style={{ background: "#0F1E3A", borderColor: "#0F1E3A", color: "#FFFFFF" }}>Simpan Posisi →</button>
            {msg && <div className="text-xs font-bold p-2 rounded border-2 bg-white" style={{ borderColor: "#0F1E3A", color: "#0F1E3A" }}>{msg}</div>}
            <div className="text-xs p-2 rounded border-2 bg-white" style={{ borderColor: "#0F1E3A", color: "#000000" }}>💡 <b>Tips touchbar:</b> drag langsung di foto untuk geser, scroll mouse/2 jari untuk zoom — tidak perlu slider kanan. Foto tampil di <b>Menu Utama → hero kanan atas</b>.</div>
          </div>
          </div>
        </div>
      </div>
      {confirm && <ConfirmDialog open={confirm.open} title={confirm.title} message={confirm.message} onYes={confirm.onYes} onNo={() => setConfirm(null)} />}
    </>
  );
}
