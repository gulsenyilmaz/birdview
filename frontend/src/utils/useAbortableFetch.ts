import { useEffect, useRef } from "react";

export function useAbortController() {
  const ref = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      ref.current?.abort();
    };
  }, []);

  const next = () => {
    ref.current?.abort();
    ref.current = new AbortController();
    return ref.current;
  };

  const abort = () => ref.current?.abort();

  return { next, abort };
}
