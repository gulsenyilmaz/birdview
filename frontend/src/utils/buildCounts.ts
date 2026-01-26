// utils/buildAliveCounts.ts

export type YearCount = { year: number; count: number };

type Person = {
  birth_date?: number | string | Date | null;
  death_date?: number | string | Date | null;
};

type EventLike = {
  start_date?: number | string | Date | null;
  end_date?: number | string | Date | null;
};

type WorkLike = {
  created_date?: number | string | Date | null;
};




const coerceYear = (v: unknown): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (v instanceof Date && Number.isFinite(v.getFullYear())) return v.getFullYear();
  if (typeof v === "string") {
    const m = v.match(/(-?\d{1,4})/);
    if (m) return Number(m[1]);
  }
  return null;
};



/**
 * Verilen windowRange için her yıl hayatta olan kişi sayısını döner.
 * maxAge: veri hatalarına karşı üst sınır (ör. 100/110). null verirsen kapatılır.
 */
export function buildAliveCounts(
  humans: Person[],
  windowRange: [number, number],
  opts?: { maxAge?: number | null }
): YearCount[] {
  const [minY, maxY] = windowRange;
  const maxAge = opts?.maxAge ?? 110;

  // Fark dizisi (sweep-line): +1 başlangıçta, -(1) bitiş+1'de
  const delta = new Map<number, number>();

  for (const h of humans) {
    const b = coerceYear(h.birth_date);
    if (b == null) continue;

    const dRaw = coerceYear(h.death_date);
    let dEff: number | null = dRaw;

    // Maksimum yaşı uygula (veri hatalarına karşı)
    if (maxAge != null) {
      const ageCap = b + maxAge;
      dEff = dEff == null ? ageCap : Math.min(dEff, ageCap);
    }

    // Ölüm bilgisi yoksa ve maxAge null ise pencerenin sonuna kadar yaşat.
    if (dEff == null) dEff = maxY;

    // Pencereye kırp
    const start = Math.max(minY, b);
    const end = Math.min(maxY, dEff);

    if (end < minY || start > maxY || end < start) continue;

    delta.set(start, (delta.get(start) ?? 0) + 1);
    delta.set(end + 1, (delta.get(end + 1) ?? 0) - 1);
  }

  // Prefix sum ile yıl yıl sayıları üret
  const out: YearCount[] = [];
  let running = 0;
  for (let y = minY; y <= maxY; y++) {
    running += delta.get(y) ?? 0;
    out.push({ year: y, count: running });
  }
  return out;
}


/**
 * Verilen windowRange için her yıl aktif olan event sayısını döner.
 * - start_date: event'in başladığı yıl (dahil)
 * - end_date: event'in bittiği yıl (dahil; null ise pencerenin sonuna kadar sayılır)
 */
export function buildEventCounts(
  events: EventLike[],
  windowRange: [number, number]
): YearCount[] {
  const [minY, maxY] = windowRange;

  const delta = new Map<number, number>();

  for (const ev of events) {
    const s = coerceYear(ev.start_date);
    if (s == null) continue;

    let e = coerceYear(ev.end_date);

    // end_date yoksa pencerenin sonuna kadar aktif saysın
    if (e == null) e = maxY;

    // pencereye kırp
    const start = Math.max(minY, s);
    const end = Math.min(maxY, e);

    if (end < minY || start > maxY || end < start) continue;

    // sweep-line: [start, end] aralığını kapsayan fark dizisi
    delta.set(start, (delta.get(start) ?? 0) + 1);
    delta.set(end + 1, (delta.get(end + 1) ?? 0) - 1);
  }

  const out: YearCount[] = [];
  let running = 0;

  for (let y = minY; y <= maxY; y++) {
    running += delta.get(y) ?? 0;
    out.push({ year: y, count: running });
  }

  return out;
}


/**
 * Verilen windowRange için her yıl üretilen eser sayısını döner.
 * created_date tek yıl varsayımıyla "flow" histogram üretir.
 */
export function buildWorkCountsByCreatedDate(
  works: WorkLike[],
  windowRange: [number, number]
): YearCount[] {
  const [minY, maxY] = windowRange;

  // yıl -> o yıl üretilen eser sayısı
  const counts = new Map<number, number>();
  console.log("buildWorkCountsByCreatedDate", works)
  for (const w of works) {
    const y = coerceYear(w.created_date);

    console.log("coerceYear", y)
    if (y == null) continue;
    if (y < minY || y > maxY) continue;

    counts.set(y, (counts.get(y) ?? 0) + 1);
  }

  const out: YearCount[] = [];
  for (let y = minY; y <= maxY; y++) {
    out.push({ year: y, count: counts.get(y) ?? 0 });
  }
  return out;
}

export function buildCumulativeWorkCountsByCreatedDate(
  works: WorkLike[],
  windowRange: [number, number]
): YearCount[] {
  const yearly = buildWorkCountsByCreatedDate(works, windowRange);
  let running = 0;
  return yearly.map(({ year, count }) => {
    running += count;
    return { year, count: running };
  });
}
