import * as XLSX from "xlsx";

/**
 * Generic helper to export JSON array to Excel file
 */
export function exportToExcel(data: any[], filename: string, sheetName = "Ma'lumotlar") {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    return true;
  } catch (error) {
    console.error("Excel eksportda xatolik:", error);
    return false;
  }
}

/**
 * Super Admin — Maktablar va Tumanlarni bitta faylda eksport qilish
 */
export function exportSuperAdminExcel(schools: any[], districts: any[], filename = "SuperAdmin_Statistikasi") {
  try {
    const workbook = XLSX.utils.book_new();

    // 1. Maktablar
    const schoolsData = (schools || []).map((s, index) => ({
      "#": index + 1,
      "Maktab nomi": s.name || "—",
      "Tuman": s.district || "—",
      "Kodi": s.code || s.schoolCode || "—",
      "O'quvchilar soni": s.registered_count ?? 0,
      "Topshirganlar": s.answered_count ?? 0,
      "Foiz (%)": s.tested_percent ? `${s.tested_percent.toFixed(1)}%` : "0%",
      "O'rtacha ball": s.avg_total_ball ?? 0,
    }));
    const worksheet1 = XLSX.utils.json_to_sheet(schoolsData);
    XLSX.utils.book_append_sheet(workbook, worksheet1, "Maktablar");

    // 2. Tumanlar
    const districtsData = (districts || []).map((d, index) => ({
      "#": index + 1,
      "Tuman": d.district || "—",
      "Maktablar soni": d.school_count ?? 0,
      "O'quvchilar": d.registered_count ?? 0,
      "Topshirganlar": d.answered_count ?? 0,
      "Foiz (%)": d.tested_percent ? `${d.tested_percent.toFixed(1)}%` : "0%",
      "O'rtacha ball": d.avg_total_ball ?? 0,
    }));
    const worksheet2 = XLSX.utils.json_to_sheet(districtsData);
    XLSX.utils.book_append_sheet(workbook, worksheet2, "Tumanlar");

    XLSX.writeFile(workbook, `${filename}.xlsx`);
    return true;
  } catch (error) {
    console.error("SuperAdmin Excel eksportda xatolik:", error);
    return false;
  }
}

/**
 * School Admin — O'quvchilar ro'yxati va ballari
 */
export function exportStudentsExcel(students: any[], filename = "O'quvchilar_Statistikasi") {
  const formattedData = students.map((u, index) => {
    const ball = u.dtm?.total_ball ?? u.total_point ?? 0;
    const tested = u.dtm?.tested ?? u.has_result ?? false;

    return {
      "#": index + 1,
      "F.I.O.": u.full_name || "—",
      "Telefon": u.phone || "—",
      "Sinf/Guruh": u.group_name || "—",
      "Maktab kodi": u.school_code || "—",
      "Holat": tested ? "Topshirgan" : "Topshirmagan",
      "Umumiy ball": tested && ball > 0 ? ball : "—",
    };
  });

  return exportToExcel(formattedData, filename, "O'quvchilar");
}
