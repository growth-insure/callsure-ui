import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn() utility", () => {
  it("merges multiple class strings", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles empty inputs", () => {
    expect(cn()).toBe("");
    expect(cn("")).toBe("");
    expect(cn(undefined)).toBe("");
    expect(cn(null)).toBe("");
  });

  it("handles conditional classes via clsx", () => {
    expect(cn("base", false && "hidden", true && "visible")).toBe("base visible");
  });

  it("deduplicates conflicting Tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("merges responsive variants correctly", () => {
    expect(cn("md:px-2", "md:px-4")).toBe("md:px-4");
  });

  it("handles array inputs", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("handles object inputs (clsx style)", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });

  it("handles mixed inputs", () => {
    expect(cn("base", ["arr1", "arr2"], { conditional: true })).toBe(
      "base arr1 arr2 conditional"
    );
  });

  it("preserves non-conflicting Tailwind classes", () => {
    expect(cn("p-4", "m-2", "text-lg")).toBe("p-4 m-2 text-lg");
  });

  it("handles undefined and null in arrays", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
  });
});
