import { describe, expect, it } from "vitest";
import { handmadePages } from "@/content/handmade";
import { contentPages } from "@/content/pages";
import { blocksToText, textToBlocks } from "./markdown";

describe("content text format", () => {
  it("round-trips every seeded page without losing content", () => {
    for (const page of [...contentPages, ...handmadePages]) {
      expect(textToBlocks(blocksToText(page.blocks)), page.slug).toEqual(page.blocks);
    }
  });

  it("parses headings, lists, callouts, tables and special blocks", () => {
    const blocks = textToBlocks(
      [
        "## Title",
        "Some **bold** text",
        "continues here.",
        "",
        "- one",
        "- two",
        "",
        "1. first",
        "2. second",
        "",
        "> [!warning] Careful",
        "",
        "Table: Prices",
        "| A | B |",
        "|---|---|",
        "| 1 | 2 |",
        "",
        "[[form:contact]]",
      ].join("\n"),
    );
    expect(blocks).toEqual([
      { type: "h2", text: "Title" },
      { type: "p", text: "Some **bold** text continues here." },
      { type: "list", items: ["one", "two"] },
      { type: "list", items: ["first", "second"], ordered: true },
      { type: "callout", tone: "warning", text: "Careful" },
      { type: "table", caption: "Prices", head: ["A", "B"], rows: [["1", "2"]] },
      { type: "form", form: "contact" },
    ]);
  });
});
