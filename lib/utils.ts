export function parseSalary(raw: string): number {
  if (!raw) return 0;
  const cleaned = raw.replace(/[$,]/g, "");
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

export function formatSalary(raw: string): string {
  const num = parseSalary(raw);
  if (!num) return "N/A";
  return `$${num.toLocaleString()}`;
}

export function scoreColor(score: number): string {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 55) return "bg-amber-400";
  return "bg-rose-400";
}

export function scoreTextColor(score: number): string {
  if (score >= 75) return "text-emerald-600";
  if (score >= 55) return "text-amber-600";
  return "text-rose-500";
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// Normalize weights so they always sum to 100, preserving proportions.
// When one slider moves, the others scale proportionally.
export function normalizeWeights(
  weights: Record<string, number>,
  changedKey: string,
  newVal: number
): Record<string, number> {
  const result = { ...weights, [changedKey]: newVal };
  const otherKeys = Object.keys(result).filter((k) => k !== changedKey);
  const otherSum = otherKeys.reduce((s, k) => s + result[k], 0);
  const remaining = 100 - newVal;

  if (otherSum === 0) {
    // Distribute remaining evenly
    const share = Math.floor(remaining / otherKeys.length);
    otherKeys.forEach((k) => (result[k] = share));
    // Fix rounding remainder on last key
    const diff = remaining - share * otherKeys.length;
    if (otherKeys.length > 0) result[otherKeys[otherKeys.length - 1]] += diff;
  } else {
    // Scale proportionally
    let distributed = 0;
    otherKeys.forEach((k, i) => {
      if (i === otherKeys.length - 1) {
        result[k] = remaining - distributed;
      } else {
        const scaled = Math.round((result[k] / otherSum) * remaining);
        result[k] = scaled;
        distributed += scaled;
      }
    });
  }

  return result;
}
