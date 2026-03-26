/**
 * Normalizes gender strings into a standard format.
 * Handles Uzbek, English, and numeric representations.
 */
export function normalizeGender(gender: any): 'male' | 'female' | 'other' {
  if (gender === undefined || gender === null) return 'other';
  
  const g = gender.toString().toLowerCase().trim();
  
  // Male variations
  if (
    g === 'erkak' || 
    g === 'male' || 
    g === 'm' || 
    g === "o'g'il" || 
    g === "o'g`il" || 
    g === "og'il" || 
    g === "o'gil" || 
    g === '1'
  ) {
    return 'male';
  }
  
  // Female variations
  if (
    g === 'ayol' || 
    g === 'female' || 
    g === 'f' || 
    g === 'qiz' || 
    g === '2'
  ) {
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
