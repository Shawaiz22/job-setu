import { describe, it, expect } from "vitest";
import { SEED_OPPORTUNITIES } from "@/modules/seed/eligibility";
import { DEMO_UNPROCESSED_SAMPLES } from "@/modules/seed/demo-samples";
import { extractRequirementsFromText } from "@/modules/ingestion/extract";

describe("MP Notification Corpus & Live Demo Data (M5 T5)", () => {
  it("contains at least 10 real MP notifications in seed corpus with official clause citations", () => {
    expect(SEED_OPPORTUNITIES.length).toBeGreaterThanOrEqual(10);

    for (const opp of SEED_OPPORTUNITIES) {
      expect(opp.title).toBeTruthy();
      expect(opp.department).toBeTruthy();
      expect(opp.state).toBe("Madhya Pradesh");
      expect(opp.requirements.length).toBeGreaterThanOrEqual(2);

      // Verify every requirement carries an official clause citation
      for (const req of opp.requirements) {
        expect(req.source.type).toBe("notification");
        if (req.source.type === "notification") {
          expect(req.source.clause).toBeTruthy();
          expect(req.source.clause.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("holds back exactly 3 unprocessed sample documents for live stage demo", () => {
    expect(DEMO_UNPROCESSED_SAMPLES.length).toBe(3);

    for (const sample of DEMO_UNPROCESSED_SAMPLES) {
      expect(sample.id).toBeTruthy();
      expect(sample.title).toBeTruthy();
      expect(sample.text.length).toBeGreaterThan(100);
    }
  });

  it("successfully extracts clause-cited requirements on-demand from a demo sample", async () => {
    const sample = DEMO_UNPROCESSED_SAMPLES[0]!;
    const extracted = await extractRequirementsFromText({
      text: sample.text,
      sourceType: "notification",
      documentId: sample.id,
      defaultTitle: sample.title,
      defaultDepartment: sample.department,
    });

    expect(extracted.requirements.length).toBeGreaterThanOrEqual(2);
    for (const req of extracted.requirements) {
      expect(req.source.type).toBe("notification");
      if (req.source.type === "notification") {
        expect(req.source.clause).toBeTruthy();
      }
    }
  }, 45000);
});
