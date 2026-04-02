import type { DTMUser } from "@/lib/dtm-api";
import {
  getRegionalRanking,
  getScoreDistribution,
  getSubjectMastery,
  getTrendAnalysis,
  getUserTotalPoint,
  hasDTMResult,
  normalizeGender,
  normalizeLanguage,
  normalizeRegion,
} from "@/lib/stats-utils";

const PASS_LINE = 70;

export interface PublicStatsRow {
  key: string;
  name: string;
  region?: string;
  district?: string;
  registered_count: number;
  result_count: number;
  no_result_count: number;
  submit_rate: number;
  pass_count: number;
  pass_rate: number;
  avg_point: number;
}

export interface PublicStatsSnapshot {
  totalUsers: number;
  resultUsersCount: number;
  noResultUsersCount: number;
  passCount: number;
  passRate: number;
  averagePoint: number;
  totalSchools: number;
  regions: string[];
  districts: string[];
  filteredEntities: DTMUser[];
  scoreBands: ReturnType<typeof getScoreDistribution>;
  pieData: Array<{ name: string; value: number; fill: string }>;
  genderData: Array<{ name: string; value: number; fill: string }>;
  langData: Array<{ name: string; value: number; fill: string }>;
  regionalRanking: ReturnType<typeof getRegionalRanking>;
  subjectMastery: ReturnType<typeof getSubjectMastery>;
  timelineData: Array<{ date: string; count: number; avg: number }>;
  hourlyData: Array<{ hour: string; count: number }>;
  regionRows: PublicStatsRow[];
  districtRows: PublicStatsRow[];
  schoolRows: PublicStatsRow[];
  topSchoolsBySubmit: Array<{ name: string; pct: number }>;
  topSchoolsByScore: Array<{ name: string; ball: number }>;
  bottomSchoolsBySubmit: Array<{ name: string; pct: number }>;
  bottomSchoolsByScore: Array<{ name: string; ball: number }>;
  breakdownLevel: "regions" | "districts" | "schools";
  breakdownRows: PublicStatsRow[];
}

function normalizeDistrict(district: unknown): string {
  if (!district) return "Noma'lum";
  return String(district).trim().replace(/[‘’ʻʼ`´]/g, "'");
}

function sortRows(rows: PublicStatsRow[]) {
  return rows.sort((a, b) => {
    if (b.avg_point !== a.avg_point) return b.avg_point - a.avg_point;
    if (b.result_count !== a.result_count) return b.result_count - a.result_count;
    return b.registered_count - a.registered_count;
  });
}

function aggregateRows(
  users: DTMUser[],
  keyGetter: (user: DTMUser) => string,
  metaGetter: (user: DTMUser) => { name: string; region?: string; district?: string }
): PublicStatsRow[] {
  const map = new Map<string, PublicStatsRow & { totalPoint: number }>();

  users.forEach((user) => {
    const key = keyGetter(user);
    const meta = metaGetter(user);
    const point = getUserTotalPoint(user);
    const hasResult = hasDTMResult(user);
    const passed = hasResult && (point ?? 0) >= PASS_LINE;

    if (!map.has(key)) {
      map.set(key, {
        key,
        name: meta.name,
        region: meta.region,
        district: meta.district,
        registered_count: 0,
        result_count: 0,
        no_result_count: 0,
        submit_rate: 0,
        pass_count: 0,
        pass_rate: 0,
        avg_point: 0,
        totalPoint: 0,
      });
    }

    const current = map.get(key)!;
    current.registered_count += 1;

    if (hasResult && point !== null) {
      current.result_count += 1;
      current.totalPoint += point;
      if (passed) current.pass_count += 1;
    } else {
      current.no_result_count += 1;
    }
  });

  return sortRows(
    Array.from(map.values()).map(({ totalPoint, ...row }) => ({
      ...row,
      avg_point: row.result_count > 0 ? Math.round((totalPoint / row.result_count) * 10) / 10 : 0,
      submit_rate:
        row.registered_count > 0
          ? Math.round((row.result_count / row.registered_count) * 1000) / 10
          : 0,
      pass_rate:
        row.result_count > 0 ? Math.round((row.pass_count / row.result_count) * 1000) / 10 : 0,
    }))
  );
}

export function buildPublicStats(
  entities: DTMUser[],
  selectedRegion: string,
  selectedDistrict: string
): PublicStatsSnapshot {
  const regions = Array.from(
    new Set(entities.map((user) => normalizeRegion(user.region ?? user.Region)).filter(Boolean))
  ).sort();

  const districts = Array.from(
    new Set(
      entities
        .filter((user) => selectedRegion === "all" || normalizeRegion(user.region ?? user.Region) === selectedRegion)
        .map((user) => normalizeDistrict(user.district ?? user.District))
        .filter(Boolean)
    )
  ).sort();

  const filteredEntities = entities.filter((user) => {
    const region = normalizeRegion(user.region ?? user.Region);
    const district = normalizeDistrict(user.district ?? user.District);
    if (selectedRegion !== "all" && region !== selectedRegion) return false;
    if (selectedDistrict !== "all" && district !== selectedDistrict) return false;
    return true;
  });

  const resultUsers = filteredEntities.filter((user) => hasDTMResult(user));
  const totalUsers = filteredEntities.length;
  const resultUsersCount = resultUsers.length;
  const noResultUsersCount = totalUsers - resultUsersCount;
  const passCount = resultUsers.filter((user) => (getUserTotalPoint(user) ?? 0) >= PASS_LINE).length;
  const passRate = resultUsersCount > 0 ? Math.round((passCount / resultUsersCount) * 1000) / 10 : 0;
  const averagePoint =
    resultUsersCount > 0
      ? resultUsers.reduce((sum, user) => sum + (getUserTotalPoint(user) ?? 0), 0) / resultUsersCount
      : 0;

  const schoolRows = aggregateRows(
    filteredEntities,
    (user) => String(user.school_code || user.school_name || user.id),
    (user) => ({
      name: String(user.school_name || user.school_code || "Noma'lum maktab"),
      region: normalizeRegion(user.region ?? user.Region),
      district: normalizeDistrict(user.district ?? user.District),
    })
  );

  const regionRows = aggregateRows(
    entities,
    (user) => normalizeRegion(user.region ?? user.Region),
    (user) => ({
      name: normalizeRegion(user.region ?? user.Region),
      region: normalizeRegion(user.region ?? user.Region),
    })
  );

  const districtRows = aggregateRows(
    filteredEntities,
    (user) => normalizeDistrict(user.district ?? user.District),
    (user) => ({
      name: normalizeDistrict(user.district ?? user.District),
      region: normalizeRegion(user.region ?? user.Region),
      district: normalizeDistrict(user.district ?? user.District),
    })
  );

  const scoreBands = getScoreDistribution(filteredEntities, 10, 189);

  const passedUsers = resultUsers.filter((user) => (getUserTotalPoint(user) ?? 0) >= PASS_LINE).length;
  const failedUsers = resultUsers.filter((user) => {
    const point = getUserTotalPoint(user) ?? 0;
    return point > 0 && point < PASS_LINE;
  }).length;

  const pieData = [
    { name: `O'tdi (≥${PASS_LINE})`, value: passedUsers, fill: "hsl(142 71% 45%)" },
    { name: "O'tmadi", value: failedUsers, fill: "hsl(0 72% 55%)" },
    { name: "Natija chiqmagan", value: noResultUsersCount, fill: "hsl(215 16% 65%)" },
  ].filter((item) => item.value > 0);

  const genderCounts = filteredEntities.reduce(
    (acc, user) => {
      const normalized = normalizeGender(user.gender ?? user.dtm?.gender ?? user.Gender);
      acc[normalized] += 1;
      return acc;
    },
    { male: 0, female: 0, other: 0 }
  );

  const genderData = [
    { name: "O'g'il", value: genderCounts.male, fill: "hsl(210 100% 50%)" },
    { name: "Qiz", value: genderCounts.female, fill: "hsl(330 100% 70%)" },
    { name: "Boshqa", value: genderCounts.other, fill: "hsl(0 0% 76%)" },
  ].filter((item) => item.value > 0);

  const langCounts = filteredEntities.reduce(
    (acc, user) => {
      const normalized = normalizeLanguage(user.language ?? user.dtm?.language ?? user.Language);
      acc[normalized] += 1;
      return acc;
    },
    { uz: 0, ru: 0, other: 0 }
  );

  const langData = [
    { name: "O'zbek", value: langCounts.uz, fill: "hsl(217 91% 60%)" },
    { name: "Rus", value: langCounts.ru, fill: "hsl(0 84% 60%)" },
    { name: "Boshqa", value: langCounts.other, fill: "hsl(0 0% 60%)" },
  ].filter((item) => item.value > 0);

  const regionalRanking = getRegionalRanking(filteredEntities);
  const subjectMastery = getSubjectMastery(filteredEntities).slice(0, 12);
  const trendAnalysis = getTrendAnalysis(filteredEntities);

  const timelineData = trendAnalysis
    .map((item) => {
      const parts = item.date.split("-");
      return {
        date: `${parts[2]}/${parts[1]}`,
        count: item.total_submissions,
        avg: Math.round(item.avg_point * 10) / 10,
      };
    })
    .slice(-12);

  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    const count = resultUsers.filter((user) => {
      if (!user.created_at) return false;
      return new Date(user.created_at).getHours() === hour;
    }).length;
    return { hour: `${String(hour).padStart(2, "0")}:00`, count };
  }).filter((item) => item.count > 0 || item.hour === "09:00" || item.hour === "15:00");

  const topSchoolsBySubmit = schoolRows
    .filter((row) => row.registered_count > 0)
    .map((row) => ({
      name: row.name.length > 20 ? `${row.name.slice(0, 20)}…` : row.name,
      pct: Math.round(row.submit_rate),
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 10);

  const topSchoolsByScore = schoolRows
    .filter((row) => row.avg_point > 0)
    .map((row) => ({
      name: row.name.length > 20 ? `${row.name.slice(0, 20)}…` : row.name,
      ball: row.avg_point,
    }))
    .sort((a, b) => b.ball - a.ball)
    .slice(0, 10);

  const bottomSchoolsBySubmit = schoolRows
    .filter((row) => row.registered_count > 0)
    .map((row) => ({
      name: row.name.length > 20 ? `${row.name.slice(0, 20)}…` : row.name,
      pct: Math.round(row.submit_rate),
    }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 5);

  const bottomSchoolsByScore = schoolRows
    .filter((row) => row.avg_point > 0)
    .map((row) => ({
      name: row.name.length > 20 ? `${row.name.slice(0, 20)}…` : row.name,
      ball: row.avg_point,
    }))
    .sort((a, b) => a.ball - b.ball)
    .slice(0, 5);

  const breakdownLevel =
    selectedDistrict !== "all" ? "schools" : selectedRegion !== "all" ? "districts" : "regions";

  const breakdownRows =
    breakdownLevel === "schools" ? schoolRows : breakdownLevel === "districts" ? districtRows : regionRows;

  return {
    totalUsers,
    resultUsersCount,
    noResultUsersCount,
    passCount,
    passRate,
    averagePoint,
    totalSchools: new Set(filteredEntities.map((user) => user.school_code).filter(Boolean)).size,
    regions,
    districts,
    filteredEntities,
    scoreBands,
    pieData,
    genderData,
    langData,
    regionalRanking,
    subjectMastery,
    timelineData,
    hourlyData,
    regionRows,
    districtRows,
    schoolRows,
    topSchoolsBySubmit,
    topSchoolsByScore,
    bottomSchoolsBySubmit,
    bottomSchoolsByScore,
    breakdownLevel,
    breakdownRows,
  };
}
