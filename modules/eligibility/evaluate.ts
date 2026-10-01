import type { EvaluationInput, EvaluationResult, Requirement } from "./types";
import { computeScore, rankGaps, MetRequirementItem } from "./score";

/**
 * Resolves category-specific overrides for a requirement.
 * If overrides contain a rule matching the profile's category, that value replaces the base value.
 */
export function resolveRequirement(
  req: Requirement,
  category: string,
): Requirement {
  if (!req.overrides || req.overrides.length === 0) {
    return req;
  }

  const normalizedCategory = category.trim().toLowerCase();
  const override = req.overrides.find(
    (o) => o.whenCategory.trim().toLowerCase() === normalizedCategory,
  );

  if (override) {
    return {
      ...req,
      value: override.value,
    };
  }

  return req;
}

/**
 * Formats duration between two dates into human-readable months and years.
 */
function formatDuration(from: Date, to: Date): string {
  let months =
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 +
    (to.getUTCMonth() - from.getUTCMonth());

  if (to.getUTCDate() < from.getUTCDate()) {
    months--;
  }

  months = Math.max(0, months);

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years > 0 && remainingMonths > 0) {
    return `${years} year${years > 1 ? "s" : ""} and ${remainingMonths} month${remainingMonths > 1 ? "s" : ""}`;
  }
  if (years > 0) {
    return `${years} year${years > 1 ? "s" : ""}`;
  }
  return `${remainingMonths} month${remainingMonths !== 1 ? "s" : ""}`;
}

function normalizeDegree(str: string): string {
  return str
    .toLowerCase()
    .replace(/[.\-_/(),]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCompact(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const EQUIVALENCE_GROUPS: string[][] = [
  [
    "btech",
    "be",
    "bacheloroftechnology",
    "bachelorofengineering",
    "bachelorintechnology",
    "bachelorinengineering",
  ],
  ["mtech", "me", "masteroftechnology", "masterofengineering"],
  ["bca", "bachelorofcomputerapplications"],
  ["mca", "masterofcomputerapplications"],
  ["bsc", "bachelorofscience"],
  ["msc", "masterofscience"],
  ["bcom", "bachelorofcommerce"],
  ["mcom", "masterofcommerce"],
  ["ba", "bachelorofarts"],
  ["ma", "masterofarts"],
  ["bba", "bachelorofbusinessadministration"],
  ["mba", "masterofbusinessadministration"],
  [
    "12th",
    "12thpass",
    "intermediate",
    "highersecondary",
    "102",
    "seniorsecondary",
  ],
  ["10th", "10thpass", "matric", "matriculation", "highschool", "secondary"],
  ["diploma", "polytechnic"],
];

function getCanonicalGroup(compactStr: string): number {
  for (let i = 0; i < EQUIVALENCE_GROUPS.length; i++) {
    const group = EQUIVALENCE_GROUPS[i];
    if (!group) continue;
    for (const token of group) {
      if (compactStr.includes(token)) return i;
    }
  }
  return -1;
}

function matchesSingleQualification(
  candidatePart: string,
  requiredPart: string,
): boolean {
  if (!candidatePart || !requiredPart) return false;

  const candNorm = normalizeDegree(candidatePart);
  const reqNorm = normalizeDegree(requiredPart);

  if (candNorm === reqNorm) return true;

  const candCompact = normalizeCompact(candidatePart);
  const reqCompact = normalizeCompact(requiredPart);

  if (!candCompact || !reqCompact) return false;
  if (candCompact === reqCompact) return true;

  // Containment
  if (candCompact.includes(reqCompact) || reqCompact.includes(candCompact)) {
    return true;
  }

  // Word token containment
  const candWords = candNorm.split(" ").filter(Boolean);
  const reqWords = reqNorm.split(" ").filter(Boolean);
  if (reqWords.length > 0 && reqWords.every((rw) => candWords.includes(rw))) {
    return true;
  }

  // Equivalence groups (e.g. btech <-> be, 12th <-> highersecondary)
  const candGroup = getCanonicalGroup(candCompact);
  const reqGroup = getCanonicalGroup(reqCompact);
  if (candGroup !== -1 && candGroup === reqGroup) {
    return true;
  }

  // General degree / graduation
  const isDegreeGeneral = (s: string) =>
    /^(graduate|graduation|bachelor|degree|any graduate|any graduation)$/i.test(
      s,
    ) ||
    /graduate in/i.test(s) ||
    /bachelor degree/i.test(s);

  const isRecognizedDegree = (s: string) =>
    /btech|be|bca|mca|bsc|bcom|ba|bba|degree|graduate|bachelor/.test(s);

  if (isDegreeGeneral(reqNorm) && isRecognizedDegree(candCompact)) {
    return true;
  }

  return false;
}

/**
 * Robust, deterministic degree & branch matching.
 * Handles abbreviations (B.Tech / BTech / B.E.), branch specializations (e.g. "B.Tech - CSE" -> "B.Tech"),
 * delimiter splitting, and standard degree equivalencies.
 */
function matchesQualification(
  candidateQual: string,
  requiredQual: string,
): boolean {
  if (!candidateQual || !requiredQual) return false;

  const reqParts = requiredQual
    .split(/[/|,]|\bor\b/i)
    .map((s) => s.trim())
    .filter(Boolean);
  const candParts = candidateQual
    .split(/[/|,]|\bor\b/i)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const rp of reqParts) {
    if (matchesSingleQualification(candidateQual, rp)) return true;
    for (const cp of candParts) {
      if (matchesSingleQualification(cp, rp)) return true;
    }
  }

  return false;
}

export interface RuleEvaluation {
  met: boolean;
  reason?: string;
  shortfall?: string;
  futureEligibleOn?: string;
  evidenceMultiplier: number;
}

/**
 * Evaluates a single requirement against the profile and skills.
 * Pure function: deterministic, no I/O, no network.
 */
export function evaluateRequirement(
  req: Requirement,
  input: EvaluationInput,
): RuleEvaluation {
  const { profile, skills, evaluatedOn } = input;
  const evalDate = new Date(evaluatedOn);

  switch (req.kind) {
    case "age": {
      const targetAge = Number(req.value);
      const dob = new Date(profile.dateOfBirth);

      if (req.op === "max") {
        // Cutoff: date candidate turns targetAge
        const maxDate = new Date(
          Date.UTC(
            dob.getUTCFullYear() + targetAge,
            dob.getUTCMonth(),
            dob.getUTCDate(),
          ),
        );

        if (evalDate > maxDate) {
          const duration = formatDuration(maxDate, evalDate);
          return {
            met: false,
            reason: `Maximum age allowed is ${targetAge}, but candidate's age exceeds limit (${duration} over)`,
            shortfall: `exceeded by ${duration}`,
            evidenceMultiplier: 0,
          };
        }

        return { met: true, evidenceMultiplier: 1.0 };
      }

      if (req.op === "min") {
        // Cutoff: date candidate turns targetAge
        const minDate = new Date(
          Date.UTC(
            dob.getUTCFullYear() + targetAge,
            dob.getUTCMonth(),
            dob.getUTCDate(),
          ),
        );

        if (evalDate < minDate) {
          const duration = formatDuration(evalDate, minDate);
          const futureDateIso = minDate.toISOString().split("T")[0];
          return {
            met: false,
            reason: `Minimum age required is ${targetAge}; candidate has not reached minimum age`,
            shortfall: `under by ${duration}`,
            futureEligibleOn: futureDateIso,
            evidenceMultiplier: 0,
          };
        }

        return { met: true, evidenceMultiplier: 1.0 };
      }

      return { met: true, evidenceMultiplier: 1.0 };
    }

    case "domicile": {
      const required = String(req.value).trim().toLowerCase();
      const actual = profile.domicileState.trim().toLowerCase();

      if (required !== actual) {
        return {
          met: false,
          reason: `Requires domicile in ${req.value}; profile is ${profile.domicileState}`,
          shortfall: "non-resident",
          evidenceMultiplier: 0,
        };
      }

      return { met: true, evidenceMultiplier: 1.0 };
    }

    case "qualification": {
      const allowedList = Array.isArray(req.value)
        ? req.value.map(String)
        : [String(req.value)];

      const matched = allowedList.some((allowedVal) =>
        matchesQualification(profile.qualification, allowedVal),
      );

      if (!matched) {
        return {
          met: false,
          reason: `Requires ${Array.isArray(req.value) ? `one of [${req.value.join(", ")}]` : req.value}; candidate has ${profile.qualification}`,
          shortfall: "missing required qualification",
          evidenceMultiplier: 0,
        };
      }

      return { met: true, evidenceMultiplier: 1.0 };
    }

    case "category": {
      const candidateCat = profile.category.trim().toLowerCase();

      if (req.op === "one_of" && Array.isArray(req.value)) {
        const allowed = req.value.map((v) => String(v).trim().toLowerCase());
        if (!allowed.includes(candidateCat)) {
          return {
            met: false,
            reason: `Requires category [${req.value.join(", ")}]; candidate belongs to ${profile.category}`,
            shortfall: "ineligible category",
            evidenceMultiplier: 0,
          };
        }
        return { met: true, evidenceMultiplier: 1.0 };
      }

      const requiredCat = String(req.value).trim().toLowerCase();
      if (candidateCat !== requiredCat) {
        return {
          met: false,
          reason: `Requires category ${req.value}; candidate belongs to ${profile.category}`,
          shortfall: "ineligible category",
          evidenceMultiplier: 0,
        };
      }

      return { met: true, evidenceMultiplier: 1.0 };
    }

    case "skill": {
      const targetSkillName = String(req.value).trim().toLowerCase();
      const matchedSkill = skills.find(
        (s) => s.name.trim().toLowerCase() === targetSkillName,
      );

      if (!matchedSkill) {
        return {
          met: false,
          reason: `Requires skill: ${req.label || req.value}`,
          shortfall: "missing skill",
          evidenceMultiplier: 0,
        };
      }

      const multiplier =
        matchedSkill.evidence === "verified"
          ? 1.0
          : matchedSkill.evidence === "project"
            ? 0.8
            : 0.5;

      return {
        met: true,
        evidenceMultiplier: multiplier,
      };
    }

    default: {
      // Non-skill / custom generic requirement default
      return { met: true, evidenceMultiplier: 1.0 };
    }
  }
}

/**
 * Main eligibility evaluation engine per SPEC.md section 6.
 *
 * Guaranteed Pure Function:
 * - Zero DB calls
 * - Zero network / fetch
 * - Zero environment variables
 * - Zero Date.now() / system clock access
 */
export function evaluateEligibility(input: EvaluationInput): EvaluationResult {
  const resolvedRequirements = input.requirements.map((req) =>
    resolveRequirement(req, input.profile.category),
  );

  const failures: {
    requirement: Requirement;
    reason: string;
    shortfall?: string;
  }[] = [];

  let candidateFutureEligibleOn: string | undefined;
  let canQualifyInFuture = true;

  const metNonBlockingItems: MetRequirementItem[] = [];
  const unmetNonBlocking: Requirement[] = [];
  const metNonBlockingReqs: Requirement[] = [];
  const allNonBlocking: Requirement[] = [];

  for (const req of resolvedRequirements) {
    const evalResult = evaluateRequirement(req, input);

    if (req.blocking) {
      if (!evalResult.met) {
        failures.push({
          requirement: req,
          reason: evalResult.reason || req.label,
          shortfall: evalResult.shortfall,
        });

        if (evalResult.futureEligibleOn) {
          candidateFutureEligibleOn = evalResult.futureEligibleOn;
        } else {
          // If a blocking failure is permanent (e.g. age cap exceeded, non-resident), future eligibility is impossible
          canQualifyInFuture = false;
        }
      }
    } else {
      allNonBlocking.push(req);
      if (evalResult.met) {
        metNonBlockingItems.push({
          requirement: req,
          evidenceMultiplier: evalResult.evidenceMultiplier,
        });
        metNonBlockingReqs.push(req);
      } else {
        unmetNonBlocking.push(req);
      }
    }
  }

  // If any blocking requirement failed: status is blocked
  if (failures.length > 0) {
    const gaps = rankGaps(unmetNonBlocking);
    const futureEligibleOn = canQualifyInFuture
      ? candidateFutureEligibleOn
      : undefined;

    return {
      status: "blocked",
      failures,
      gaps,
      futureEligibleOn,
    };
  }

  // Otherwise: eligible with weighted score
  const score = computeScore(metNonBlockingItems, allNonBlocking);
  const gaps = rankGaps(unmetNonBlocking);

  return {
    status: "eligible",
    score,
    met: metNonBlockingReqs,
    gaps,
  };
}
