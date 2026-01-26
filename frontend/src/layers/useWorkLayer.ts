import { useEffect, useMemo, useState } from "react";
import type { Work } from "../entities/Work";
import { getFullRangeByYearField } from "../utils/dateUtils";
import { buildWorkCountsByCreatedDate } from "../utils/buildCounts";

export type WorkLayerFilters = {
   human_id?: number;
};

export function useWorkLayer(args: {
  active: boolean;
  backendUrl: string;
  filters: WorkLayerFilters;
  selectedYear: number;
}) {
  const { active, backendUrl, filters, selectedYear } = args;

  const [works, setWorks] = useState<Work[]>([]);
  const [fullRange, setFullRange] = useState<[number, number]>([-1600, 2025]);
  const [workCounts, setWorkCounts] = useState<{ year: number; count: number }[]>([]);

  useEffect(() => {
    if (!active) return;
    if (!backendUrl) return;
    if (!filters.human_id) return

    const qp = new URLSearchParams();
   
    qp.append(
    "human_id",
    String(filters.human_id)
    );
    

    const controller = new AbortController();

    (async () => {
      const res = await fetch(
        `${backendUrl}/allworks?${qp.toString()}`,
        { signal: controller.signal }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (controller.signal.aborted) return;

      const list: Work[] = data.works ?? [];
      setWorks(list);
      console.log("WORKS:", list)
      
      const worksRange = getFullRangeByYearField(list, "created_date");
      setFullRange(worksRange);

      setWorkCounts(list.length > 0 ? buildWorkCountsByCreatedDate(list, worksRange) : []);
    })().catch((err) => {
      if (controller.signal.aborted) return;
      console.error("useWorkLayer error:", err);
    });

    return () => controller.abort();
  }, [
    active,
    backendUrl,
    filters.human_id,
  ]);

  const filteredWorks = useMemo(() => {
    if (!active) return [];
    return works.filter((w) => w.created_date == selectedYear);
  }, [active, works, selectedYear]);

  return {
    works,
    filteredWorks,
    fullRange,
    workCounts,
  };
}
