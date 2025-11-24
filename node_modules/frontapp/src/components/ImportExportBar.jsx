import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useAuth } from "../auth/AuthProvider";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useToast } from "./ToastProvider";
import { createPortal } from "react-dom";

export default function ImportExportBar({
  resource = "deal",
  title = "Export",
  filename = "export",
  columns = [],
  rows = [],
  onImportRows,
}) {
  const toast = useToast();
  const { can } = useAuth();
  const canImport = can(`${resource}:import`);
  const canExport = can(`${resource}:export`);

  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null); // ✅ AJOUTÉ
  const fileInputRef = useRef(null);
  const [openMenu, setOpenMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

  // ---------- IMPORT ----------
  const triggerImport = () => {
    if (!canImport) return toast.show("Tu n'as pas les droits d'import.", "error");
    fileInputRef.current?.click();
  };

  const handleFile = async (file) => {
    if (!file) return;
    const ext = (file.name.split(".").pop() || "").toLowerCase();

    try {
      if (ext === "csv") {
        const text = await file.text();
        const parsed = parseCSV(text);
        onImportRows?.(lowerKeys(parsed));
      } else if (ext === "xlsx" || ext === "xls") {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { defval: "" });
        onImportRows?.(lowerKeys(json));
      } else {
        toast.show("Format non supporté. Choisis un CSV ou un XLSX.", "error");
        return;
      }
      toast.show("Import terminé.", "success");
    } catch (e) {
      console.error(e);
      toast.show("Erreur pendant l'import.", "error");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  function parseCSV(text) {
    const sep = guessSeparator(text);
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return [];
    const headers = splitCSVLine(lines[0], sep).map((h) => h.trim());
    const out = [];

    for (let i = 1; i < lines.length; i++) {
      const cells = splitCSVLine(lines[i], sep);
      const row = {};
      headers.forEach((h, idx) => (row[h] = (cells[idx] ?? "").trim()));
      out.push(row);
    }
    return out;
  }

  function guessSeparator(text) {
    const sample = text.split(/\r?\n/)[0] || "";
    const commas = (sample.match(/,/g) || []).length;
    const semis = (sample.match(/;/g) || []).length;
    return semis > commas ? ";" : ",";
  }

  function splitCSVLine(line, sep) {
    const res = [];
    let cur = "";
    let inQ = false;

    let i = 0;
    while (i < line.length) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') {
          cur += '"';
          i += 2;
          continue;
        } else {
          inQ = !inQ;
        }
      } else if (ch === sep && !inQ) {
        res.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
      i++;
    }
    res.push(cur);
    return res;
  }

  function lowerKeys(arr) {
    return arr.map((obj) => {
      const o = {};
      Object.keys(obj).forEach((k) => (o[k.toLowerCase()] = obj[k]));
      return o;
    });
  }

  // ---------- EXPORT ----------
  const doExportCSV = () => {
    if (!canExport) return toast.show("Tu n'as pas les droits d'export.", "error");
    const header = columns.map((c) => safeCSV(c.header)).join(",");
    const lines = rows.map((r) =>
      columns.map((c) => safeCSV(valueFor(r[c.key]))).join(",")
    );
    const csv = [header, ...lines].join("\n");
    downloadBlob(csv, `${filename}.csv`, "text/csv;charset=utf-8;");
    toast.show("Export CSV généré.", "success");
  };

  const doExportXLSX = () => {
    if (!canExport) return toast.show("Tu n'as pas les droits d'export.", "error");
    const data = rows.map((r) => {
      const o = {};
      columns.forEach((c) => (o[c.header] = valueFor(r[c.key])));
      return o;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Export");
    XLSX.writeFile(wb, `${filename}.xlsx`);
    toast.show("Export Excel généré.", "success");
  };

  const doExportPDF = () => {
    if (!canExport) return toast.show("Tu n'as pas les droits d'export.", "error");
    const doc = new jsPDF({ orientation: "landscape" });
    const head = [columns.map((c) => c.header)];
    const body = rows.map((r) => columns.map((c) => valueFor(r[c.key])));

    doc.text(title || "Export", 14, 12);
    doc.autoTable({
      head,
      body,
      startY: 16,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [255, 132, 0] },
    });
    doc.save(`${filename}.pdf`);
    toast.show("Export PDF généré.", "success");
  };

  function valueFor(v) {
    if (v === null || typeof v === "undefined") return "";
    return String(v);
  }

  function safeCSV(v) {
    const s = valueFor(v);
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  function downloadBlob(content, fileName, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  const handleToggleMenu = () => {
    if (!canExport) return;
    
    if (!openMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    
    setOpenMenu((s) => !s);
  };

  // ✅ CORRIGÉ : Vérifier si le clic est dans le menu OU dans le bouton
  useEffect(() => {
    const onClick = (e) => {
      if (!rootRef.current) return;
      
      // Vérifier si le clic est dans le bouton ou dans le menu
      const isInRoot = rootRef.current.contains(e.target);
      const isInMenu = menuRef.current && menuRef.current.contains(e.target);
      
      if (!isInRoot && !isInMenu) {
        setOpenMenu(false);
      }
    };
    
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={rootRef} className="flex items-center gap-3">
      {/* IMPORT */}
      <button
        type="button"
        onClick={triggerImport}
        disabled={!canImport}
        title="Importer un fichier CSV ou Excel"
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-sm transition
          focus:outline-none focus:ring-2 focus:ring-offset-1
          ${canImport
            ? "bg-orange-600 text-white hover:bg-orange-500 active:scale-[0.99] focus:ring-orange-400"
            : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-90">
          <path fill="currentColor" d="M19 12v7H5v-7H3v9h18v-9zm-7-9l-5 5h3v6h4V8h3z"/>
        </svg>
        Importer
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={(e) => handleFile(e.target.files?.[0])}
        className="hidden"
      />

      {/* EXPORT */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggleMenu}
        disabled={!canExport}
        title="Exporter en CSV, Excel ou PDF"
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-sm transition
          focus:outline-none focus:ring-2 focus:ring-offset-1
          ${canExport
            ? "bg-white text-black border border-black/10 hover:bg-orange-50 active:scale-[0.99] focus:ring-orange-300"
            : "bg-gray-200 text-gray-500 border border-gray-200 cursor-not-allowed"
          }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-90">
          <path fill="currentColor" d="M5 5v6h2V7h10v4h2V5zm14 14H5v-4H3v6h18v-6h-2zM11 9v8h2V9l3 3l1.4-1.4L12 5.2L6.6 10.6L8 12z"/>
        </svg>
        Exporter
      </button>

      {/* ✅ MENU AVEC REF */}
      {openMenu && canExport && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: `${menuPosition.top}px`,
            right: `${menuPosition.right}px`,
            zIndex: 9999,
          }}
          className="w-56 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl"
        >
          <div className="py-2">
            <button
              className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors flex items-center gap-3"
              onClick={() => { 
                setOpenMenu(false); 
                doExportCSV(); 
              }}
            >
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exporter en CSV
            </button>
            <button
              className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors flex items-center gap-3"
              onClick={() => { 
                setOpenMenu(false); 
                doExportXLSX(); 
              }}
            >
              <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Exporter en Excel (.xlsx)
            </button>
            <button
              className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors flex items-center gap-3"
              onClick={() => { 
                setOpenMenu(false); 
                doExportPDF(); 
              }}
            >
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Exporter en PDF
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

ImportExportBar.propTypes = {
  resource: PropTypes.string,
  title: PropTypes.string,
  filename: PropTypes.string,
  columns: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    header: PropTypes.string.isRequired,
  })),
  rows: PropTypes.array,
  onImportRows: PropTypes.func,
};
