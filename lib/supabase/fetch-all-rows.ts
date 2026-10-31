const PAGE_SIZE = 500;

const ID_BATCH_SIZE = 100;

type PageResponse<T> = {
  data: T[] | null;
  error: unknown | null;
};

type PageQuery<T> = (from: number, to: number) => PromiseLike<PageResponse<T>>;

/** Reads past the API row cap; the separate page requests do not share a database snapshot. */
export async function fetchAllRows<T>(queryPage: PageQuery<T>) {
  const rows: T[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await queryPage(from, from + PAGE_SIZE - 1);

    if (error) return { data: null, error };

    const page = data ?? [];
    rows.push(...page);

    if (page.length < PAGE_SIZE) {
      return { data: rows, error: null };
    }
  }
}

export async function fetchRowsInBatches<T>(
  ids: readonly string[],
  queryBatch: (ids: string[]) => PromiseLike<PageResponse<T>>,
) {
  const rows: T[] = [];

  for (let start = 0; start < ids.length; start += ID_BATCH_SIZE) {
    const { data, error } = await queryBatch(ids.slice(start, start + ID_BATCH_SIZE));

    if (error) return { data: null, error };

    rows.push(...(data ?? []));
  }

  return { data: rows, error: null };
}
