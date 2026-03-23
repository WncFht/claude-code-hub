import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SQL } from "drizzle-orm";
import { CasingCache } from "drizzle-orm/casing";

function toSql(query: SQL) {
  return query.toQuery({
    escapeName: (name: string) => `"${name}"`,
    escapeParam: (num: number, _value: unknown) => `$${num}`,
    escapeString: (value: string) => `'${value}'`,
    casing: new CasingCache(),
    paramStartIndex: { value: 1 },
  });
}

describe("getRateLimitEventStats - query parameter binding", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("binds user, provider, and time-range filters into the executed SQL query", async () => {
    const executeMock = vi.fn().mockResolvedValue([]);

    vi.doMock("@/drizzle/db", () => ({
      db: {
        execute: executeMock,
      },
    }));

    vi.doMock("@/lib/utils/timezone", () => ({
      resolveSystemTimezone: vi.fn(async () => "Asia/Shanghai"),
    }));

    const { getRateLimitEventStats } = await import("@/repository/statistics");

    const startTime = new Date("2026-03-15T09:47:00.000Z");
    const endTime = new Date("2026-03-22T09:47:00.000Z");

    await getRateLimitEventStats({
      user_id: 101,
      provider_id: 202,
      start_time: startTime,
      end_time: endTime,
    });

    expect(executeMock).toHaveBeenCalledTimes(1);

    const query = executeMock.mock.calls[0]?.[0] as SQL;
    const built = toSql(query);
    const normalizedParams = built.params.map((param) =>
      param instanceof Date ? param.toISOString() : String(param)
    );
    const lastParam = built.params[built.params.length - 1];

    expect(normalizedParams).toEqual(
      expect.arrayContaining([
        "Asia/Shanghai",
        "101",
        "202",
        startTime.toISOString(),
        endTime.toISOString(),
      ])
    );
    expect(built.params.length).toBeGreaterThanOrEqual(5);
    expect(lastParam).toBe(endTime.toISOString());
    expect(built.params.some((param) => param instanceof Date)).toBe(false);
  });
});
