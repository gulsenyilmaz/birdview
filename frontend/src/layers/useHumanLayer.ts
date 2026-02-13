import { useEffect, useMemo, useState } from "react";
import type { Human } from "../entities/Human";
import { getFullRange } from "../utils/dateUtils";
import { buildAliveCounts } from "../utils/buildCounts";

export type HumanLayerFilters = {
  human_id?: number;
  occupation_id?: number;
  gender_id?: number;
  nationality_id?: number;
  movement_id?: number;
  collection_id?: number;
  location_id?: number;
  relationship_type_name?: string;
};

export function useHumanLayer(args: {
  active: boolean;
  backendUrl: string;
  filters: HumanLayerFilters;
  selectedYear: number;
}) {
  const { active, backendUrl, filters, selectedYear } = args;

  const [loadingHumans, setLoadingHumans] = useState(false);

  const [humans, setHumans] = useState<Human[]>([]);
  const [fullRange, setFullRange] = useState<[number, number]>([-1600, 2026]);
  const [aliveCounts, setAliveCounts] = useState<{ year: number; count: number }[]>([]);

  useEffect(() => {
    if (!active) return;
    if (!backendUrl) return;

    const qp = new URLSearchParams();
    if (filters.human_id) qp.append("human_id", String(filters.human_id));
    if (filters.occupation_id) qp.append("occupation_id", String(filters.occupation_id));
    if (filters.gender_id) qp.append("gender_id", String(filters.gender_id));
    if (filters.nationality_id) qp.append("nationality_id", String(filters.nationality_id));
    if (filters.movement_id) qp.append("movement_id", String(filters.movement_id));
    if (filters.collection_id) qp.append("collection_id", String(filters.collection_id));

    if (filters.location_id) {
      qp.append("location_id", String(filters.location_id));
      if (filters.relationship_type_name) {
        qp.append("relationship_type_name", filters.relationship_type_name);
      }
    }

    const controller = new AbortController();
    setLoadingHumans(true);

    (async () => {
      const res = await fetch(`${backendUrl}/allhumans?${qp.toString()}`, {
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (controller.signal.aborted) return;

      const list: Human[] = data.humans ?? [];
      setHumans(list);

      const range = getFullRange(list, "birth_date", "death_date", "humans");
      setFullRange(range);

      setAliveCounts(list.length > 1 ? buildAliveCounts(list, range, { maxAge: 100 }) : []);
      setLoadingHumans(false);
    })().catch((err) => {
      if (controller.signal.aborted) return;
      console.error("useHumanLayer error:", err);
    });

    return () => controller.abort();
  }, [
    active,
    backendUrl,
    filters.human_id,
    filters.occupation_id,
    filters.gender_id,
    filters.nationality_id,
    filters.movement_id,
    filters.collection_id,
    filters.location_id,
    filters.relationship_type_name,
  ]);

  const filteredHumans = useMemo(() => {
    if (!active) return [];
    return humans.filter(
      (h) =>
        h.birth_date <= selectedYear &&
        (!h.death_date || h.death_date >= selectedYear) &&
        selectedYear - h.birth_date < 100
    );
  }, [active, humans, selectedYear]);

  return { humans, filteredHumans, fullRange, aliveCounts, loadingHumans };
}
