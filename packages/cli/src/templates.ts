import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export interface Template {
  name: string;
  description: string;
  files: Record<string, string>;
}

export const TEMPLATES: Record<string, Template> = {
  "basic-research": {
    name: "basic-research",
    description: "Simple web research script using search and fetch",
    files: {
      "package.json": JSON.stringify({
        name: "openfinch-research",
        version: "1.0.0",
        type: "module",
        scripts: { start: "node research.js" },
        dependencies: { openfinch: "latest" },
      }, null, 2),
      "research.js": [
        "import { OpenFinch } from \"openfinch\";",
        "",
        "const client = new OpenFinch();",
        "",
        "async function main() {",
        "  const query = process.argv[2] ?? \"AI news\";",
        "  const limit = parseInt(process.argv[3] ?? \"5\", 10);",
        "",
        "  // 1. Search",
        "  const results = await client.search({ query, limit });",
        "  console.log(\"Search results:\", results);",
        "",
        "  // 2. Fetch top result",
        "  if (results.results?.length > 0) {",
        "    const page = await client.fetch({ url: results.results[0].url });",
        "    console.log(\"Content (500 chars):\", page.content?.slice(0, 500));",
        "  }",
        "}",
        "",
        "main().catch(console.error);",
        "",
      ].join("\n"),
      ".env.example": [
        "OPENFINCH_API_URL=http://localhost:8787",
        "# ANTHROPIC_API_KEY=sk-...",
      ].join("\n"),
      "README.md": [
        "# OpenFinch Basic Research",
        "",
        "```bash",
        "npm install",
        'cp .env.example .env',
        'npm start "your query" [limit]',
        "```",
        "",
        "Docs: https://github.com/JonusNattapong/OpenFinch",
      ].join("\n"),
    },
  },
  "product-scraper": {
    name: "product-scraper",
    description: "Extract product data from e-commerce pages",
    files: {
      "package.json": JSON.stringify({
        name: "openfinch-scraper",
        version: "1.0.0",
        type: "module",
        scripts: { start: "node scrape.js" },
        dependencies: { openfinch: "latest" },
      }, null, 2),
      "scrape.js": [
        'import { OpenFinch } from "openfinch";',
        "",
        "const client = new OpenFinch();",
        "",
        "const PRODUCT_SCHEMA = JSON.stringify({",
        '  productName: "string",',
        '  price: "string",',
        '  currency: "string",',
        '  inStock: "boolean",',
        '  rating: "number (0-5)",',
        '  reviews: "number",',
        "}, null, 2);",
        "",
        "async function main() {",
        '  const url = process.argv[2];',
        "  if (!url) {",
        '    console.error("Usage: npm start <product-url>");',
        "    process.exit(1);",
        "  }",
        "",
        "  const data = await client.extract({",
        "    url,",
        "    prompt: \\`Extract product: \\${PRODUCT_SCHEMA}\\`,",
        "  });",
        "",
        '  console.log("Extracted:", data);',
        "}",
        "",
        "main().catch(console.error);",
      ].join("\n"),
      ".env.example": [
        "OPENFINCH_API_URL=http://localhost:8787",
        "OPENAI_API_KEY=sk-...",
      ].join("\n"),
      "README.md": [
        "# Product Scraper",
        "",
        "```bash",
        "npm install",
        'cp .env.example .env',
        "npm start https://example.com/product/123",
        "```",
        "",
        "Docs: https://github.com/JonusNattapong/OpenFinch",
      ].join("\n"),
    },
  },
  "agent-workflow": {
    name: "agent-workflow",
    description: "Multi-step autonomous agent workflow",
    files: {
      "package.json": JSON.stringify({
        name: "openfinch-agent",
        version: "1.0.0",
        type: "module",
        scripts: { start: "node agent.js" },
        dependencies: { openfinch: "latest" },
      }, null, 2),
      "agent.js": [
        'import { OpenFinch } from "openfinch";',
        "",
        "const client = new OpenFinch();",
        "",
        "async function main() {",
        "  const goal = process.argv.slice(2).join(\" \") || \"Go to example.com and extract the main heading\";",
        '  const startUrl = process.argv[3] || "https://example.com";',
        "",
        '  console.log("Goal:", goal);',
        '  console.log("URL:", startUrl);',
        "",
        "  const run = await client.agent.run({ goal, startUrl, maxSteps: 10 });",
        '  console.log("Run ID:", run.runId);',
        "",
        "  // Poll for completion",
        "  while (true) {",
        "    const result = await client.agent.result(run.runId);",
        '    console.log("Status:", result.status);',
        '    if (result.status === "completed" || result.status === "failed") break;',
        "    await new Promise(r => setTimeout(r, 2000));",
        "  }",
        "",
        '  console.log("\\nResult:", result.result);',
        "}",
        "",
        "main().catch(console.error);",
      ].join("\n"),
      ".env.example": [
        "OPENFINCH_API_URL=http://localhost:8787",
        "OPENAI_API_KEY=sk-...",
      ].join("\n"),
      "README.md": [
        "# Agent Workflow",
        "",
        "```bash",
        "npm install",
        'cp .env.example .env',
        'npm start "your goal" "https://start-url.com"',
        "```",
        "",
        "Docs: https://github.com/JonusNattapong/OpenFinch",
      ].join("\n"),
    },
  },
};

export function listTemplates(): void {
  console.log("Available templates:");
  for (const [name, tmpl] of Object.entries(TEMPLATES)) {
    console.log(`  ${name.padEnd(20)} ${tmpl.description}`);
  }
}

export function scaffoldTemplate(name: string, targetDir: string): void {
  const tmpl = TEMPLATES[name];
  if (!tmpl) {
    console.error(`Unknown template: ${name}`);
    console.error(`Available: ${Object.keys(TEMPLATES).join(", ")}`);
    process.exit(1);
  }

  if (existsSync(targetDir)) {
    console.error(`Directory already exists: ${targetDir}`);
    process.exit(1);
  }

  mkdirSync(targetDir, { recursive: true });
  for (const [filePath, content] of Object.entries(tmpl.files)) {
    const fullPath = join(targetDir, filePath);
    mkdirSync(join(targetDir, filePath.replace(/[/\\][^/\\]+$/, "")), { recursive: true });
    writeFileSync(fullPath, content);
  }

  console.log(`Scaffolded ${name} in ${targetDir}/`);
  console.log("  Files:", Object.keys(tmpl.files).join(", "));
}
