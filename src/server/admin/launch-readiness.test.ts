import { describe, expect, it } from "vitest";
import { findPlaceholders } from "./launch-readiness";

describe("placeholder detection", () => {
  it("finds [placeholders] but ignores Markdown links", () => {
    const text = "Operated by [legal business name], see our [Privacy Policy](/pages/privacy) and [Registered in England, company no. 000]";
    expect(findPlaceholders(text)).toEqual(["[legal business name]", "[Registered in England, company no. 000]"]);
  });
  it("returns nothing for finished text", () => {
    expect(findPlaceholders("Operated by Wild Muse Ltd. Read the [returns policy](/pages/returns).")).toEqual([]);
  });
});
