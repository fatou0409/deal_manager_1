// src/utils/exporters.js
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

/**
 * columns: [{ key, header }]
 * rows: [{...}]
 */
export function exportToCSV(filename, columns, rows) {
  const headers = columns.map(c => c.header);
  const data = rows.map(r => columns.map(c => r[c.key] ?? ""));
  const csv = [headers, ...data].map(line =>
    line.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")
  ).join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportToXLSX(filename, columns, rows, sheetName = "Feuille1") {
  const headers = columns.map(c => c.header);
  const data = rows.map(r => columns.map(c => r[c.key] ?? ""));
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

export function exportToPDF(filename, title, columns, rows) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const headers = columns.map(c => c.header);
  const data = rows.map(r => columns.map(c => r[c.key] ?? ""));

  if (title) {
    doc.setFontSize(14);
    doc.text(String(title), 40, 40);
  }

  doc.autoTable({
    head: [headers],
    body: data,
    startY: title ? 60 : 20,
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [255, 110, 38] }, // orange léger
  });

  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
