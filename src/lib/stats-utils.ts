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
