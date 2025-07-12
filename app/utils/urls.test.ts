import { expect, it, describe } from "vitest";
import { getSearchParams } from "./urls";

describe("utils/urls", () => {
  describe("getSearchParams", () => {
    it("should return empty object for URL without query parameters", () => {
      const result = getSearchParams("http://localhost:3000/checkout");
      expect(result).toEqual({});
    });

    it("should correctly get single query parameter", () => {
      const result = getSearchParams(
        "http://localhost:3000/checkout?param=value",
      );
      expect(result).toEqual({ param: "value" });
    });

    it("should correctly get multiple query parameters", () => {
      const result = getSearchParams(
        "http://localhost:3000/checkout?param1=value1&param2=value2",
      );
      expect(result).toEqual({
        param1: "value1",
        param2: "value2",
      });
    });

    it("should keep the last value when multiple query parameters have the same key", () => {
      const result = getSearchParams(
        "http://localhost:3000/checkout?param=value1&param=value2",
      );
      expect(result).toEqual({ param: "value2" });
    });

    it("should correctly decode encoded query parameters", () => {
      const result = getSearchParams(
        "http://localhost:3000/checkout?param=hello%20world",
      );
      expect(result).toEqual({ param: "hello world" });
    });
  });
});
