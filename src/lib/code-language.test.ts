import { describe, expect, it } from "vitest";

import { toMonacoLanguage } from "@/lib/code-language";

describe("toMonacoLanguage", () => {
  it("passes Monaco language ids through", () => {
    expect(toMonacoLanguage("typescript")).toBe("typescript");
    expect(toMonacoLanguage("python")).toBe("python");
    expect(toMonacoLanguage("sql")).toBe("sql");
  });

  it("maps common aliases and extensions", () => {
    expect(toMonacoLanguage("ts")).toBe("typescript");
    expect(toMonacoLanguage("tsx")).toBe("typescript");
    expect(toMonacoLanguage("js")).toBe("javascript");
    expect(toMonacoLanguage("bash")).toBe("shell");
    expect(toMonacoLanguage("yml")).toBe("yaml");
    expect(toMonacoLanguage("c#")).toBe("csharp");
  });

  it("ignores case and surrounding spaces", () => {
    expect(toMonacoLanguage("  TypeScript ")).toBe("typescript");
    expect(toMonacoLanguage("BASH")).toBe("shell");
  });

  it("falls back to plain text for missing or unknown languages", () => {
    expect(toMonacoLanguage(null)).toBe("plaintext");
    expect(toMonacoLanguage(undefined)).toBe("plaintext");
    expect(toMonacoLanguage("   ")).toBe("plaintext");
    expect(toMonacoLanguage("brainfuck")).toBe("plaintext");
  });
});
