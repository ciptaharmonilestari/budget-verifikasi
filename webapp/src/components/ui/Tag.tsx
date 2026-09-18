export type TagLevel = "PASS" | "WARN" | "FAIL" | "INFO" | "NA";

export function Tag({ level, children }: { level: TagLevel; children: React.ReactNode }) {
  return <span className={`tag tag-${level}`}>{children}</span>;
}
