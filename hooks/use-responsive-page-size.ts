"use client";

import { useEffect, useState } from "react";

type ResponsivePageSizeOptions = {
  defaultSize: number;
  landscapeSize: number;
  wideSize: number;
};

const FIXED_CHROME_REM = 24;

const ROW_REM = 2.5;

export function useResponsivePageSize({
  defaultSize,
  landscapeSize,
  wideSize,
}: ResponsivePageSizeOptions) {
  const [pageSize, setPageSize] = useState(defaultSize);

  useEffect(() => {
    const update = () => {
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const rows = Math.floor((window.innerHeight / rem - FIXED_CHROME_REM) / ROW_REM);
      const min = Math.min(landscapeSize, defaultSize);
      const max = Math.max(wideSize, defaultSize, 16);

      setPageSize(Math.max(min, Math.min(max, rows)));
    };

    update();
    window.addEventListener("resize", update);

    return () => window.removeEventListener("resize", update);
  }, [defaultSize, landscapeSize, wideSize]);

  return pageSize;
}
