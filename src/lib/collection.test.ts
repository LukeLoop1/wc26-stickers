import { describe, expect, it } from "vitest";
import { countHave, cycle, keyOf, stateOf } from "./collection";
import type { Collection } from "./types";

describe("keyOf", () => {
  it("formats code-num", () => {
    expect(keyOf("BRA", 7)).toBe("BRA-7");
  });
});

describe("stateOf", () => {
  it("defaults to need", () => {
    expect(stateOf({}, "BRA-7")).toBe("need");
  });
  it("reads have and spare", () => {
    const c: Collection = { "BRA-7": "have", "ARG-1": "spare" };
    expect(stateOf(c, "BRA-7")).toBe("have");
    expect(stateOf(c, "ARG-1")).toBe("spare");
  });
});

describe("cycle", () => {
  it("cycles need → have → spare → need", () => {
    let c: Collection = {};
    c = cycle(c, "BRA-7");
    expect(stateOf(c, "BRA-7")).toBe("have");
    c = cycle(c, "BRA-7");
    expect(stateOf(c, "BRA-7")).toBe("spare");
    c = cycle(c, "BRA-7");
    expect(stateOf(c, "BRA-7")).toBe("need");
    expect("BRA-7" in c).toBe(false);
  });
  it("does not mutate the input", () => {
    const c: Collection = {};
    cycle(c, "BRA-7");
    expect(c).toEqual({});
  });
});

describe("countHave", () => {
  it("counts have and spare as owned", () => {
    const c: Collection = { "BRA-1": "have", "BRA-2": "spare" };
    expect(countHave(c, ["BRA-1", "BRA-2", "BRA-3"])).toBe(2);
  });
});
