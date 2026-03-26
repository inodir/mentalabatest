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
 * Generates score distribution data with a specified interval.
 */
export function getScoreDistribution(
  users: any[], 
  interval: number = 1, 
  maxScore: number = 189,
  getPoint: (user: any) => number | null = (u) => u.total_point ?? (u.dtm?.total_ball as number) ?? null,
  hasResult: (user: any) => boolean = (u) => u.has_result ?? u.dtm?.tested ?? false
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
        soni: value,
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
    const res = u.test_results;
    if (!res) return;
    
    const processSubject = (name: string, point: number, max: number) => {
      if (!name || name.toLowerCase() === "noma'lum") return;
      if (!subjectStats[name]) subjectStats[name] = { sum: 0, count: 0, max };
      subjectStats[name].sum += point;
      subjectStats[name].count++;
    };
    
    res.mandatory?.forEach((m: any) => processSubject(m.name, m.point, 11.4)); // Each mandatory is ~11.4 max on 189 scale (some variation)
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
  const testedUsers = entities.filter(u => u.has_result && (u.total_point ?? 0) > 0);
  const riskUsers = testedUsers.filter(u => (u.total_point ?? 0) < passLine);
  
  return {
    totalTested: testedUsers.length,
    riskCount: riskUsers.length,
    riskPercent: testedUsers.length > 0 ? (riskUsers.length / testedUsers.length) * 100 : 0,
    riskUsers: riskUsers.sort((a, b) => (a.total_point ?? 0) - (b.total_point ?? 0)).slice(0, 10)
  };
}

/**
 * Aggregates performance by region.
 */
export function getRegionalRanking(entities: any[]) {
  const regionStats: Record<string, { sum: number; count: number }> = {};
  
  entities.forEach(u => {
    if (!u.region || !u.has_result) return;
    if (!regionStats[u.region]) regionStats[u.region] = { sum: 0, count: 0 };
    regionStats[u.region].sum += (u.total_point ?? 0);
    regionStats[u.region].count++;
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
    if (!u.created_at || !u.has_result) return;
    const date = u.created_at.split('T')[0];
    if (!dayStats[date]) dayStats[date] = { sum: 0, count: 0 };
    dayStats[date].sum += (u.total_point ?? 0);
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
