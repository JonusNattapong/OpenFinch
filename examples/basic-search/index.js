// Basic search example
// Usage: node index.js "your search query"
const BASE = process.env.OPENFINCH_API_URL || "http://localhost:8787";

async function main() {
  const query = process.argv[2] || "OpenFinch AI web agent";
  const limit = parseInt(process.argv[3] || "5", 10);

  console.log(`Searching for: "${query}" (limit: ${limit})`);

  const res = await fetch(`${BASE}/v1/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, limit }),
  });

  const data = await res.json();

  if (data.error) {
    console.error("Error:", data.error);
    process.exit(1);
  }

  console.log(`\nFound ${data.results.length} results in ${data.tookMs}ms${data.cached ? " (cached)" : ""}:\n`);

  for (const result of data.results) {
    console.log(`[${result.rank}] ${result.title}`);
    console.log(`    ${result.url}`);
    console.log(`    ${result.snippet.slice(0, 200)}`);
    console.log();
  }
}

main().catch(console.error);
