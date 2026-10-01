import { describe, it, expect } from "vitest";
import { stripPII, restorePII } from "@/modules/privacy/redact";

describe("PII Redaction Layer (modules/privacy/redact.ts)", () => {
  it("handles empty or falsy strings gracefully", () => {
    const res = stripPII("");
    expect(res.redacted).toBe("");
    expect(res.map.size).toBe(0);
    expect(restorePII("", res.map)).toBe("");
  });

  it("redacts email addresses and restores accurately", () => {
    const input = "Contact candidate at test.user_1@domain.co.in for updates.";
    const { redacted, map } = stripPII(input);

    expect(redacted).not.toContain("test.user_1@domain.co.in");
    expect(redacted).toContain("[EMAIL_1]");
    expect(restorePII(redacted, map)).toBe(input);
  });

  it("redacts Indian phone numbers across standard formats", () => {
    const input =
      "Phones: +91 98765 43210, +91-9123456789, 87654-32109 and 7890123456.";
    const { redacted, map } = stripPII(input);

    expect(redacted).not.toContain("98765 43210");
    expect(redacted).not.toContain("9123456789");
    expect(restorePII(redacted, map)).toBe(input);
  });

  it("redacts identity numbers (Aadhaar and PAN cards)", () => {
    const input =
      "Aadhaar is 2345 6789 0123 and PAN card number is ABCDE1234F.";
    const { redacted, map } = stripPII(input);

    expect(redacted).not.toContain("2345 6789 0123");
    expect(redacted).not.toContain("ABCDE1234F");
    expect(redacted).toContain("[AADHAAR_");
    expect(redacted).toContain("[PAN_");
    expect(restorePII(redacted, map)).toBe(input);
  });

  it("redacts dates of birth in DD/MM/YYYY and YYYY-MM-DD formats", () => {
    const input = "Born on 15/08/1998 and registered on 2001-04-23.";
    const { redacted, map } = stripPII(input);

    expect(redacted).not.toContain("15/08/1998");
    expect(redacted).not.toContain("2001-04-23");
    expect(restorePII(redacted, map)).toBe(input);
  });

  it("redacts 6-digit Indian PIN codes", () => {
    const input = "Current address: Bhopal, MP - 462001.";
    const { redacted, map } = stripPII(input);

    expect(redacted).not.toContain("462001");
    expect(redacted).toContain("[PINCODE_");
    expect(restorePII(redacted, map)).toBe(input);
  });

  it("redacts candidate name when provided in options", () => {
    const input =
      "Ramesh Sharma submitted an application. Ramesh worked as a Junior Developer.";
    const { redacted, map } = stripPII(input, {
      knownNames: ["Ramesh Sharma", "Ramesh"],
    });

    expect(redacted).not.toContain("Ramesh Sharma");
    expect(redacted).not.toContain("Ramesh");
    expect(restorePII(redacted, map)).toBe(input);
  });

  it("proves complete bidirectional redaction and restoration on a real resume line", () => {
    const resumeLine =
      "Ramesh Sharma (DOB: 15/08/1998) | Bhopal MP 462001 | +91 98765 43210 | ramesh@example.com | PAN: ABCDE1234F | Aadhaar: 3456 7890 1234";

    const { redacted, map, redactedText, tokenMap } = stripPII(resumeLine, {
      knownNames: "Ramesh Sharma",
    });

    // Verify aliases
    expect(redactedText).toBe(redacted);
    expect(tokenMap).toBe(map);

    // Verify all sensitive tokens exist
    expect(redacted).toContain("[NAME_1]");
    expect(redacted).toContain("[DOB_");
    expect(redacted).toContain("[PINCODE_");
    expect(redacted).toContain("[PHONE_");
    expect(redacted).toContain("[EMAIL_");
    expect(redacted).toContain("[PAN_");
    expect(redacted).toContain("[AADHAAR_");

    // Zero sensitive data leaks
    expect(redacted).not.toContain("Ramesh");
    expect(redacted).not.toContain("15/08/1998");
    expect(redacted).not.toContain("462001");
    expect(redacted).not.toContain("98765 43210");
    expect(redacted).not.toContain("ramesh@example.com");
    expect(redacted).not.toContain("ABCDE1234F");
    expect(redacted).not.toContain("3456 7890 1234");

    // Exact restoration
    expect(restorePII(redacted, map)).toBe(resumeLine);
  });
});
