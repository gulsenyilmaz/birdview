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
      return (
        typeof birth === "number" &&
        (
          death === null ||
          death === undefined ||
          typeof death !== "number" ||
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

// export function getFullRange<T extends Record<string, any>>(items: T[], start:keyof T, end:keyof T): [number, number] {
//   const currentYear = new Date().getFullYear();

//   const startYears = items
//     .map((item) => item[start] as unknown)
//     .filter((d): d is number => typeof d === "number");

//   const endYears = items
//     .map((item) => item[end] as unknown)
//     .filter((d): d is number => typeof d === "number");

//   const someoneAlive = items.some((item) => {
//     const birth = item[start];
//     const death = item[end];
//     return (
//       typeof birth === "number" &&
//       (death === null || death === undefined || typeof death !== "number" || birth + 100 > currentYear)
//     );
//   });

//   const min = Math.min(...startYears)<-1500 ? -1500 : Math.min(...startYears);
//   const max = someoneAlive
//     ? currentYear
//     : endYears.length > 0
//     ? Math.max(...endYears)
//     : currentYear; // fallback

//   return [min, max];
// }


