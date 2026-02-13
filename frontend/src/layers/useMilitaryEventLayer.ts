import { useEffect, useMemo, useState } from "react";
import type { MilitaryEvent } from "../entities/MilitaryEvent";
import { getFullRange } from "../utils/dateUtils";
import { buildEventCounts } from "../utils/buildCounts";

export type MilitaryEventLayerFilters = {
  military_event_depth_index?: number;
};

export function useMilitaryEventLayer(args: {
  active: boolean;
  backendUrl: string;
  filters: MilitaryEventLayerFilters;
  selectedYear: number;
}) {
  const { active, backendUrl, filters, selectedYear } = args;

  const [loadingEvents, setLoadingEvents] = useState(false);

  const [militaryEvents, setMilitaryEvents] = useState<MilitaryEvent[]>([]);
  const [fullRange, setFullRange] = useState<[number, number]>([-3000, 2025]);
  const [eventCounts, setEventCounts] = useState<{ year: number; count: number }[]>([]);

  useEffect(() => {
    if (!active) return;
    if (!backendUrl) return;

    const qp = new URLSearchParams();
    if (filters.military_event_depth_index != null) {
      qp.append(
        "military_event_depth_index",
        String(filters.military_event_depth_index)
      );
    }

    const controller = new AbortController();
    setLoadingEvents(true);

    (async () => {
      const res = await fetch(
        `${backendUrl}/allmilitaryevents?${qp.toString()}`,
        { signal: controller.signal }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (controller.signal.aborted) return;

      const list: MilitaryEvent[] = data.military_events ?? [];
      setMilitaryEvents(list);

      const range = getFullRange(list, "start_date", "end_date", "events");
      setFullRange(range);

      setEventCounts(list.length > 1 ? buildEventCounts(list, range) : []);
      setLoadingEvents(false);
    })().catch((err) => {
      if (controller.signal.aborted) return;
      console.error("useMilitaryEventLayer error:", err);
    });

    return () => controller.abort();
  }, [
    active,
    backendUrl,
    filters.military_event_depth_index,
  ]);

  const filteredMilitaryEvents = useMemo(() => {
    if (!active) return [];
    return militaryEvents.filter(
      (me) => me.start_date && me.start_date <= selectedYear
      // ileride istersen:
      // && (!me.end_date || me.end_date >= selectedYear)
    );
  }, [active, militaryEvents, selectedYear]);

  return {
    militaryEvents,
    filteredMilitaryEvents,
    fullRange,
    eventCounts,
    loadingEvents
  };
}
