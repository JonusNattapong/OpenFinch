// Fetch docs example — saves page as markdown
// Usage: node index.js https://example.com
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const BASE = process.env.OPENFINCH_API_URL || "http://localhost:8787";
const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const url = process.argv[2] || "https://example.com";
  const format = process.argv[3] || "markdown";

  console.log(`Fetching: ${url} (format: ${format})`);

  const res = await fetch(`${BASE}/v1/fetch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, format }),
  });

  const data = await res.json();

  if (data.error) {
    console.error("Error:", data.error);
    process.exit(1);
  }

  console.log(`Status: ${data.status} | Title: ${data.title || "N/A"} | ${data.tookMs}ms`);

  // Save to file
  const outDir = join(__dirname, "output");
  const urlSlug = new URL(url).hostname.replace(/[^a-z0-9]/g, "-");
  const outFile = join(outDir, `${urlSlug}.${format === "markdown" ? "md" : format}`);
  writeFileSync(outFile, data.content, "utf-8");

  console.log(`\nSaved to: ${outFile}`);
  console.log(`Content length: ${data.metadata.contentLength} bytes`);
}

main().catch(console.error);
