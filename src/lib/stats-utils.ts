/**
 * Normalizes gender strings into a standard format.
 * Handles Uzbek, English, and numeric representations.
 */
export function normalizeGender(gender: any): 'male' | 'female' | 'other' {
  if (gender === undefined || gender === null) return 'other';
  
  // Normalize string: lowercase, trim, and standardize apostrophes
  let g = gender.toString().toLowerCase().trim();
  
  // Replace various Uzbek/English apostrophes with standard '
  g = g.replace(/[‘’ʻʼ`‘´]/g, "'");
  
  // Male variations
  const maleTerms = [
    'erkak', 
    'male', 
    'm', 
    "o'g'il", 
    "o'gil", 
    "og'il", 
    "o'g'ul", 
    'ogil',
    'oʻgʻil', // sometimes standard replaces might miss specific unicode
    '1',
    'o‘g‘il'
  ];
  
  if (maleTerms.includes(g) || g.startsWith('o\'g')) {
    return 'male';
  }
  
  // Female variations
  const femaleTerms = [
    'ayol', 
    'female', 
    'f', 
    'qiz', 
    '2',
    'woman',
    'girl'
  ];
  
  if (femaleTerms.includes(g)) {
    return 'female';
  }
  
  return 'other';
}

/**
 * Normalizes language strings into a standard format.
 */
export function normalizeLanguage(lang: any): 'uz' | 'ru' | 'other' {
  if (!lang) return 'other';
  const l = lang.toString().toLowerCase().trim().replace(/[‘’ʻʼ`‘´]/g, "'");
  
  if (l === 'uz' || l === 'uzbek' || l === "o'zbek" || l === "o'z" || l === 'o‘zbek') return 'uz';
  if (l === 'ru' || l === 'rus' || l === 'russian' || l === 'русский') return 'ru';
  
  return 'other';
}

/**
 * Detects whether a user has any usable test result, regardless of which backend flag is populated.
 */
export function hasDTMResult(user: any): boolean {
  if (!user) return false;

  if (user.dtm?.tested === true) return true;
  if (getUserTotalPoint(user) !== null) return true;
  if (user.test_result_file_url || user.dtm?.result_file) return true;

  const subjects = Array.isArray(user.dtm?.subjects) ? user.dtm.subjects : [];
  if (
    subjects.some(
      (subject: any) =>
        Number(subject?.earned_ball ?? subject?.point ?? subject?.percent ?? 0) > 0
    )
  ) {
    return true;
  }

  const testResults = user.test_results;
  if (!testResults) return false;

  if (
    Array.isArray(testResults.mandatory) &&
    testResults.mandatory.some((item: any) => Number(item?.point) > 0)
  ) {
    return true;
  }

  if (Number(testResults.primary?.point) > 0 || Number(testResults.secondary?.point) > 0) {
    return true;
  }

  return false;
}

/**
 * Returns the user's total score from any supported payload shape.
 */
export function getUserTotalPoint(user: any): number | null {
  if (!user) return null;

  const mandatory = Array.isArray(user.test_results?.mandatory) ? user.test_results.mandatory : [];
  const mandatoryTotal = mandatory.reduce((sum: number, item: any) => sum + (Number(item?.point) || 0), 0);
  const primary = Number(user.test_results?.primary?.point) || 0;
  const secondary = Number(user.test_results?.secondary?.point) || 0;
  const computed = mandatoryTotal + primary + secondary;

  const candidates = [
    Number(user.dtm?.total_ball),
    Number(user.total_point),
    computed,
  ].filter((value) => Number.isFinite(value) && value > 0);

  if (candidates.length === 0) {
    return null;
  }

  return Math.max(...candidates);
}

/**
 * Normalizes region strings into a standard format.
 */
export function normalizeRegion(region: any): string {
  if (!region) return "Noma'lum";
  let r = region.toString().trim().replace(/[‘’ʻʼ`‘´]/g, "'");
  
  // Hand-standardized mapping for common variants
  const map: Record<string, string> = {
    "Toshkent sh.": "Toshkent shahri",
    "Toshkent sh": "Toshkent shahri",
    "Toshkent": "Toshkent viloyati", // Needs care, but usually means province if not 'sh'
    "Sirdaryo": "Sirdaryo viloyati",
    "Jizzax": "Jizzax viloyati",
    "Samarqand": "Samarqand viloyati",
    "Farg'ona": "Farg'ona viloyati",
    "Namangan": "Namangan viloyati",
    "Andijon": "Andijon viloyati",
    "Qashqadaryo": "Qashqadaryo viloyati",
    "Surxondaryo": "Surxondaryo viloyati",
    "Xorazm": "Xorazm viloyati",
    "Buxoro": "Buxoro viloyati",
    "Navoiy": "Navoiy viloyati",
    "Qoraqalpoq": "Qoraqalpog'iston Res.",
    "Qoraqalpog'iston": "Qoraqalpog'iston Res.",
  };

  return map[r] || r;
}

/**
 * Generates score distribution data with a specified interval.
 */
export function getScoreDistribution(
  users: any[], 
  interval: number = 1, 
  maxScore: number = 189,
  getPoint: (user: any) => number | null = (u) => getUserTotalPoint(u),
  hasResult: (user: any) => boolean = (u) => hasDTMResult(u)
) {
  const distribution: Record<number, number> = {};
  
  // Initialize bins
  for (let i = 0; i < maxScore; i += interval) {
    distribution[i] = 0;
  }
  
  users.forEach(u => {
    if (!hasResult(u)) return;
    
    const point = getPoint(u);
    if (point === null || point === undefined) return;
    
    // Find the bin index
    const bin = Math.floor(point / interval) * interval;
    if (bin >= 0 && bin < maxScore) {
      distribution[bin] = (distribution[bin] || 0) + 1;
    } else if (bin >= maxScore) {
      // Handle edge case where point equals maxScore exactly
      const lastBin = Math.floor((maxScore - 0.1) / interval) * interval;
      distribution[lastBin] = (distribution[lastBin] || 0) + 1;
    }
  });
  
  return Object.entries(distribution)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([key, value]) => {
      const start = Number(key);
      const end = start + interval;
      return {
        label: `${start}${interval === 1 ? '' : `–${end}`}`,
        range: `${start}${interval === 1 ? '' : `–${end}`}`,
        count: value,
        min: start,
        max: end
      };
    });
}

/**
 * Calculates average mastery percentage per subject.
 */
export function getSubjectMastery(entities: any[]) {
  const subjectStats: Record<string, { sum: number; count: number; max: number }> = {};
  
  entities.forEach(u => {
    if (!hasDTMResult(u)) return;

    const processSubject = (name: string, point: number, max: number) => {
      if (!name || name.toLowerCase() === "noma'lum") return;
      if (!subjectStats[name]) subjectStats[name] = { sum: 0, count: 0, max };
      subjectStats[name].sum += point;
      subjectStats[name].count++;
    };

    const subjects = Array.isArray(u.dtm?.subjects) ? u.dtm.subjects : [];
    if (subjects.length > 0) {
      subjects.forEach((subject: any) => {
        processSubject(
          subject.subject_name,
          Number(subject.earned_ball) || 0,
          Number(subject.max_ball) || 1
        );
      });
      return;
    }

    const res = u.test_results;
    if (!res) return;

    res.mandatory?.forEach((m: any) => processSubject(m.name, m.point, 11.4));
    if (res.primary) processSubject(res.primary.name, res.primary.point, 93);
    if (res.secondary) processSubject(res.secondary.name, res.secondary.point, 63);
  });
  
  return Object.entries(subjectStats)
    .map(([subject, stats]) => ({
      subject,
      avg_point: stats.sum / stats.count,
      mastery_percent: (stats.sum / (stats.count * stats.max)) * 100,
      count: stats.count
    }))
    .sort((a, b) => b.mastery_percent - a.mastery_percent);
}

/**
 * Identifies students at risk (scoring below threshold).
 */
export function getRiskAnalytics(entities: any[], passLine: number = 70) {
  const testedUsers = entities.filter(u => {
    const point = getUserTotalPoint(u) ?? 0;
    return hasDTMResult(u) && point > 0;
  });
  const riskUsers = testedUsers.filter(u => (getUserTotalPoint(u) ?? 0) < passLine);
  
  return {
    totalTested: testedUsers.length,
    riskCount: riskUsers.length,
    riskPercent: testedUsers.length > 0 ? (riskUsers.length / testedUsers.length) * 100 : 0,
    riskUsers: riskUsers
      .sort((a, b) => (getUserTotalPoint(a) ?? 0) - (getUserTotalPoint(b) ?? 0))
      .slice(0, 10)
  };
}

/**
 * Aggregates performance by region.
 */
export function getRegionalRanking(entities: any[]) {
  const regionStats: Record<string, { sum: number; count: number }> = {};
  
  entities.forEach(u => {
    const point = getUserTotalPoint(u);
    const region = normalizeRegion(u.region ?? u.Region);
    if (!region || !hasDTMResult(u) || point === null) return;
    if (!regionStats[region]) regionStats[region] = { sum: 0, count: 0 };
    regionStats[region].sum += point;
    regionStats[region].count++;
  });
  
  return Object.entries(regionStats)
    .map(([region, stats]) => ({
      region,
      avg_point: stats.sum / stats.count,
      count: stats.count
    }))
    .sort((a, b) => b.avg_point - a.avg_point);
}

/**
 * Generates daily performance trend data.
 */
export function getTrendAnalysis(entities: any[]) {
  const dayStats: Record<string, { sum: number; count: number }> = {};
  
  entities.forEach(u => {
    const point = getUserTotalPoint(u);
    const createdAt = u.dtm?.created_at ?? u.created_at;
    if (!createdAt || !hasDTMResult(u) || point === null) return;
    const date = String(createdAt).split('T')[0];
    if (!dayStats[date]) dayStats[date] = { sum: 0, count: 0 };
    dayStats[date].sum += point;
    dayStats[date].count++;
  });
  
  return Object.entries(dayStats)
    .map(([date, stats]) => ({
      date,
      avg_point: stats.sum / stats.count,
      total_submissions: stats.count
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculates success probability (simulated).
 */
export function calculateDTMPrediction(score: number): { percent: number; status: string } {
  const max = 189;
  const pct = (score / max) * 100;
  
  let status = "Past";
  if (pct >= 80) status = "Juda yuqori";
  else if (pct >= 60) status = "Yuqori";
  else if (pct >= 40) status = "O'rtacha";
  
  return { 
    percent: Math.round(pct), 
    status 
  };
}

/**
 * Shared Recharts Tooltip Style that respects CSS variables for themes.
 */
export const ChartTooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "12px",
  fontSize: "12px",
  boxShadow: "0 10px 15px -3px hsl(var(--glass-shadow)), 0 4px 6px -4px hsl(var(--glass-shadow))",
};
