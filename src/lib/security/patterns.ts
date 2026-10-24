// Heuristic detection of injection payloads in free-text inputs (SILS phase 2).
// Inputs are always parameterised/escaped anyway: this is for detection and alerting, not protection.

const PATTERNS: { name: string; re: RegExp }[] = [
  { name: "sql_injection", re: /(\bunion\b\s+(all\s+)?select\b|\bor\b\s+1\s*=\s*1\b|;\s*drop\s+table\b|'\s*or\s*'1'\s*=\s*'1|\bsleep\s*\(\s*\d+\s*\)|\bpg_sleep\b|information_schema)/i },
  { name: "xss", re: /(<\s*script\b|javascript\s*:|\bon(error|load|click|mouseover)\s*=|<\s*iframe\b|<\s*svg[^>]*\bon\w+\s*=)/i },
  { name: "path_traversal", re: /(\.\.\/|\.\.\\|%2e%2e%2f|\/etc\/passwd|c:\\windows\\)/i },
  { name: "template_injection", re: /(\{\{\s*[\w.]+\s*\}\}|\$\{\s*jndi:|<%[=@]?)/i },
];

export function detectSuspiciousPayload(values: unknown[]): string[] {
  const found = new Set<string>();
  for (const v of values) {
    if (typeof v !== "string" || v.length === 0) continue;
    for (const p of PATTERNS) if (p.re.test(v)) found.add(p.name);
  }
  return [...found];
}
