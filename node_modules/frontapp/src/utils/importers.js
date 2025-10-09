// src/utils/importers.js
import * as XLSX from "xlsx";
import { normalizeHeaderLabel as norm } from "./validators";

// --- CSV ---
export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      try {
        const text = reader.result;
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length < 2) return resolve({ headers: [], rows: [] });

        const rawHeaders = splitCSVLine(lines[0]);
        const headers = rawHeaders.map(h => h.trim());
        const rows = lines.slice(1).map(l => {
          const vals = splitCSVLine(l);
          const obj = {};
          headers.forEach((h, i) => (obj[norm(h)] = vals[i] ?? ""));
          return obj;
        });
        resolve({ headers, rows });
      } catch (e) { reject(e); }
    };
    reader.readAsText(file, "utf-8");
  });
}

function splitCSVLine(line) {
  const out = [];
  let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (q && line[i + 1] === '"') { cur += '"'; i++; }
      else q = !q;
    } else if (ch === "," && !q) {
      out.push(cur); cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map(s => s.trim());
}

// --- XLSX ---
export function parseXLSX(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      try {
        const data = new Uint8Array(reader.result);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];

        // header:1 -> 2D array (AOA) pour récupérer la 1ère ligne comme entêtes
        const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        const rawHeaders = (aoa[0] || []).map(String);
        const headers = rawHeaders.map(h => h.trim());

        // on repart en JSON clé/val (defval:""), puis normalise les clés
        const json = XLSX.utils.sheet_to_json(ws, { defval: "" });
        const rows = json.map(rowObj => {
          const o = {};
          Object.keys(rowObj).forEach(k => (o[norm(k)] = rowObj[k]));
          return o;
        });

        resolve({ headers, rows });
      } catch (e) { reject(e); }
    };
    reader.readAsArrayBuffer(file);
  });
}
