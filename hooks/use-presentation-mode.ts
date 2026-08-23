"use client";

import * as React from "react";

export type PresentationMode = "desktop" | "tablet" | "phone";

const PHONE_QUERY =
  "(max-width: 767px), (max-width: 950px) and (max-height: 600px)";
const TABLET_QUERY =
  "(min-width: 768px) and (max-width: 1279px), (min-width: 1280px) and (max-width: 1399px) and (min-height: 800px)";

function getPresentationMode(): PresentationMode {
  if (window.matchMedia(PHONE_QUERY).matches) return "phone";
  if (window.matchMedia(TABLET_QUERY).matches) return "tablet";
  return "desktop";
}

export function usePresentationMode(): PresentationMode {
  const subscribe = React.useCallback((onStoreChange: () => void) => {
    const phone = window.matchMedia(PHONE_QUERY);
    const tablet = window.matchMedia(TABLET_QUERY);

    phone.addEventListener("change", onStoreChange);
    tablet.addEventListener("change", onStoreChange);

    return () => {
      phone.removeEventListener("change", onStoreChange);
      tablet.removeEventListener("change", onStoreChange);
    };
  }, []);

  const getSnapshot = React.useCallback(() => getPresentationMode(), []);
  const getServerSnapshot = React.useCallback<() => PresentationMode>(
    () => "desktop",
    [],
  );

  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
