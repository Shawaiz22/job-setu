export interface StripPIIOptions {
  knownNames?: string[] | string;
}

export interface StripPIIResult {
  redacted: string;
  map: Map<string, string>;
  // Aliases for compatibility
  redactedText: string;
  tokenMap: Map<string, string>;
}

// Regex patterns for sensitive identifiers
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const PHONE_REGEX = /(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b/g;
const AADHAAR_REGEX = /\b[2-9]\d{3}[\s-]\d{4}[\s-]\d{4}\b/g;
const PAN_REGEX = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g;
const DOB_REGEX =
  /\b(?:(?:0[1-9]|[12]\d|3[01])[-/.](?:0[1-9]|1[0-2])[-/.](?:19|20)\d{2}|(?:19|20)\d{2}[-/.](?:0[1-9]|1[0-2])[-/.](?:0[1-9]|[12]\d|3[01]))\b/g;
const PINCODE_REGEX = /\b[1-9][0-9]{2}\s?[0-9]{3}\b/g;

/**
 * Strips PII (Personally Identifiable Information) from input text.
 * Pure function: deterministic, no I/O, no network.
 */
export function stripPII(
  text: string,
  options?: StripPIIOptions | string,
): StripPIIResult {
  if (!text) {
    const emptyMap = new Map<string, string>();
    return {
      redacted: text,
      map: emptyMap,
      redactedText: text,
      tokenMap: emptyMap,
    };
  }

  const map = new Map<string, string>();
  let currentText = text;
  let counter = 1;

  const replaceWithToken = (
    regex: RegExp,
    tokenPrefix: string,
    target: string,
  ): string => {
    return target.replace(regex, (match) => {
      const token = `[${tokenPrefix}_${counter++}]`;
      map.set(token, match);
      return token;
    });
  };

  // 1. Redact known names if provided
  if (options) {
    const names =
      typeof options === "string"
        ? [options]
        : Array.isArray(options.knownNames)
          ? options.knownNames
          : options.knownNames
            ? [options.knownNames]
            : [];

    for (const name of names) {
      if (name && name.trim().length > 1) {
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const nameRegex = new RegExp(`\\b${escaped}\\b`, "gi");
        currentText = replaceWithToken(nameRegex, "NAME", currentText);
      }
    }
  }

  // 2. Redact Emails
  currentText = replaceWithToken(EMAIL_REGEX, "EMAIL", currentText);

  // 3. Redact Identity IDs (Aadhaar, PAN)
  currentText = replaceWithToken(AADHAAR_REGEX, "AADHAAR", currentText);
  currentText = replaceWithToken(PAN_REGEX, "PAN", currentText);

  // 4. Redact Phone Numbers
  currentText = replaceWithToken(PHONE_REGEX, "PHONE", currentText);

  // 5. Redact Dates of Birth
  currentText = replaceWithToken(DOB_REGEX, "DOB", currentText);

  // 6. Redact Postal PIN codes
  currentText = replaceWithToken(PINCODE_REGEX, "PINCODE", currentText);

  return {
    redacted: currentText,
    map,
    redactedText: currentText,
    tokenMap: map,
  };
}

/**
 * Restores original PII into previously redacted text using the token map.
 * Pure function: deterministic, no I/O, no network.
 */
export function restorePII(
  redactedText: string,
  tokenMap: Map<string, string>,
): string {
  if (!redactedText || !tokenMap || tokenMap.size === 0) {
    return redactedText;
  }

  let restored = redactedText;
  for (const [token, original] of tokenMap.entries()) {
    restored = restored.replaceAll(token, original);
  }

  return restored;
}
