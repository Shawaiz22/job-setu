import { describe, it, expect } from "vitest";
import { extractTextFromPDF } from "@/modules/ingestion/pdf";

function generateTestPDF(message: string): Buffer {
  const content = `BT /F1 12 Tf 100 700 Td (${message}) Tj ET`;
  const streamLength = Buffer.byteLength(content, "utf-8");

  const header = "%PDF-1.4\n";
  const obj1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  const obj2 = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
  const obj3 =
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n";
  const obj4 = `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${content}\nendstream\nendobj\n`;
  const obj5 =
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";

  let offset = header.length;
  const o1 = offset;
  offset += obj1.length;
  const o2 = offset;
  offset += obj2.length;
  const o3 = offset;
  offset += obj3.length;
  const o4 = offset;
  offset += obj4.length;
  const o5 = offset;
  offset += obj5.length;

  const xrefOffset = offset;
  const pad = (n: number) => n.toString().padStart(10, "0");
  const xref = `xref\n0 6\n0000000000 65535 f \n${pad(o1)} 00000 n \n${pad(o2)} 00000 n \n${pad(o3)} 00000 n \n${pad(o4)} 00000 n \n${pad(o5)} 00000 n \n`;
  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  const pdfStr = header + obj1 + obj2 + obj3 + obj4 + obj5 + xref + trailer;
  return Buffer.from(pdfStr, "utf-8");
}

describe("PDF Text Extraction with unpdf (M5 T1)", () => {
  it("extracts text and page count from a PDF buffer", async () => {
    const pdfBuffer = generateTestPDF(
      "Madhya Pradesh Recruitment Notification 2026",
    );
    const result = await extractTextFromPDF(pdfBuffer);

    expect(result.totalPages).toBe(1);
    expect(result.text).toContain(
      "Madhya Pradesh Recruitment Notification 2026",
    );
  });
});
