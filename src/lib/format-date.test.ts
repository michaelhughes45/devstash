import { describe, expect, it } from "vitest";

import { formatLongDate, formatShortDate, formatShortDateWithYear } from "@/lib/format-date";

// Late in the UTC day, so a local time zone ahead of UTC would show the next day
const date = new Date("2026-10-08T23:30:00Z");

describe("format-date", () => {
  it("formats in UTC", () => {
    expect(formatShortDate(date)).toBe("Oct 8");
    expect(formatShortDateWithYear(date)).toBe("Oct 8, 2026");
    expect(formatLongDate(date)).toBe("October 8, 2026");
  });
});
