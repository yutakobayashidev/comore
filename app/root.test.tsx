import { it, expect } from "vitest";

const sampleFunction = (a: number, b: number) => {
  return a + b;
};

it("adds 1 + 2 to equal 3", () => {
  expect(sampleFunction(1, 2)).toBe(3);
});
