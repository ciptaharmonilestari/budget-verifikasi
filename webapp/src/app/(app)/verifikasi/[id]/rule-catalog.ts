/**
 * Gate 3 rule-engine catalog, grouped for the Lembar Verifikasi checklist.
 * Combines the ported GEN_RULES/C4_RULES (flat code/text/severity tuples)
 * with RULE_GROUPS (the 6-section grouping used on screen) from
 * @/lib/reference-data — do not re-derive the rule text/severity here.
 */
import { GEN_RULES, C4_RULES, RULE_GROUPS } from "@/lib/reference-data";

export type RuleSeverity = "B" | "W" | "I";
export type RuleResultValue = "PASS" | "WARN" | "FAIL";

export interface RuleDef {
  code: string;
  text: string;
  severity: RuleSeverity;
}

export interface RuleGroupView {
  id: string;
  label: string;
  rules: RuleDef[];
}

const ALL_RULES = new Map<string, RuleDef>();
for (const [code, text, severity] of [...GEN_RULES, ...C4_RULES]) {
  ALL_RULES.set(code, { code, text, severity });
}

export const VERIFIKASI_RULE_GROUPS: RuleGroupView[] = RULE_GROUPS.map(([id, label, codes]) => ({
  id,
  label,
  rules: codes.map((code) => ALL_RULES.get(code)).filter((r): r is RuleDef => !!r),
}));

export const ALL_RULE_DEFS: RuleDef[] = Array.from(ALL_RULES.values());

export const SEVERITY_LABEL: Record<RuleSeverity, string> = {
  B: "Block",
  W: "Warn",
  I: "Info",
};

/** Tag level used to color the severity badge (not the result badge). */
export const SEVERITY_TAG_LEVEL: Record<RuleSeverity, "FAIL" | "WARN" | "INFO"> = {
  B: "FAIL",
  W: "WARN",
  I: "INFO",
};

export interface RuleResultInput {
  code: string;
  severity: RuleSeverity;
  result: RuleResultValue;
  note?: string;
}

export function defaultRuleResults(): RuleResultInput[] {
  return ALL_RULE_DEFS.map((r) => ({ code: r.code, severity: r.severity, result: "PASS" as RuleResultValue }));
}

/** Verdict the rule engine computes from the current per-rule results.
 * LOCKED = at least one Block-severity (B) rule is marked FAIL — FR-220:
 * recommend/approve options must be disabled, only Kembalikan/Tolak remain. */
export type ComputedVerdict = "CLEAR" | "CLEAR_WITH_NOTES" | "LOCKED";

export function computeVerdict(results: RuleResultInput[]): ComputedVerdict {
  const blockFail = results.some((r) => r.severity === "B" && r.result === "FAIL");
  if (blockFail) return "LOCKED";
  const warnFail = results.some((r) => r.severity === "W" && r.result === "FAIL");
  return warnFail ? "CLEAR_WITH_NOTES" : "CLEAR";
}

export function tallyResults(results: RuleResultInput[]): { pass: number; warn: number; fail: number } {
  let pass = 0, warn = 0, fail = 0;
  for (const r of results) {
    if (r.result === "PASS") pass++;
    else if (r.result === "WARN") warn++;
    else fail++;
  }
  return { pass, warn, fail };
}

/** Best-effort parse of a previously stored GateDecision.ruleResults JSON blob
 * back into typed rule results, falling back to defaults for anything
 * missing or malformed (schema is a free-form Json column, not enforced). */
export function parseStoredRuleResults(raw: unknown): RuleResultInput[] {
  const byCode = new Map<string, RuleResultInput>();
  if (Array.isArray(raw)) {
    for (const entry of raw) {
      if (!entry || typeof entry !== "object") continue;
      const e = entry as Record<string, unknown>;
      const code = typeof e.code === "string" ? e.code : null;
      const severity = e.severity === "B" || e.severity === "W" || e.severity === "I" ? e.severity : null;
      const result = e.result === "PASS" || e.result === "WARN" || e.result === "FAIL" ? e.result : null;
      if (!code || !severity || !result) continue;
      byCode.set(code, { code, severity, result, note: typeof e.note === "string" ? e.note : undefined });
    }
  }
  return ALL_RULE_DEFS.map((r) => byCode.get(r.code) ?? { code: r.code, severity: r.severity, result: "PASS" });
}
