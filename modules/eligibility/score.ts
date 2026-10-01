import type { Gap, Requirement } from "./types";

export interface MetRequirementItem {
  requirement: Requirement;
  evidenceMultiplier: number;
}

/**
 * Computes deterministic weighted score (0 - 100) per SPEC.md 6.2:
 *
 * evidenceMultiplier:
 *   verified  -> 1.0
 *   project   -> 0.8
 *   declared  -> 0.5
 *   non-skill -> 1.0
 *
 * score = round(
 *   100 × Σ(weight × evidenceMultiplier) over met non-blocking requirements
 *       ÷ Σ(weight) over all non-blocking requirements
 * )
 *
 * If there are no non-blocking requirements, score is 100.
 */
export function computeScore(
  metItems: MetRequirementItem[],
  allNonBlocking: Requirement[],
): number {
  if (allNonBlocking.length === 0) {
    return 100;
  }

  const totalPossibleWeight = allNonBlocking.reduce(
    (sum, req) => sum + req.weight,
    0,
  );

  if (totalPossibleWeight === 0) {
    return 100;
  }

  const earnedWeight = metItems.reduce((sum, item) => {
    return sum + item.requirement.weight * item.evidenceMultiplier;
  }, 0);

  return Math.round((100 * earnedWeight) / totalPossibleWeight);
}

/**
 * Computes priority for unmet requirements (gaps) and ranks them descending:
 *
 * demandSignal = source.type === "interview_evidence"
 *   ? matchCount / sampleSize
 *   : 1.0
 *
 * priority = weight × demandSignal
 */
export function rankGaps(unmetRequirements: Requirement[]): Gap[] {
  const gaps: Gap[] = unmetRequirements.map((req) => {
    let demandSignal = 1.0;

    if (req.source.type === "interview_evidence") {
      demandSignal =
        req.source.sampleSize > 0
          ? req.source.matchCount / req.source.sampleSize
          : 1.0;
    }

    const priority = Number((req.weight * demandSignal).toFixed(4));

    let suggestedAction: { label: string; deadline?: string } | undefined;
    if (req.kind === "skill") {
      suggestedAction = {
        label: `Build verified proof or project for ${req.label}`,
      };
    } else if (req.kind === "certification") {
      suggestedAction = { label: `Prepare and appear for ${req.label}` };
    }

    return {
      requirement: req,
      priority,
      suggestedAction,
    };
  });

  return gaps.sort((a, b) => b.priority - a.priority);
}
