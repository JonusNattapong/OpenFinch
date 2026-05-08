// Lightweight robots.txt checker
// Checks RESPECT_ROBOTS_TXT env var and caches parsed rules per domain.

const rulesCache = new Map<string, { disallow: string[]; allow: string[] }>();

async function fetchRobotsTxt(domain: string): Promise<{ disallow: string[]; allow: string[] } | null> {
  try {
    const url = `https://${domain}/robots.txt`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "OpenFinch/0.1.0" },
    });
    if (!res.ok) return null;

    const text = await res.text();
    const disallow: string[] = [];
    const allow: string[] = [];

    let inRelevantAgent = true;
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("User-agent:")) {
        const agent = trimmed.slice(11).trim().toLowerCase();
        inRelevantAgent = agent === "*" || agent === "openfinch" || agent === "robert";
      }
      if (!inRelevantAgent) continue;
      if (trimmed.startsWith("Disallow:")) {
        const path = trimmed.slice(9).trim();
        if (path) disallow.push(path);
      }
      if (trimmed.startsWith("Allow:")) {
        const path = trimmed.slice(6).trim();
        if (path) allow.push(path);
      }
    }

    return { disallow, allow };
  } catch {
    return null;
  }
}

export async function isUrlAllowed(url: string): Promise<boolean> {
  const respect = process.env.RESPECT_ROBOTS_TXT !== "false";
  if (!respect) return true;

  try {
    const parsed = new URL(url);
    const domain = parsed.hostname;
    const path = parsed.pathname + parsed.search;

    if (!rulesCache.has(domain)) {
      const rules = await fetchRobotsTxt(domain);
      rulesCache.set(domain, rules ?? { disallow: [], allow: [] });
    }

    const rules = rulesCache.get(domain)!;

    // Check allow rules first (more specific)
    for (const allowPath of rules.allow) {
      if (path.startsWith(allowPath)) return true;
    }

    // Check disallow rules
    for (const disallowPath of rules.disallow) {
      if (path.startsWith(disallowPath)) return false;
    }

    return true;
  } catch {
    return true; // Allow on error
  }
}
