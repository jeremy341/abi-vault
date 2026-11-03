"use client";

import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from "react";

type LocalValue<TQuery, TValue> = {
  query: TQuery | null;
  value: TValue;
};

export function useQueryBackedState<TQuery, TValue>(
  query: TQuery | null,
  select: (query: TQuery) => TValue,
  initialValue: TValue,
): [TValue, Dispatch<SetStateAction<TValue>>] {
  const [localValue, setLocalValue] = useState<LocalValue<TQuery, TValue> | null>(null);

  const value = useMemo(() => {
    if (query === null) return localValue ? localValue.value : initialValue;

    if (localValue?.query === query) return localValue.value;

    return select(query);
  }, [initialValue, localValue, query, select]);

  const setValue = useCallback<Dispatch<SetStateAction<TValue>>>((update) => {
    setLocalValue((current) => {
      let currentValue: TValue;

      if (query === null) {
        currentValue = current ? current.value : initialValue;
      } else if (current?.query === query) {
        currentValue = current.value;
      } else {
        currentValue = select(query);
      }

      return {
        query,
        value: update instanceof Function
          ? (update as (current: TValue) => TValue)(currentValue)
          : update,
      };
    });
  }, [initialValue, query, select]);

  return [value, setValue];
}
