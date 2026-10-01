import { extractText } from "unpdf";

export interface PDFExtractionResult {
  text: string;
  totalPages: number;
}

/**
 * Extracts plain text from a PDF Buffer, ArrayBuffer, or Uint8Array using unpdf.
 * Guarantees compatibility with PDF.js by converting Node Buffers to pure Uint8Array.
 */
export async function extractTextFromPDF(
  buffer: ArrayBuffer | Uint8Array | Buffer,
): Promise<PDFExtractionResult> {
  let uint8: Uint8Array;

  if (typeof Buffer !== "undefined" && Buffer.isBuffer(buffer)) {
    uint8 = new Uint8Array(
      buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      ),
    );
  } else if (buffer instanceof Uint8Array) {
    uint8 = new Uint8Array(
      buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      ),
    );
  } else {
    uint8 = new Uint8Array(buffer);
  }

  const result = await extractText(uint8);
  const text = Array.isArray(result.text)
    ? result.text.join("\n\n")
    : result.text || "";

  return {
    text: text.trim(),
    totalPages: result.totalPages || 1,
  };
}
