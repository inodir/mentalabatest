// ═══════════════════════════════════════════════════════════════════
// Mentalaba — Advanced PDF Hisobot Generator
// jsPDF + jspdf-autotable - Professional multi-page reports
// ═══════════════════════════════════════════════════════════════════
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { DTMSchoolInfo, DTMDistrictInfo } from "@/lib/dtm-auth";
import type { DTMUser } from "@/lib/dtm-api";

// ─── Types ──────────────────────────────────────────────────────────
export interface ExportData {
  totalUsers?: number;
  answeredUsers?: number;
  testedPercent?: number;
  schoolCount?: number;
  avgBall?: number;
  passLine?: number;
  schools?: DTMSchoolInfo[];
  districts?: DTMDistrictInfo[];
  topStudents?: DTMUser[];
  subjectMastery?: { subject: string; mastery_percent: number; avg_point: number }[];
  riskStats?: { risk_count: number; risk_percent: number; tested_count: number };
  dtmReadiness?: { readiness_index: number; passed_count: number; tested_count: number };
  ballDistribution?: { labels: string[]; data: number[] };
  genderStats?: { male?: number; female?: number };
  languageStats?: { [key: string]: number };
  role?: "super" | "district" | "school";
  adminName?: string;
  districtName?: string;
  schoolName?: string;
}

// ─── Colors ─────────────────────────────────────────────────────────
const C = {
  primary:   [37,  99,  235] as [number, number, number],   // blue-600
  success:   [22,  163,  74] as [number, number, number],   // green-600
  warning:   [202, 138,   4] as [number, number, number],   // yellow-600
  danger:    [220,  38,  38] as [number, number, number],   // red-600
  purple:    [124,  58, 237] as [number, number, number],   // violet-600
  dark:      [ 15,  23,  42] as [number, number, number],   // slate-900
  muted:     [100, 116, 139] as [number, number, number],   // slate-500
  light:     [241, 245, 249] as [number, number, number],   // slate-100
  white:     [255, 255, 255] as [number, number, number],
  cardBlue:  [239, 246, 255] as [number, number, number],
  cardGreen: [240, 253, 244] as [number, number, number],
  cardRed:   [254, 242, 242] as [number, number, number],
  cardYellow:[254, 252, 232] as [number, number, number],
};

// ─── Helpers ────────────────────────────────────────────────────────
function nowStr() {
  const n = new Date();
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${pad(n.getDate())}.${pad(n.getMonth() + 1)}.${n.getFullYear()} ${pad(n.getHours())}:${pad(n.getMinutes())}`;
}

function fileDate() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`;
}

function riskOf(avg: number, pct: number, pass: number): { label: string; color: [number,number,number]; bg: [number,number,number] } {
  if (pct === 0 || avg === 0) return { label: "Natijasiz", color: C.muted, bg: C.light };
  if (avg >= pass)            return { label: "Xavfsiz",   color: C.success, bg: C.cardGreen };
  if (avg >= pass * 0.6)      return { label: "O'rta xavf",color: C.warning, bg: C.cardYellow };
  return                             { label: "Yuqori xavf",color: C.danger,  bg: C.cardRed };
}

type Doc = jsPDF & { lastAutoTable: { finalY: number } };

// ─── COVER PAGE ─────────────────────────────────────────────────────
function drawCover(doc: Doc, data: ExportData, title: string) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Background gradient blocks
  doc.setFillColor(...C.primary);
  doc.rect(0, 0, W, H * 0.55, "F");

  // Decorative circles
  doc.setFillColor(255, 255, 255, 0.05 as unknown as number);
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.3);
  doc.circle(W - 30, 30, 45, "S");
  doc.circle(W - 20, 20, 25, "S");
  doc.circle(20, H * 0.55 - 15, 30, "S");

  // Logo text
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.text("Mentalaba", 20, 35);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("DTM Platformasi", 20, 43);

  // Title
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(title, 20, 80);

  // Subtitle / admin info
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  if (data.adminName) doc.text(`Admin: ${data.adminName}`, 20, 92);
  if (data.districtName) doc.text(`Tuman: ${data.districtName}`, 20, 100);
  if (data.schoolName)   doc.text(`Maktab: ${data.schoolName}`, 20, 100);
  doc.text(`Sana: ${nowStr()}`, 20, 110);

  // Key stat boxes (bottom half — white bg)
  doc.setFillColor(...C.white);
  doc.roundedRect(0, H * 0.55, W, H - H * 0.55, 0, 0, "F");

  // Stat cards row
  const stats = buildCoverStats(data);
  const boxW = (W - 30) / stats.length;
  const boxY = H * 0.58;

  stats.forEach((s, i) => {
    const bx = 15 + i * boxW;
    doc.setFillColor(...s.bg);
    doc.roundedRect(bx, boxY, boxW - 4, 38, 4, 4, "F");
    doc.setTextColor(...s.color);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(s.value, bx + (boxW - 4) / 2, boxY + 16, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.muted);
    doc.text(s.label, bx + (boxW - 4) / 2, boxY + 26, { align: "center" });
  });

  // Footer line
  doc.setDrawColor(...C.light);
  doc.setLineWidth(0.5);
  doc.line(15, H - 18, W - 15, H - 18);
  doc.setFontSize(8);
  doc.setTextColor(...C.muted);
  doc.text("Mentalaba DTM Platformasi — Maxfiy hujjat", 15, H - 12);
  doc.text(`Sahifa 1`, W - 15, H - 12, { align: "right" });
}

function buildCoverStats(data: ExportData) {
  const arr: { label: string; value: string; color: [number,number,number]; bg: [number,number,number] }[] = [];
  if (data.totalUsers !== undefined)
    arr.push({ label: "Jami o'quvchilar", value: data.totalUsers.toLocaleString(),       color: C.primary, bg: C.cardBlue });
  if (data.answeredUsers !== undefined)
    arr.push({ label: "Test topshirdi",   value: data.answeredUsers.toLocaleString(),     color: C.success, bg: C.cardGreen });
  if (data.testedPercent !== undefined)
    arr.push({ label: "Topshirish foizi", value: `${data.testedPercent.toFixed(1)}%`,     color: C.purple,  bg: [245,240,255] as [number,number,number] });
  if (data.avgBall)
    arr.push({ label: "O'rtacha ball",    value: data.avgBall.toFixed(1),                 color: C.warning, bg: C.cardYellow });
  if (data.schoolCount !== undefined)
    arr.push({ label: "Maktablar",        value: String(data.schoolCount),                color: C.danger,  bg: C.cardRed });
  return arr;
}

// ─── SECTION HEADER ─────────────────────────────────────────────────
function sectionHeader(doc: Doc, text: string, y: number, icon?: string): number {
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(...C.primary);
  doc.roundedRect(14, y, W - 28, 10, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`${icon ?? "▸"} ${text}`, 20, y + 7);
  doc.setTextColor(0, 0, 0);
  return y + 15;
}

// ─── PAGE FOOTER ────────────────────────────────────────────────────
function addFooters(doc: Doc) {
  const pages = doc.getNumberOfPages();
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  for (let i = 2; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...C.light);
    doc.setLineWidth(0.4);
    doc.line(14, H - 12, W - 14, H - 12);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.muted);
    doc.text("Mentalaba DTM Platformasi — Maxfiy hujjat", 14, H - 7);
    doc.text(`${i} / ${pages}`, W - 14, H - 7, { align: "right" });
  }
}

// ─── CUSTOM BAR CHART ────────────────────────────────────────────────
function drawBarChart(
  doc: Doc,
  items: { label: string; value: number; color?: [number,number,number] }[],
  title: string,
  y: number,
  maxVal?: number,
  suffix = ""
): number {
  const W = doc.internal.pageSize.getWidth();
  const chartH = 55;
  const chartX = 14;
  const chartW = W - 28;
  const topPad = 12;
  const max = maxVal ?? Math.max(...items.map(i => i.value), 1);

  y = sectionHeader(doc, title, y, "📊");

  // Axes
  doc.setDrawColor(...C.light);
  doc.setLineWidth(0.3);

  const barW = (chartW / items.length) * 0.6;
  const gap   = (chartW / items.length) * 0.4;

  items.forEach((item, i) => {
    const barH = ((item.value / max) * (chartH - topPad));
    const bx = chartX + i * (barW + gap) + gap / 2;
    const by = y + chartH - barH;
    const col = item.color ?? C.primary;

    // Bar shadow
    doc.setFillColor(col[0], col[1], col[2], 0.15 as unknown as number);
    doc.roundedRect(bx + 1, by + 1, barW, barH, 2, 2, "F");

    // Bar
    doc.setFillColor(...col);
    doc.roundedRect(bx, by, barW, barH, 2, 2, "F");

    // Value label on top
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.dark);
    doc.text(`${item.value}${suffix}`, bx + barW / 2, by - 1.5, { align: "center" });

    // X label
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.muted);
    const labelTrunc = item.label.length > 12 ? item.label.slice(0, 12) + "…" : item.label;
    doc.text(labelTrunc, bx + barW / 2, y + chartH + 5, { align: "center", maxWidth: barW + gap });
  });

  doc.setTextColor(0, 0, 0);
  return y + chartH + 14;
}

// ─── DRAW PIE CHART ON CANVAS helper ───────────────────────────────────
function drawPieChartOnCanvas(data: { value: number; color: string }[]) {
  const canvas = document.createElement("canvas");
  canvas.width = 300;
  canvas.height = 300;
  const ctx = canvas.getContext("2d")!;
  
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;

  let startAngle = -Math.PI / 2;
  ctx.clearRect(0, 0, 300, 300);

  data.forEach(d => {
    const slice = (d.value / total) * 2 * Math.PI;
    if (slice === 0) return;
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.moveTo(150, 150);
    ctx.arc(150, 150, 130, startAngle, startAngle + slice);
    ctx.closePath();
    ctx.fill();
    startAngle += slice;
  });

  // Donut hole
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(150, 150, 65, 0, 2 * Math.PI);
  ctx.fill();

  return canvas.toDataURL("image/png");
}

// ─── SUMMARY STAT CARDS ─────────────────────────────────────────────
function drawSummaryCards(doc: Doc, data: ExportData, y: number): number {
  y = sectionHeader(doc, "Umumiy ko'rsatkichlar", y, "📈");
  const W = doc.internal.pageSize.getWidth();

  const cards = buildCoverStats(data);
  if (data.passLine)
    cards.push({ label: "O'tish balli", value: String(data.passLine), color: C.dark, bg: C.light });
  if (data.riskStats)
    cards.push({ label: "Xavfli o'quvchilar", value: `${data.riskStats.risk_percent.toFixed(1)}%`, color: C.danger, bg: C.cardRed });
  if (data.dtmReadiness)
    cards.push({ label: "Tayyorlik indeksi", value: `${data.dtmReadiness.readiness_index.toFixed(1)}%`, color: C.primary, bg: C.cardBlue });

  const cols = 4;
  const boxW = (W - 30) / cols;
  let row = 0;
  cards.forEach((c, idx) => {
    const col = idx % cols;
    if (col === 0 && idx > 0) row++;
    const bx = 14 + col * boxW;
    const by = y + row * 20;
    doc.setFillColor(...c.bg);
    doc.roundedRect(bx + 1, by, boxW - 3, 16, 3, 3, "F");
    doc.setTextColor(...c.color);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(c.value, bx + 1 + (boxW - 3) / 2, by + 8, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...C.muted);
    doc.text(c.label, bx + 1 + (boxW - 3) / 2, by + 13.5, { align: "center" });
  });

  // ── Participation Pie Chart ──
  const total = data.totalUsers ?? 0;
  const answered = data.answeredUsers ?? 0;
  const notAnswered = total - answered;

  if (total > 0) {
    const pPie = drawPieChartOnCanvas([
      { value: answered, color: "#10b981" }, // Emerald
      { value: Math.max(0, notAnswered), color: "#cbd5e1" } // Slate light
    ]);
    if (pPie) {
      const pieY = y + (row + 1) * 20 + 4;
      doc.addImage(pPie, "PNG", 20, pieY, 35, 35);
      
      const textX = 60;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.dark);
      doc.text("Test topshirish holati (Natijalar)", textX, pieY + 10);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      // Answered
      doc.setFillColor(16, 185, 129); doc.roundedRect(textX, pieY + 18, 3, 3, 1, 1, "F");
      doc.text(`Natijasi bor: ${answered} ta (${((answered/total)*100).toFixed(1)}%)`, textX + 5, pieY + 20.5);
      // Not Answered
      doc.setFillColor(203, 213, 225); doc.roundedRect(textX, pieY + 25, 3, 3, 1, 1, "F");
      doc.text(`Natija chiqmagan: ${Math.max(0, notAnswered)} ta (${((Math.max(0, notAnswered)/total)*100).toFixed(1)}%)`, textX + 5, pieY + 27.5);

      doc.setTextColor(0, 0, 0);
      return pieY + 41;
    }
  }

  doc.setTextColor(0, 0, 0);
  return y + (row + 1) * 20 + 6;
}

// ─── RISK SUMMARY ────────────────────────────────────────────────────
function drawRiskSummary(doc: Doc, schools: DTMSchoolInfo[], passLine: number, y: number): number {
  y = sectionHeader(doc, "Xavf darajasi taqsimoti", y, "🚨");
  const W = doc.internal.pageSize.getWidth();

  const counts = { high: 0, medium: 0, low: 0, none: 0 };
  for (const s of schools) {
    const r = riskOf(s.avg_total_ball ?? 0, s.tested_percent ?? 0, passLine);
    if (r.label === "Yuqori xavf")  counts.high++;
    else if (r.label === "O'rta xavf") counts.medium++;
    else if (r.label === "Xavfsiz")    counts.low++;
    else                               counts.none++;
  }
  const total = schools.length;

  const buckets: { label: string; count: number; color: [number,number,number]; bg: [number,number,number] }[] = [
    { label: "Yuqori xavf",  count: counts.high,   color: C.danger,  bg: C.cardRed },
    { label: "O'rta xavf",   count: counts.medium, color: C.warning, bg: C.cardYellow },
    { label: "Xavfsiz",      count: counts.low,     color: C.success, bg: C.cardGreen },
    { label: "Natijasiz",    count: counts.none,    color: C.muted,   bg: C.light },
  ];

  const boxW = (W - 30) / 4;
  buckets.forEach((b, i) => {
    const bx = 14 + i * boxW;
    doc.setFillColor(...b.bg);
    doc.roundedRect(bx + 1, y, boxW - 3, 22, 3, 3, "F");

    // Count
    doc.setTextColor(...b.color);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(String(b.count), bx + 1 + (boxW - 3) / 2, y + 10, { align: "center" });

    // Percent
    doc.setFontSize(7);
    const pct = total > 0 ? ((b.count / total) * 100).toFixed(0) : "0";
    doc.text(`${pct}%`, bx + 1 + (boxW - 3) / 2, y + 16, { align: "center" });

    // Label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...C.muted);
    doc.text(b.label, bx + 1 + (boxW - 3) / 2, y + 21, { align: "center" });
  });

  doc.setTextColor(0, 0, 0);
  return y + 30;
}

// ─── SUBJECT MASTERY ─────────────────────────────────────────────────
function drawSubjectMastery(doc: Doc, subjects: ExportData["subjectMastery"], y: number): number {
  if (!subjects || subjects.length === 0) return y;
  y = sectionHeader(doc, "Fan bo'yicha ko'nikma darajasi", y, "📚");
  const W = doc.internal.pageSize.getWidth();

  subjects.forEach((s, i) => {
    const barY = y + i * 10;
    const pct  = Math.min(100, s.mastery_percent);
    const barW = W - 90;

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.dark);
    const subjectName = s.subject.length > 22 ? s.subject.slice(0, 22) + "…" : s.subject;
    doc.text(subjectName, 14, barY + 6);

    // Track
    doc.setFillColor(...C.light);
    doc.roundedRect(80, barY + 2, barW, 5, 2, 2, "F");

    // Fill
    const col: [number,number,number] = pct >= 70 ? C.success : pct >= 40 ? C.warning : C.danger;
    doc.setFillColor(...col);
    doc.roundedRect(80, barY + 2, (pct / 100) * barW, 5, 2, 2, "F");

    // Value
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.dark);
    doc.text(`${pct.toFixed(0)}% | ${s.avg_point.toFixed(1)} ball`, 80 + barW + 2, barY + 6);
  });

  doc.setTextColor(0, 0, 0);
  return y + subjects.length * 10 + 6;
}

// ─── GENDER / LANGUAGE PIE ────────────────────────────────────────────
function drawDemographics(doc: Doc, data: ExportData, y: number): number {
  if (!data.genderStats && !data.languageStats) return y;
  y = sectionHeader(doc, "Demografik ko'rsatkichlar", y, "👥");

  const W = doc.internal.pageSize.getWidth();
  const LANG: Record<string, string> = { uz: "O'zbek", ru: "Rus", en: "Ingliz", kk: "Qozoq" };

  // 14mm Padding
  const currentX = 14;

  // ─ Gender Pie ─
  if (data.genderStats) {
    const total = (data.genderStats.male ?? 0) + (data.genderStats.female ?? 0);
    const gPie = drawPieChartOnCanvas([
      { value: data.genderStats.male ?? 0, color: "#0ea5e9" },   // Sky blue
      { value: data.genderStats.female ?? 0, color: "#ec4899" }  // Pink
    ]);

    if (gPie) {
      doc.addImage(gPie, "PNG", currentX, y, 40, 40);
    }

    const textX = currentX + 45;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.dark);
    doc.text("Jins bo'yicha taqsimot", textX, y + 8);

    doc.setFontSize(8);
    // Male
    doc.setFillColor(14, 165, 233); doc.roundedRect(textX, y + 15, 3, 3, 1, 1, "F");
    doc.setFont("helvetica", "normal"); 
    doc.text(`O'g'il bolalar: ${data.genderStats.male ?? 0} ta (${total > 0 ? ((data.genderStats.male! / total) * 100).toFixed(1) : 0}%)`, textX + 5, y + 17.5);
    // Female
    doc.setFillColor(236, 72, 153); doc.roundedRect(textX, y + 22, 3, 3, 1, 1, "F");
    doc.text(`Qiz bolalar: ${data.genderStats.female ?? 0} ta (${total > 0 ? ((data.genderStats.female! / total) * 100).toFixed(1) : 0}%)`, textX + 5, y + 24.5);
    
    doc.setFont("helvetica", "bold");
    doc.text(`Jami: ${total} ta`, textX, y + 33);
  }

  // ─ Language Pie ─
  if (data.languageStats) {
    const startX = W / 2 + 5;
    const total = Object.values(data.languageStats).reduce((s, v) => s + v, 0);
    
    // Convert to items
    const colors = ["#2563eb", "#dc2626", "#eab308", "#8b5cf6", "#6b7280"];
    const lItems = Object.entries(data.languageStats).map(([lang, count], i) => ({
      label: LANG[lang] ?? lang,
      value: count,
      color: colors[i % colors.length]
    }));

    const lPie = drawPieChartOnCanvas(lItems);
    if (lPie) {
      doc.addImage(lPie, "PNG", startX, y, 40, 40);
    }

    const textX = startX + 45;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.dark);
    doc.text("Ta'lim tili", textX, y + 8);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    lItems.forEach((item, i) => {
      const rx = textX;
      const ry = y + 15 + i * 6;
      if (ry > y + 42) return; 
      
      const rgb = item.color.startsWith('#') 
        ? [parseInt(item.color.slice(1,3), 16), parseInt(item.color.slice(3,5), 16), parseInt(item.color.slice(5,7), 16)] 
        : [100, 100, 100];
        
      doc.setFillColor(rgb[0], rgb[1], rgb[2]);
      doc.roundedRect(rx, ry, 3, 3, 1, 1, "F");
      doc.text(`${item.label}: ${item.value} ta (${total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%)`, rx + 5, ry + 2.5);
    });
  }

  doc.setTextColor(0, 0, 0);
  return y + 45;
}

// ─── SCHOOLS TABLE ───────────────────────────────────────────────────
function drawSchoolsTable(doc: Doc, schools: DTMSchoolInfo[], passLine: number, y: number): number {
  y = sectionHeader(doc, `Maktablar reytingi — jami ${schools.length} ta`, y, "🏫");

  const sorted = [...schools].sort((a, b) => (b.avg_total_ball ?? 0) - (a.avg_total_ball ?? 0));

  const rows = sorted.slice(0, 60).map((s, i) => {
    const risk = riskOf(s.avg_total_ball ?? 0, s.tested_percent ?? 0, passLine);
    return [
      String(i + 1),
      s.name.length > 28 ? s.name.slice(0, 28) + "…" : s.name,
      s.region ?? "—",
      s.district ?? "—",
      String(s.registered_count ?? 0),
      String(s.answered_count ?? 0),
      `${(s.tested_percent ?? 0).toFixed(0)}%`,
      (s.avg_total_ball ?? 0) > 0 ? (s.avg_total_ball ?? 0).toFixed(1) : "—",
      (s.avg_mandatory_ball ?? 0) > 0 ? (s.avg_mandatory_ball ?? 0).toFixed(1) : "—",
      risk.label,
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [["#", "Maktab nomi", "Viloyat", "Tuman", "Ro'yxat", "Topshirdi", "%", "Ball", "Majb.", "Xavf"]],
    body: rows,
    margin: { left: 14, right: 14 },
    styles:      { fontSize: 7, cellPadding: 3, overflow: "linebreak" },
    headStyles:  { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold", fontSize: 7.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] }, // Slate-50 Very light
    columnStyles: {
      0:  { halign: "center", cellWidth: 7 },
      1:  { cellWidth: 48 },
      2:  { cellWidth: 24 },
      3:  { cellWidth: 26 },
      4:  { halign: "right", cellWidth: 14 },
      5:  { halign: "right", cellWidth: 14 },
      6:  { halign: "center", fontStyle: "bold", cellWidth: 12 },
      7:  { halign: "center", fontStyle: "bold", cellWidth: 12 },
      8:  { halign: "center", cellWidth: 12 },
      9:  { cellWidth: 20 },
    },
    willDrawCell: (hookData) => {
      if (hookData.section === "body" && hookData.column.index === 9) {
        const val = String(hookData.cell.raw);
        let dotColor = C.muted;
        if (val === "Yuqori xavf") dotColor = C.danger;
        else if (val === "O'rta xavf") dotColor = C.warning;
        else if (val === "Xavfsiz") dotColor = C.success;
        
        doc.setFillColor(...dotColor);
        doc.circle(hookData.cell.x + 3, hookData.cell.y + hookData.cell.height / 2, 1.3, "F");
        doc.setTextColor(...dotColor);
      }
    },
  });

  return doc.lastAutoTable.finalY + 10;
}

// ─── DISTRICTS TABLE ─────────────────────────────────────────────────
function drawDistrictsTable(doc: Doc, districts: DTMDistrictInfo[], y: number): number {
  y = sectionHeader(doc, `Tumanlar statistikasi — ${districts.length} ta tuman`, y, "🗺️");

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
    styles:      { fontSize: 8.5, cellPadding: 3 },
    headStyles:  { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      3: { halign: "center" },
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "center" },
    },
    willDrawCell: (hookData) => {
      if (hookData.section === "body" && hookData.column.index === 6) {
        const val = parseFloat(String(hookData.cell.raw));
        let dotColor = C.danger;
        if (val >= 80)      dotColor = C.success;
        else if (val >= 50) dotColor = C.warning;
        
        doc.setFillColor(...dotColor);
        doc.circle(hookData.cell.x + 3, hookData.cell.y + hookData.cell.height / 2, 1.5, "F");
        doc.setTextColor(...dotColor);
      }
    },
  });

  return doc.lastAutoTable.finalY + 10;
}

// ─── TOP STUDENTS ─────────────────────────────────────────────────────
function drawTopStudents(doc: Doc, students: DTMUser[], y: number): number {
  const withScore = [...students]
    .filter(u => u.has_result && (u.total_point ?? 0) > 0)
    .sort((a, b) => (b.total_point ?? 0) - (a.total_point ?? 0))
    .slice(0, 25);

  if (withScore.length === 0) return y;

  y = sectionHeader(doc, "Top 25 o'quvchi (eng yuqori ball)", y, "🏆");

  const LANG: Record<string, string> = { uz: "O'zbek", ru: "Rus", en: "Ingliz" };

  const rows = withScore.map((u, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : String(i + 1);
    return [
      medal,
      u.full_name,
      (u.school_name ?? u.school_code ?? "—").slice(0, 25),
      u.district ?? "—",
      LANG[u.language ?? ""] ?? u.language ?? "—",
      String(u.total_point ?? "—"),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [["#", "Ism Familiya", "Maktab", "Tuman", "Til", "Ball"]],
    body: rows,
    margin: { left: 14, right: 14 },
    styles:      { fontSize: 8.5, cellPadding: 3 },
    headStyles:  { fillColor: [202, 138, 4], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: C.light },
    columnStyles: {
      0: { halign: "center", cellWidth: 12 },
      5: { halign: "center", fontStyle: "bold", cellWidth: 16 },
    },
    willDrawCell: (hookData) => {
      if (hookData.section === "body" && hookData.column.index === 5) {
        const val = parseInt(String(hookData.cell.raw));
        if (val >= 150)      doc.setTextColor(...C.success);
        else if (val >= 120) doc.setTextColor(...C.primary);
        else if (val >= 90)  doc.setTextColor(...C.warning);
        else                 doc.setTextColor(...C.danger);
      }
    },
  });

  return doc.lastAutoTable.finalY + 10;
}

// ─── SCORE DISTRIBUTION ──────────────────────────────────────────────
function drawScoreDistChart(doc: Doc, dist: { labels: string[]; data: number[] }, y: number): number {
  const items = dist.labels.map((label, i) => ({
    label,
    value: dist.data[i] ?? 0,
    color: [C.danger, C.warning, C.primary, C.success, C.purple, [20, 184, 166] as [number,number,number]][i % 6] as [number,number,number],
  }));
  return drawBarChart(doc, items, "Ball taqsimoti", y, undefined, " ta");
}

// ═══════════════════════════════════════════════════════════════════
// MAIN EXPORT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

export async function exportSuperAdminPDF(data: ExportData) {
  const doc = new jsPDF({ orientation: "landscape", format: "a4", unit: "mm" }) as Doc;
  doc.setFont("helvetica");

  // ── Page 1: Cover
  drawCover(doc, data, "Super Admin — To'liq Statistik Hisobot");

  // ── Page 2: Summary + Risk + Demographics
  doc.addPage();
  let y = 15;
  y = drawSummaryCards(doc, data, y);
  if (data.schools && data.schools.length > 0) {
    y = drawRiskSummary(doc, data.schools, data.passLine ?? 70, y);
  }
  y = drawDemographics(doc, data, y);

  // ── Page 3: Districts bar chart + Districts table
  if (data.districts && data.districts.length > 0) {
    doc.addPage();
    y = 15;
    const distItems = [...data.districts]
      .sort((a, b) => b.tested_percent - a.tested_percent)
      .slice(0, 15)
      .map(d => ({
        label: d.district,
        value: Math.round(d.tested_percent),
        color: d.tested_percent >= 80 ? C.success : d.tested_percent >= 50 ? C.warning : C.danger,
      }));
    y = drawBarChart(doc, distItems, "Tumanlar bo'yicha topshirish foizi (Top 15)", y, 100, "%");
    y = drawDistrictsTable(doc, data.districts, y);
  }

  // ── Page 4+: Schools table
  if (data.schools && data.schools.length > 0) {
    doc.addPage();
    y = 15;
    y = drawSchoolsTable(doc, data.schools, data.passLine ?? 70, y);
  }

  // ── Subject mastery
  if (data.subjectMastery && data.subjectMastery.length > 0) {
    if (y > 150) { doc.addPage(); y = 15; }
    y = drawSubjectMastery(doc, data.subjectMastery, y);
  }

  // ── Ball distribution chart
  if (data.ballDistribution && data.ballDistribution.labels.length > 0) {
    if (y > 150) { doc.addPage(); y = 15; }
    y = drawScoreDistChart(doc, data.ballDistribution, y);
  }

  // ── Top students
  if (data.topStudents && data.topStudents.length > 0) {
    doc.addPage();
    y = 15;
    drawTopStudents(doc, data.topStudents, y);
  }

  addFooters(doc);
  doc.save(`mentalaba-super-${fileDate()}.pdf`);
}

export async function exportSchoolPDF(data: ExportData) {
  const doc = new jsPDF({ orientation: "portrait", format: "a4", unit: "mm" }) as Doc;
  doc.setFont("helvetica");

  drawCover(doc, { ...data, role: "school" }, `Maktab Statistik Hisoboti${data.schoolName ? " — " + data.schoolName : ""}`);

  doc.addPage();
  let y = 15;
  y = drawSummaryCards(doc, data, y);
  if (data.subjectMastery && data.subjectMastery.length > 0) {
    y = drawSubjectMastery(doc, data.subjectMastery, y);
  }
  if (data.ballDistribution) {
    y = drawScoreDistChart(doc, data.ballDistribution, y);
  }
  if (data.topStudents && data.topStudents.length > 0) {
    if (y > 200) { doc.addPage(); y = 15; }
    drawTopStudents(doc, data.topStudents, y);
  }

  addFooters(doc);
  doc.save(`maktab-hisobot-${fileDate()}.pdf`);
}

export async function exportDistrictPDF(data: ExportData) {
  const doc = new jsPDF({ orientation: "landscape", format: "a4", unit: "mm" }) as Doc;
  doc.setFont("helvetica");

  drawCover(doc, data, `Tuman Statistik Hisoboti${data.districtName ? " — " + data.districtName : ""}`);

  doc.addPage();
  let y = 15;
  y = drawSummaryCards(doc, data, y);
  if (data.schools && data.schools.length > 0) {
    y = drawRiskSummary(doc, data.schools, data.passLine ?? 70, y);
    if (y > 130) { doc.addPage(); y = 15; }
    y = drawSchoolsTable(doc, data.schools, data.passLine ?? 70, y);
  }
  if (data.topStudents && data.topStudents.length > 0) {
    doc.addPage();
    drawTopStudents(doc, data.topStudents, 15);
  }

  addFooters(doc);
  doc.save(`tuman-hisobot-${fileDate()}.pdf`);
}
