import { loadSafetyRules } from './config-loader';

interface SafetyResult {
  isSafe: boolean;
  severity: number;
  matchedPatterns: MatchedPattern[];
}

interface MatchedPattern {
  category: string;
  reason: string;
  severity: number;
}

/**
 * Analyzes a given text for safety concerns based on the loaded safety rules.
 *
 * @param text - The input text to analyze.
 * @returns A SafetyResult object detailing any concerns.
 */
export function analyzeTextSafety(text: string): SafetyResult {
  const safetyConfig = loadSafetyRules();

  const result: SafetyResult = {
    isSafe: true,
    severity: 0,
    matchedPatterns: [],
  };

  const allPatterns = [
    ...safetyConfig.criticalPatterns.patterns,
    ...safetyConfig.highConcernPatterns.patterns,
    ...safetyConfig.emotionalSupportPatterns.patterns,
    ...safetyConfig.contextualGuidancePatterns.patterns,
  ];

  for (const pattern of allPatterns) {
    const regex = new RegExp(pattern.regex, pattern.flags || 'i');
    if (regex.test(text)) {
      let severity = 1; // Default severity

      // Determine severity based on which pattern set this belongs to
      if (safetyConfig.criticalPatterns.patterns.includes(pattern)) {
        severity = 3;
      } else if (safetyConfig.highConcernPatterns.patterns.includes(pattern)) {
        severity = 2.5;
      } else if (
        safetyConfig.emotionalSupportPatterns.patterns.includes(pattern)
      ) {
        severity = 1;
      } else if (
        safetyConfig.contextualGuidancePatterns.patterns.includes(pattern)
      ) {
        severity = 1.5;
      }

      result.isSafe = severity < 2; // Only mark as unsafe for higher severity
      result.severity = Math.max(result.severity, severity);
      result.matchedPatterns.push({
        category: pattern.category,
        reason: pattern.reason,
        severity: severity,
      });
    }
  }

  return result;
}
