/**
 * Belirtilen key üzerinden, herhangi bir nesne dizisinden
 * numeric olanları alır, uniq hale getirir ve sıralar.
 *
 * @param items - Herhangi bir nesne dizisi
 * @param field - Örneğin "birth_date", "start_date" gibi bir alan adı
 * @returns number[] - sıralı ve tekrarsız değerler
 */
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


export function getDateRange<T extends Record<string, any>>(items: T[]): [number, number] {
  const currentYear = new Date().getFullYear();

  const birthYears = items
    .map((item) => item["birth_date"])
    .filter((d): d is number => typeof d === "number");

  const deathYears = items
    .map((item) => item["death_date"])
    .filter((d): d is number => typeof d === "number");

  const someoneAlive = items.some((item) => {
    const birth = item["birth_date"];
    const death = item["death_date"];
    return (
      typeof birth === "number" &&
      (death === null || death === undefined || typeof death !== "number" || birth + 100 > currentYear)
    );
  });

  const min = Math.min(...birthYears);
  const max = someoneAlive
    ? currentYear
    : deathYears.length > 0
    ? Math.max(...deathYears)
    : currentYear; // fallback

  return [min, max];
}