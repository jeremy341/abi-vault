"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const PHONE_PAGE_SIZE = 10;
const MIN_ROWS = 3;
const MAX_ROWS = 50;

/**
 * Picks how many table rows fit on screen. The probe is an empty element that is
 * as tall as the table may grow, so rows, header and probe are measured in the
 * same units whatever the page zoom is.
 */
export function useFitPageSize(rowCount: number) {
  const [pageSize, setPageSize] = useState(8);
  const probeRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const measure = useCallback(() => {
    if (!window.matchMedia("(min-width: 768px)").matches) {
      setPageSize(PHONE_PAGE_SIZE);
      return;
    }

    const probe = probeRef.current;
    const row = wrapRef.current?.querySelector("tbody tr");
    if (!probe || !row) return;

    const header = wrapRef.current?.querySelector("thead")?.getBoundingClientRect().height ?? 0;
    const rows = Math.floor((probe.getBoundingClientRect().height - header) / row.getBoundingClientRect().height);

    setPageSize(Math.max(MIN_ROWS, Math.min(MAX_ROWS, rows)));
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);

    // The probe changes with the window; the table changes when rows replace the loading skeleton.
    if (probeRef.current) observer.observe(probeRef.current);
    if (wrapRef.current) observer.observe(wrapRef.current);
    window.addEventListener("resize", measure);
    // Row height changes once the web fonts have loaded.
    void document.fonts?.ready.then(measure);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, rowCount]);

  return { pageSize, probeRef, wrapRef };
}
