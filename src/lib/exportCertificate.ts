import jsPDF from "jspdf";

export async function exportCertificate(studentName: string) {
  const doc = new jsPDF({ orientation: "landscape", format: "a4", unit: "mm" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // 1. Background (Dark Blue/Teal Premium theme)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, W, H, "F");

  // 2. Deco Borders (Golden frames)
  doc.setDrawColor(234, 179, 8); // yellow-500
  doc.setLineWidth(1.5);
  doc.rect(10, 10, W - 20, H - 20, "S"); // Outer
  
  doc.setLineWidth(0.5);
  doc.rect(12, 12, W - 24, H - 24, "S"); // Inner

  // Corners Deco
  doc.setFillColor(234, 179, 8);
  doc.triangle(10, 10, 30, 10, 10, 30, "F"); // top left
  doc.triangle(W - 10, 10, W - 30, 10, W - 10, 30, "F"); // top right
  doc.triangle(10, H - 10, 30, H - 10, 10, H - 30, "F"); // bot left
  doc.triangle(W - 10, H - 10, W - 30, H - 10, W - 10, H - 30, "F"); // bot right

  // 3. Title Text
  doc.setFont("helvetica", "bold");
  
  doc.setTextColor(234, 179, 8);
  doc.setFontSize(48);
  doc.text("SERTIFIKAT", W / 2, 55, { align: "center" });

  doc.setLineWidth(0.5);
  doc.setDrawColor(234, 179, 8, 0.4 as unknown as number);
  doc.line(W / 2 - 60, 65, W / 2 + 60, 65);

  // 4. Subtitle
  doc.setTextColor(226, 232, 240); // slate-200
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text("Ushbu sertifikat egasiga topshiriladi:", W / 2, 85, { align: "center" });

  // 5. Student Name!!
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(36);
  // Simple clean text
  doc.text(studentName.toUpperCase(), W / 2, 112, { align: "center" });

  // Underline name
  doc.setDrawColor(234, 179, 8);
  doc.setLineWidth(1);
  doc.line(W / 2 - 80, 120, W / 2 + 80, 120);

  // 6. Lower Description
  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Mentalaba DTM Onlayn Test Sinovlaridagi muvaffaqiyatli ishtiroki uchun", W / 2, 138, { align: "center" });

  // 7. Footer Decorative & Signatures
  doc.setDrawColor(234, 179, 8, 0.3 as unknown as number);
  doc.line(50, H - 45, 110, H - 45); // Left signature line
  doc.line(W - 110, H - 45, W - 50, H - 45); // Right signature line

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("Sana", 80, H - 38, { align: "center" });
  doc.text("M.O' (Direktor Imzosi)", W - 80, H - 38, { align: "center" });

  const dateStr = new Date().toLocaleDateString("ru-RU");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text(dateStr, 80, H - 48, { align: "center" });

  // Subtle Logo centered footer
  doc.setTextColor(234, 179, 8, 0.7 as unknown as number);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("MENTALABA", W / 2, H - 28, { align: "center" });

  const safeName = studentName.replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`sertifikat_${safeName}.pdf`);
}
