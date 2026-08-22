"use client";

import { useEffect, useState } from "react";

type ResponsivePageSizeOptions = {
  defaultSize: number;
  landscapeSize: number;
  wideSize: number;
};

export function useResponsivePageSize({
  defaultSize,
  landscapeSize,
  wideSize,
}: ResponsivePageSizeOptions) {
  const [pageSize, setPageSize] = useState(defaultSize);

  useEffect(() => {
    const landscape = window.matchMedia(
      "(min-width: 1100px) and (max-width: 1399px) and (orientation: landscape)",
    );
    const wide = window.matchMedia("(min-width: 2200px)");
    const update = () =>
      setPageSize(
        landscape.matches
          ? landscapeSize
          : wide.matches
            ? wideSize
            : defaultSize,
      );

    update();
    landscape.addEventListener("change", update);
    wide.addEventListener("change", update);
    return () => {
      landscape.removeEventListener("change", update);
      wide.removeEventListener("change", update);
    };
  }, [defaultSize, landscapeSize, wideSize]);

  return pageSize;
}
