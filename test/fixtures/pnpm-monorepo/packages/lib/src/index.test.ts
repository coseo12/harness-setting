import { describe, it, expect } from "vitest";
import { sum } from "./index.js";

describe("@fixture/lib — sum", () => {
  it("sum(1, 2) === 3", () => {
    expect(sum(1, 2)).toBe(3);
  });
});
