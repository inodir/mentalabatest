// PDF export utility for Mentalaba Dashboard
// Uses jspdf + jspdf-autotable for structured PDF reports

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { DTMSchoolInfo, DTMDistrictInfo } from "@/lib/dtm-auth";
import type { DTMUser } from "@/lib/dtm-api";

interface ExportData {
  totalUsers?: number;
  answeredUsers?: number;
  testedPercent?: number;
  schoolCount?: number;
  avgBall?: number;
  schools?: DTMSchoolInfo[];
  districts?: DTMDistrictInfo[];
  topStudents?: DTMUser[];
  passLine?: number;
  role?: "super" | "district" | "school";
  adminName?: string;
}

function addUzbekFont(doc: jsPDF) {
  // jsPDF built-in fonts support Latin + some Cyrillic
  // For Uzbek Latin we use helvetica
  doc.setFont("helvetica");
}

function addHeader(doc: jsPDF, title: string, adminName?: string) {
  const pageW = doc.internal.pageSize.getWidth();
  const now = new Date();
  const dateStr = `${now.getDate().toString().padStart(2, "0")}.${(now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}.${now.getFullYear()} ${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;

  // Header background
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(0, 0, pageW, 32, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Mentalaba - DTM Statistik Hisobot", 14, 13);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(title, 14, 22);

  doc.setFontSize(9);
  doc.text(`Sana: ${dateStr}`, pageW - 14, 22, { align: "right" });
  if (adminName) {
    doc.text(`Admin: ${adminName}`, pageW - 14, 29, { align: "right" });
  }

  doc.setTextColor(0, 0, 0);
  return 40; // next Y position
}

function addSummaryStats(doc: jsPDF, data: ExportData, y: number) {
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Umumiy ko'rsatkichlar", 14, y);
  y += 5;

  const stats = [
    ["Jami o'quvchilar", (data.totalUsers ?? 0).toLocaleString()],
    ["Test topshirganlar", (data.answeredUsers ?? 0).toLocaleString()],
    ["Topshirish foizi", `${(data.testedPercent ?? 0).toFixed(1)}%`],
    ["Maktablar soni", (data.schoolCount ?? 0).toLocaleString()],
    ...(data.avgBall ? [["O'rtacha ball", data.avgBall.toFixed(1)]] : []),
    ...(data.passLine ? [["O'tish balli", String(data.passLine)]] : []),
  ];

  autoTable(doc, {
    startY: y,
    head: [["Ko'rsatkich", "Qiymat"]],
    body: stats,
    margin: { left: 14, right: 14 },
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [240, 245, 255] },
    columnStyles: { 1: { fontStyle: "bold", halign: "right" } },
  });

  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
}

function addSchoolsTable(
  doc: jsPDF,
  schools: DTMSchoolInfo[],
  passLine: number,
  y: number
) {
  if (schools.length === 0) return y;

  const pageW = doc.internal.pageSize.getWidth();
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(`Maktablar reytingi (jami: ${schools.length} ta)`, 14, y);
  y += 4;

  const sorted = [...schools]
    .sort((a, b) => (b.avg_total_ball ?? 0) - (a.avg_total_ball ?? 0));

  const rows = sorted.slice(0, 50).map((s, i) => {
    const avg = s.avg_total_ball ?? 0;
    const pct = s.tested_percent ?? 0;
    const risk = avg === 0 ? "Natijasiz" : avg >= passLine ? "Xavfsiz" : avg >= passLine * 0.6 ? "O'rta xavf" : "Yuqori xavf";
    return [
      String(i + 1),
      s.name.slice(0, 30),
      s.district || "—",
      `${(s.registered_count ?? 0).toLocaleString()}`,
      `${(s.answered_count ?? 0).toLocaleString()}`,
      `${pct.toFixed(0)}%`,
      avg > 0 ? avg.toFixed(1) : "—",
      risk,
    ];
  });

  autoTable(doc, {
    startY: y,
    tableWidth: pageW - 28,
    head: [["#", "Maktab nomi", "Tuman", "Ro'yxatda", "Topshirdi", "%", "O'rt. ball", "Xavf"]],
    body: rows,
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8, cellPadding: 2.5, overflow: "linebreak" },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 255] },
    columnStyles: {
      0: { halign: "center", cellWidth: 8 },
      1: { cellWidth: 50 },
      2: { cellWidth: 35 },
      3: { halign: "right", cellWidth: 18 },
      4: { halign: "right", cellWidth: 18 },
      5: { halign: "center", cellWidth: 12 },
      6: { halign: "center", cellWidth: 16, fontStyle: "bold" },
      7: { halign: "center", cellWidth: 22 },
    },
    didDrawCell: (data) => {
      if (data.column.index === 7 && data.section === "body") {
        const val = String(data.cell.text).trim();
        if (val === "Yuqori xavf") {
          doc.setFillColor(254, 226, 226);
        } else if (val === "O'rta xavf") {
          doc.setFillColor(254, 243, 199);
        } else if (val === "Xavfsiz") {
          doc.setFillColor(220, 252, 231);
        }
      }
    },
  });

  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
}

function addDistrictsTable(doc: jsPDF, districts: DTMDistrictInfo[], y: number) {
  if (districts.length === 0) return y;

  doc.addPage();
  y = 20;

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(`Tumanlar bo'yicha statistika (${districts.length} ta tuman)`, 14, y);
  y += 4;

  const sorted = [...districts].sort((a, b) => b.tested_percent - a.tested_percent);

  const rows = sorted.map((d, i) => [
    String(i + 1),
    d.region,
    d.district,
    String(d.school_count),
    d.registered_count.toLocaleString(),
    d.answered_count.toLocaleString(),
    `${d.tested_percent.toFixed(1)}%`,
  ]);

  autoTable(doc, {
    startY: y,
    head: [["#", "Viloyat", "Tuman", "Maktablar", "Ro'yxatda", "Topshirdi", "Foiz"]],
    body: rows,
    margin: { left: 14, right: 14 },
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 255] },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      3: { halign: "center" },
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "center", fontStyle: "bold" },
    },
  });

  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
}

function addTopStudents(doc: jsPDF, students: DTMUser[], y: number) {
  if (students.length === 0) return y;

  doc.addPage();
  y = 20;
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Top 20 o'quvchilar (eng yuqori ball)", 14, y);
  y += 4;

  const top20 = [...students]
    .filter((u) => u.has_result && (u.total_point ?? 0) > 0)
    .sort((a, b) => (b.total_point ?? 0) - (a.total_point ?? 0))
    .slice(0, 20);

  const rows = top20.map((u, i) => [
    String(i + 1),
    u.full_name,
    u.school_name || u.school_code || "—",
    u.district || "—",
    u.language === "uz" ? "O'zbek" : u.language === "ru" ? "Rus" : u.language || "—",
    String(u.total_point ?? "—"),
  ]);

  autoTable(doc, {
    startY: y,
    head: [["#", "Ism Familiya", "Maktab", "Tuman", "Til", "Ball"]],
    body: rows,
    margin: { left: 14, right: 14 },
    styles: { fontSize: 9, cellPadding: 3.5 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 255] },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      5: { halign: "center", fontStyle: "bold", cellWidth: 16 },
    },
  });

  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.line(14, pageH - 12, pageW - 14, pageH - 12);
    doc.text("Mentalaba DTM platformasi - Maxfiy hujjat", 14, pageH - 7);
    doc.text(`${i} / ${pageCount}`, pageW - 14, pageH - 7, { align: "right" });
    doc.setTextColor(0, 0, 0);
  }
}

export async function exportSuperAdminPDF(data: ExportData) {
  const doc = new jsPDF({ orientation: "landscape", format: "a4", unit: "mm" });
  addUzbekFont(doc);

  let y = addHeader(doc, "Super Admin — To'liq Statistik Hisobot", data.adminName);
  y = addSummaryStats(doc, data, y);

  if (data.schools && data.schools.length > 0) {
    if (y > 160) { doc.addPage(); y = 20; }
    y = addSchoolsTable(doc, data.schools, data.passLine ?? 90, y);
  }

  if (data.districts && data.districts.length > 0) {
    addDistrictsTable(doc, data.districts, y);
  }

  if (data.topStudents && data.topStudents.length > 0) {
    addTopStudents(doc, data.topStudents, 0);
  }

  addFooter(doc);

  const now = new Date();
  const dateTag = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now
    .getDate()
    .toString()
    .padStart(2, "0")}`;
  doc.save(`mentalaba-statistika-${dateTag}.pdf`);
}

export async function exportSchoolPDF(data: ExportData) {
  const doc = new jsPDF({ orientation: "portrait", format: "a4", unit: "mm" });
  addUzbekFont(doc);

  let y = addHeader(doc, "Maktab Statistik Hisoboti", data.adminName);
  y = addSummaryStats(doc, data, y);

  if (data.topStudents && data.topStudents.length > 0) {
    y = addTopStudents(doc, data.topStudents, y);
  }

  addFooter(doc);

  const now = new Date();
  const dateTag = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now
    .getDate()
    .toString()
    .padStart(2, "0")}`;
  doc.save(`maktab-hisobot-${dateTag}.pdf`);
}

export async function exportDistrictPDF(data: ExportData) {
  const doc = new jsPDF({ orientation: "landscape", format: "a4", unit: "mm" });
  addUzbekFont(doc);

  let y = addHeader(doc, "Tuman Statistik Hisoboti", data.adminName);
  y = addSummaryStats(doc, data, y);

  if (data.schools && data.schools.length > 0) {
    y = addSchoolsTable(doc, data.schools, data.passLine ?? 90, y);
  }

  if (data.topStudents && data.topStudents.length > 0) {
    addTopStudents(doc, data.topStudents, 0);
  }

  addFooter(doc);

  const now = new Date();
  const dateTag = `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}`;
  doc.save(`tuman-hisobot-${dateTag}.pdf`);
}
