import { describe, expect, it } from "vitest";
import { csvCell, escapeLike, initials, isUuid, whatsappNumber } from "./format";

describe("csvCell", () => {
  it("quotes values containing commas, quotes or newlines", () => {
    expect(csvCell("Banjul, The Gambia")).toBe('"Banjul, The Gambia"');
    expect(csvCell('Say "hi"')).toBe('"Say ""hi"""');
    expect(csvCell("a\nb")).toBe('"a\nb"');
  });

  it("neutralises spreadsheet formulas", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell("+2203000001")).toBe("'+2203000001");
    expect(csvCell("@SUM")).toBe("'@SUM");
  });

  it("renders empty values as empty cells", () => {
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
    expect(csvCell(2015)).toBe("2015");
  });
});

describe("helpers", () => {
  it("escapeLike makes wildcards literal", () => {
    expect(escapeLike("50%_off\\")).toBe("50\\%\\_off\\\\");
  });

  it("initials uses first and last name", () => {
    expect(initials("Aisha Bojang")).toBe("AB");
    expect(initials("Pa Modou Jobe")).toBe("PJ");
    expect(initials("Liberty")).toBe("L");
  });

  it("isUuid rejects non-uuid route params", () => {
    expect(isUuid("19b7d5c3-4b74-448f-9f0b-5a3b3bdee6af")).toBe(true);
    expect(isUuid("aisha-b")).toBe(false);
    expect(isUuid("1; drop table users")).toBe(false);
  });

  it("whatsappNumber strips everything but digits", () => {
    expect(whatsappNumber("+220 300 0001")).toBe("2203000001");
  });
});
