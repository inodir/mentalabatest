import jsPDF from "jspdf";

export async function exportCertificate(studentName: string) {
  const doc = new jsPDF({ orientation: "landscape", format: "a4", unit: "mm" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // 1. Background (Premium White / Light Blue)
  doc.setFillColor(255, 255, 255); // White
  doc.rect(0, 0, W, H, "F");

  // decorative soft blue mesh/wave overlays
  doc.setFillColor(240, 248, 255); // VERY LIGHT BLUE
  doc.triangle(0, 0, 110, 0, 0, 110, "F");
  doc.triangle(W, H, W - 110, H, W, H - 110, "F");

  doc.setFillColor(37, 99, 235, 0.1); // LIGHT BLUE WITH ALPHA
  doc.triangle(0, 0, 85, 0, 0, 85, "F");
  
  // Dark Blue Corners
  doc.setFillColor(30, 58, 138); // navy-900 (Deep Blue)
  doc.triangle(0, 0, 60, 0, 0, 60, "F");
  doc.triangle(W, H, W - 60, H, W, H - 60, "F");

  // Gold Corners Overlay
  doc.setFillColor(245, 158, 11); // Amber/Gold
  doc.triangle(0, 0, 30, 0, 0, 30, "F");
  doc.triangle(W, H, W - 30, H, W, H - 30, "F");

  // 2. Deco Borders
  doc.setDrawColor(30, 58, 138); // Deep Blue border
  doc.setLineWidth(1);
  doc.rect(12, 12, W - 24, H - 24, "S"); // Outer
  
  doc.setDrawColor(245, 158, 11); // Gold Inner border
  doc.setLineWidth(0.3);
  doc.rect(14, 14, W - 28, H - 28, "S"); // Inner

  // 3. Header Text / ID absolute placeholding
  doc.setTextColor(148, 163, 184);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const idStr = `ID: M-${Math.floor(100000 + Math.random() * 900000)}`;
  doc.text(idStr, 22, 25);

  // logo centered header
  doc.setTextColor(30, 58, 138); // navy-900
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("M E N T A L A B A", W / 2, 35, { align: "center" });

  // 4. Title Text
  doc.setTextColor(30, 58, 138);
  doc.setFontSize(42);
  doc.text("SERTIFIKAT", W / 2, 60, { align: "center" });

  doc.setLineWidth(0.5);
  doc.setDrawColor(245, 158, 11, 0.4 as unknown as number);
  doc.line(W / 2 - 50, 68, W / 2 + 50, 68);

  // 5. Subtitle
  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFont("helvetica", "italic");
  doc.setFontSize(13);
  doc.text("Yutuqlarni tasdiqlovchi faxriy hujjat", W / 2, 78, { align: "center" });

  doc.setTextColor(71, 85, 105); // slate-600
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Ushbu sertifikat egasiga topshiriladi:", W / 2, 92, { align: "center" });

  // 6. Student Name!!
  doc.setTextColor(15, 23, 42); // slate-900 (Almost Black/Navy)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(34);
  doc.text(studentName.toUpperCase(), W / 2, 115, { align: "center" });

  // Underline name in Gold
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(1.2);
  doc.line(W / 2 - 75, 122, W / 2 + 75, 122);

  // 7. Lower Description
  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.text("Mentalaba DTM Onlayn Test Sinovlaridagi muvaffaqiyatli", W / 2, 138, { align: "center" });
  doc.text("ishtiroki va yuqori akademik natijalari uchun", W / 2, 144, { align: "center" });

  // 8. Footer Decorative & Signatures
  doc.setDrawColor(148, 163, 184, 0.5 as unknown as number);
  doc.setLineWidth(0.3);
  doc.line(50, H - 45, 105, H - 45); // Left signature line
  doc.line(W - 105, H - 45, W - 50, H - 45); // Right signature line

  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Berilgan sana", 77.5, H - 38, { align: "center" });
  doc.text("Direktor", W - 77.5, H - 38, { align: "center" });

  doc.setTextColor(30, 58, 138); // Deep Blue
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Nodir O'tkirov", W - 77.5, H - 47, { align: "center" }); // Director Name ABOVE LINE

  const dateStr = new Date().toLocaleDateString("ru-RU");
  doc.setTextColor(30, 58, 138); // Deep Blue date
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(dateStr, 77.5, H - 47, { align: "center" });

  // Seal Shape Simulation (Gold Center Ribbon)
  const sealCenterX = W / 2;
  const sealCenterY = H - 45;
  
  // Ribbon Tails
  doc.setFillColor(245, 158, 11);
  doc.triangle(sealCenterX - 10, sealCenterY, sealCenterX - 18, sealCenterY + 30, sealCenterX - 5, sealCenterY + 25, "F");
  doc.triangle(sealCenterX + 10, sealCenterY, sealCenterX + 18, sealCenterY + 30, sealCenterX + 5, sealCenterY + 25, "F");

  // Yellow Seal Circle Gold
  doc.setFillColor(245, 158, 11);
  doc.circle(sealCenterX, sealCenterY, 14, "F");
  
  doc.setFillColor(251, 191, 36); // lighter gold
  doc.circle(sealCenterX, sealCenterY, 12, "F");
  
  doc.setDrawColor(217, 119, 6); // darker core border
  doc.circle(sealCenterX, sealCenterY, 11, "S");

  doc.setTextColor(30, 58, 138); // Navy Text inside seal
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.text("OFFICIAL", sealCenterX, sealCenterY - 1, { align: "center" });
  doc.text("SEAL", sealCenterX, sealCenterY + 2, { align: "center" });

  const safeName = studentName.replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`sertifikat_${safeName}.pdf`);
}
