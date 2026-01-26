/**
 * Belirtilen key üzerinden, herhangi bir nesne dizisinden
 * numeric olanları alır, uniq hale getirir ve sıralar.
 *
 * @param items - Herhangi bir nesne dizisi
 * @param field - Örneğin "birth_date", "start_date" gibi bir alan adı
 * @returns number[] - sıralı ve tekrarsız değerler
 */

export function extractYear(iso:string) {
  if (!iso) return null;
  const m = String(iso).trim().match(/^(-?\d{1,6})/); // -0467, 1590, 2025...
  if (!m) return null;
  return Number(m[1]); // -467
}


export function extractSortedDates<T extends Record<string, any>>(
  items: T[],
  field: keyof T
): number[] {
  const rawValues = items.map((item) => item[field]);
  const filtered = rawValues.filter(
    (d: number | undefined | null): d is number => typeof d === "number"
  );
  const unique = [...new Set(filtered)] as number[];
  unique.sort((a, b) => a - b);
  return unique;
}


type RangeMode = "humans" | "events";

export function getFullRange<T extends Record<string, any>>(
  items: T[],
  start: keyof T,
  end: keyof T,
  mode: RangeMode = "humans"
): [number, number] {
  const currentYear = new Date().getFullYear();

  const startYears = items
    .map((item) => item[start] as unknown)
    .filter((d): d is number => typeof d === "number");

  const endYears = items
    .map((item) => item[end] as unknown)
    .filter((d): d is number => typeof d === "number");

  // startYears tamamen boşsa güvenlik için
  if (startYears.length === 0) {
    return [currentYear - 10, currentYear];
  }

  let someoneAlive = false;

  if (mode === "humans") {
    // SADECE humans için "hala hayatta" mantığı
    someoneAlive = items.some((item) => {
      const birth = item[start];
      const death = item[end];
      console.log(`getFullRange [${mode}] -> typeof death: ${typeof death}, death: ${death}`);
      return (
        typeof birth === "number" &&
        (
          (death === null ||
          death === undefined ||
          typeof death !== "number" )&&
          (birth as number) + 100 > currentYear
        )
      );
    });
  } else {
    // events için asla today'e clamp etme
    someoneAlive = false;
  }

  const rawMin = Math.min(...startYears);
  const min = rawMin < -1500 ? -1500 : rawMin;

  const max = someoneAlive
    ? currentYear
    : endYears.length > 0
    ? Math.max(...endYears)
    : currentYear;

  console.log(`getFullRange [${mode}] -> min: ${min}, max: ${max}, someoneAlive: ${someoneAlive}`);

  return [min, max];
}

export function getFullRangeByYearField<T extends Record<string, any>>(
  items: T[],
  yearField: keyof T,
  opts?: { clampMin?: number; fallback?: [number, number] }
): [number, number] {
  const currentYear = new Date().getFullYear();
  const fallback: [number, number] = opts?.fallback ?? [currentYear - 10, currentYear];
  const clampMin = opts?.clampMin ?? -1500;

  const years = items
    .map((item) => item[yearField] as unknown)
    .filter((y): y is number => typeof y === "number");
  
  console.log(`getFullRangeByYearField fallback: ${fallback}`);
  if (years.length === 0) return fallback;

  const rawMin = Math.min(...years);
  const rawMax = Math.max(...years);

  console.log(`getFullRangeByYearField min: ${rawMin}, max: ${rawMax}`);

  const min = rawMin < clampMin ? clampMin : rawMin;
  const max = rawMax;

  return [min, max];
}

export type YearRange = [number, number];

export function isValidRange(r: unknown): r is YearRange {
  return (
    Array.isArray(r) &&
    r.length === 2 &&
    Number.isFinite(r[0]) &&
    Number.isFinite(r[1]) &&
    r[0] <= r[1]
  );
}

/** aktif layer range'lerini kapsayan tek bir range döndürür (union) */
export function unionRanges(ranges: Array<YearRange | null | undefined>): YearRange {
  const valid = ranges.filter(isValidRange);
  if (valid.length === 0) return [1800, 2025];

  let minY = valid[0][0];
  let maxY = valid[0][1];

  for (const [a, b] of valid) {
    if (a < minY) minY = a;
    if (b > maxY) maxY = b;
  }
  return [minY, maxY];
}

export function clampRange(
  windowRange: [number, number],
  fullRange: [number, number]
): [number, number] {
  const [w0, w1] = windowRange;
  const [f0, f1] = fullRange;

  let a = Math.max(w0, f0);
  let b = Math.min(w1, f1);

  if (a > b) return [f0, f1]; // window tamamen dışarıdaysa resetle
  return [a, b];
}



