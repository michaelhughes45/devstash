import { describe, expect, it } from "vitest";

import { fuzzyScore, fuzzySearch, type SearchField } from "@/lib/fuzzy-search";

describe("fuzzyScore", () => {
  it("ranks exact, prefix, word-start, substring and scattered matches in that order", () => {
    const exact = fuzzyScore("Docker", "docker")!;
    const prefix = fuzzyScore("Docker compose", "docker")!;
    const wordStart = fuzzyScore("Run docker", "docker")!;
    const substring = fuzzyScore("Dockerfile", "kerf")!;
    const scattered = fuzzyScore("Docker", "dkr")!;

    expect(exact).toBeGreaterThan(prefix);
    expect(prefix).toBeGreaterThan(wordStart);
    expect(wordStart).toBeGreaterThan(substring);
    expect(substring).toBeGreaterThan(scattered);
    expect(scattered).toBeGreaterThan(0);
  });

  it("is case-insensitive", () => {
    expect(fuzzyScore("useEffect cleanup", "useeffect")).not.toBeNull();
  });

  it("returns null when the characters aren't all present in order", () => {
    expect(fuzzyScore("Docker", "rkd")).toBeNull();
    expect(fuzzyScore("Docker", "dockers")).toBeNull();
  });

  it("only matches substrings when fuzzy matching is off", () => {
    expect(fuzzyScore("Docker", "dkr", false)).toBeNull();
    expect(fuzzyScore("Docker", "ock", false)).not.toBeNull();
  });
});

interface Entry {
  title: string;
  body: string;
}

const fields = (entry: Entry): SearchField[] => [
  { text: entry.title, weight: 3 },
  { text: entry.body, weight: 1, fuzzy: false },
];

const entries: Entry[] = [
  { title: "Git aliases", body: "useful shortcuts for git" },
  { title: "React hooks", body: "custom useEffect patterns" },
  { title: "Docker compose", body: "services for local dev" },
  { title: "Kubernetes deploy", body: "docker images in a cluster" },
];

describe("fuzzySearch", () => {
  it("returns the first entries in order for a blank query", () => {
    expect(fuzzySearch(entries, "  ", fields, 2)).toEqual(entries.slice(0, 2));
  });

  it("ranks title matches above matches in lower-weighted fields", () => {
    expect(fuzzySearch(entries, "docker", fields, 10).map((e) => e.title)).toEqual([
      "Docker compose",
      "Kubernetes deploy",
    ]);
  });

  it("matches scattered characters in fuzzy fields only", () => {
    expect(fuzzySearch(entries, "rcthk", fields, 10).map((e) => e.title)).toEqual([
      "React hooks",
    ]);
    // "srvcs" is scattered in a body, which only matches whole substrings
    expect(fuzzySearch(entries, "srvcs", fields, 10)).toEqual([]);
  });

  it("requires every term to match some field", () => {
    expect(fuzzySearch(entries, "react effect", fields, 10).map((e) => e.title)).toEqual([
      "React hooks",
    ]);
    expect(fuzzySearch(entries, "react docker", fields, 10)).toEqual([]);
  });

  it("keeps the original order for equal scores and applies the limit", () => {
    const same = [
      { title: "Note one", body: "" },
      { title: "Note two", body: "" },
      { title: "Note three", body: "" },
    ];
    expect(fuzzySearch(same, "note", fields, 2)).toEqual(same.slice(0, 2));
  });
});
