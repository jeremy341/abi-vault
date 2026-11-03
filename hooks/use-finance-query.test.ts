import { describe, expect, it } from "vitest";
import { selectQueryState } from "./use-finance-query";

type MemberQuery = { ok: boolean; items: string[] };

describe("finance query scope", () => {
  it("hides data from the previous organization while the new query loads", () => {
    const previous = {
      key: "members",
      scope: "organization-a:user-a",
      data: { ok: true, items: ["A member"] },
      loading: false,
      refreshing: false,
      failed: false,
    };

    const current = selectQueryState<MemberQuery>(
      previous,
      "members",
      "organization-b:user-b",
      { data: undefined, fresh: false },
    );

    expect(current).toEqual({
      data: undefined,
      loading: true,
      refreshing: false,
      failed: false,
    });
  });

  it("uses cached data for the requested organization", () => {
    const previous = {
      key: "members",
      scope: "organization-a:user-a",
      data: { ok: true, items: ["A member"] },
      loading: false,
      refreshing: false,
      failed: false,
    };

    const current = selectQueryState<MemberQuery>(
      previous,
      "members",
      "organization-b:user-b",
      { data: { ok: true, items: ["B member"] }, fresh: true },
    );

    expect(current).toEqual({
      data: { ok: true, items: ["B member"] },
      loading: false,
      refreshing: false,
      failed: false,
    });
  });
});
