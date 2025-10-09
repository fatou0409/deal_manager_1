// src/components/FileDropzone.jsx
import { useCallback, useState } from "react";

export default function FileDropzone({ onFile, accept = ".csv,.xlsx,.xls", label = "Déposer un fichier ou cliquer" }) {
  const [hover, setHover] = useState(false);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setHover(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) onFile?.(f);
  }, [onFile]);

  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (f) onFile?.(f);
    e.target.value = "";
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setHover(true); }}
      onDragLeave={() => setHover(false)}
      onDrop={onDrop}
      className={`rounded-xl border px-3 py-3 text-sm cursor-pointer ${
        hover ? "border-orange-400 bg-orange-50" : "border-black/10 bg-white"
      }`}
    >
      <label className="flex items-center justify-between gap-3">
        <span className="text-black/70">{label}</span>
        <input type="file" accept={accept} onChange={onPick} className="hidden" />
        <span className="rounded-lg border border-black/10 bg-white px-3 py-1">Parcourir</span>
      </label>
    </div>
  );
}
