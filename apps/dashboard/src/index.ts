import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();
const API_URL = process.env.API_URL ?? "http://localhost:8787";
const port = parseInt(process.env.DASHBOARD_PORT ?? "3000", 10);

// Proxy API calls from dashboard
app.all("/api/*", async (c) => {
  const path = c.req.path.replace("/api", "");
  const url = `${API_URL}${path}`;
  const method = c.req.method;
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  let body: string | undefined;
  if (method === "POST" || method === "PUT") {
    body = await c.req.text();
  }

  try {
    const res = await fetch(url, { method, headers, body, signal: AbortSignal.timeout(30000) });
    const data = await res.text();
    return c.body(data, res.status as any, { "Content-Type": "application/json" });
  } catch {
    return c.json({ error: "API unreachable" }, 502 as any);
  }
});

app.get("/", (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OpenFinch Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = { theme: { extend: { colors: { finch: { 50: '#f0f9f4', 500: '#22c55e', 600: '#16a34a', 700: '#15803d' } } } } }
  </script>
</head>
<body class="bg-gray-50 text-gray-900">
  <nav class="bg-white border-b shadow-sm">
    <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
      <h1 class="text-xl font-bold text-finch-600">OpenFinch</h1>
      <span class="text-sm text-gray-500">Self-hosted AI web agent</span>
    </div>
  </nav>

  <div class="max-w-7xl mx-auto px-4 py-6">
    <!-- Status Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8" id="status-cards">
      <div class="bg-white rounded-lg shadow p-4"><div class="animate-pulse h-16 bg-gray-100 rounded"></div></div>
      <div class="bg-white rounded-lg shadow p-4"><div class="animate-pulse h-16 bg-gray-100 rounded"></div></div>
      <div class="bg-white rounded-lg shadow p-4"><div class="animate-pulse h-16 bg-gray-100 rounded"></div></div>
      <div class="bg-white rounded-lg shadow p-4"><div class="animate-pulse h-16 bg-gray-100 rounded"></div></div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 mb-6 border-b pb-2 overflow-x-auto">
      <button class="tab-btn px-4 py-2 rounded-t font-medium text-sm" data-tab="overview" onclick="switchTab('overview')">Overview</button>
      <button class="tab-btn px-4 py-2 rounded-t font-medium text-sm" data-tab="search" onclick="switchTab('search')">Search</button>
      <button class="tab-btn px-4 py-2 rounded-t font-medium text-sm" data-tab="fetch" onclick="switchTab('fetch')">Fetch</button>
      <button class="tab-btn px-4 py-2 rounded-t font-medium text-sm" data-tab="extract" onclick="switchTab('extract')">Extract</button>
      <button class="tab-btn px-4 py-2 rounded-t font-medium text-sm" data-tab="browser" onclick="switchTab('browser')">Browser</button>
      <button class="tab-btn px-4 py-2 rounded-t font-medium text-sm" data-tab="agent" onclick="switchTab('agent')">Agent</button>
      <button class="tab-btn px-4 py-2 rounded-t font-medium text-sm" data-tab="providers" onclick="switchTab('providers')">Providers</button>
    </div>

    <div id="tab-content"></div>
  </div>

  <script>
    const API = '/api';
    let state = { health: null, runs: [], sessions: [] };

    // Tab routing
    const tabs = ['overview', 'search', 'fetch', 'extract', 'browser', 'agent', 'providers'];
    let currentTab = 'overview';

    function switchTab(name) {
      currentTab = name;
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.toggle('bg-finch-500', b.dataset.tab === name);
        b.classList.toggle('text-white', b.dataset.tab === name);
        b.classList.toggle('text-gray-600', b.dataset.tab !== name);
      });
      renderTab(name);
    }

    async function fetchHealth() {
      try {
        const res = await fetch(API + '/health');
        state.health = await res.json();
      } catch { state.health = null; }
    }

    async function fetchRuns() {
      try {
        // Agent runs aren't listable via API yet, show placeholder
      } catch {}
    }

    async function init() {
      await fetchHealth();
      switchTab('overview');
      setInterval(fetchHealth, 10000);
    }

    function renderStatusCards() {
      const h = state.health;
      document.getElementById('status-cards').innerHTML = h ? \`
        <div class="bg-white rounded-lg shadow p-4">
          <div class="text-sm text-gray-500">Status</div>
          <div class="text-2xl font-bold text-finch-600">\${h.status}</div>
          <div class="text-xs text-gray-400">v\${h.version}</div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="text-sm text-gray-500">Uptime</div>
          <div class="text-2xl font-bold">\${Math.floor(h.uptime / 60)}m</div>
          <div class="text-xs text-gray-400">\${Math.floor(h.uptime)}s total</div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="text-sm text-gray-500">Services</div>
          <div class="flex gap-2 mt-1">
            \${Object.entries(h.services || {}).map(([k, v]) =>
              '<span class="px-2 py-0.5 rounded text-xs ' + (v ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700') + '">' + k + '</span>'
            ).join('')}
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="text-sm text-gray-500">API</div>
          <div class="text-lg font-mono text-sm mt-1">http://localhost:8787</div>
          <div class="text-xs text-gray-400">OpenAPI docs at /openapi</div>
        </div>
      \` : \`
        <div class="bg-white rounded-lg shadow p-4 col-span-full">
          <div class="text-red-500 font-medium">API Unreachable</div>
          <div class="text-sm text-gray-500">Make sure the API server is running on port 8787</div>
        </div>
      \`;
    }

    function renderTab(name) {
      const el = document.getElementById('tab-content');
      if (name === 'overview') renderOverview(el);
      else if (name === 'search') renderSearchPlayground(el);
      else if (name === 'fetch') renderFetchPlayground(el);
      else if (name === 'extract') renderExtractPlayground(el);
      else if (name === 'browser') renderBrowserPanel(el);
      else if (name === 'agent') renderAgentPanel(el);
      else if (name === 'providers') renderProvidersPanel(el);
    }

    function renderOverview(el) {
      renderStatusCards();
      el.innerHTML = document.getElementById('status-cards').outerHTML + \`
        <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-white rounded-lg shadow p-4">
            <h3 class="font-medium mb-2">Quick Links</h3>
            <ul class="space-y-2 text-sm">
              <li><a href="#" onclick="switchTab('search');return false" class="text-blue-600 hover:underline">Search API</a> — Search the web</li>
              <li><a href="#" onclick="switchTab('fetch');return false" class="text-blue-600 hover:underline">Fetch API</a> — Get page content</li>
              <li><a href="#" onclick="switchTab('extract');return false" class="text-blue-600 hover:underline">Extract API</a> — Structured data extraction</li>
              <li><a href="#" onclick="switchTab('browser');return false" class="text-blue-600 hover:underline">Browser API</a> — Browser sessions</li>
              <li><a href="#" onclick="switchTab('agent');return false" class="text-blue-600 hover:underline">Agent API</a> — AI web agents</li>
              <li><a href="#" onclick="switchTab('providers');return false" class="text-blue-600 hover:underline">Providers</a> — LLM provider config</li>
            </ul>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <h3 class="font-medium mb-2">MCP Configuration</h3>
            <pre class="text-xs bg-gray-50 p-3 rounded overflow-x-auto"><code>{
  "mcpServers": {
    "openfinch": {
      "command": "npx",
      "args": ["-y", "openfinch-mcp"],
      "env": {
        "OPENFINCH_API_URL": "http://localhost:8787"
      }
    }
  }
}</code></pre>
          </div>
        </div>
      \`;
    }

    function renderSearchPlayground(el) {
      el.innerHTML = \`
        <div class="bg-white rounded-lg shadow p-4">
          <h3 class="font-medium mb-4">Search Playground</h3>
          <div class="flex gap-2 mb-3">
            <input id="search-query" type="text" placeholder="Search query..." class="flex-1 border rounded px-3 py-2 text-sm">
            <input id="search-limit" type="number" value="5" min="1" max="50" class="w-20 border rounded px-3 py-2 text-sm">
            <button onclick="doSearch()" class="bg-finch-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-finch-600">Search</button>
          </div>
          <div id="search-results" class="text-sm text-gray-500">Enter a query and click Search</div>
        </div>
      \`;
    }

    function renderFetchPlayground(el) {
      el.innerHTML = \`
        <div class="bg-white rounded-lg shadow p-4">
          <h3 class="font-medium mb-4">Fetch Playground</h3>
          <div class="flex gap-2 mb-3">
            <input id="fetch-url" type="text" placeholder="https://example.com" class="flex-1 border rounded px-3 py-2 text-sm">
            <select id="fetch-format" class="border rounded px-3 py-2 text-sm">
              <option value="markdown">markdown</option><option value="text">text</option>
              <option value="html">html</option><option value="json">json</option>
            </select>
            <button onclick="doFetch()" class="bg-finch-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-finch-600">Fetch</button>
          </div>
          <div id="fetch-result" class="text-sm text-gray-500">Enter a URL and click Fetch</div>
        </div>
      \`;
    }

    function renderExtractPlayground(el) {
      el.innerHTML = \`
        <div class="bg-white rounded-lg shadow p-4">
          <h3 class="font-medium mb-4">Extract Playground</h3>
          <div class="space-y-2 mb-3">
            <input id="extract-url" type="text" placeholder="https://example.com/page" class="w-full border rounded px-3 py-2 text-sm">
            <textarea id="extract-prompt" placeholder="What to extract (e.g., Extract all product names and prices)" class="w-full border rounded px-3 py-2 text-sm" rows="2"></textarea>
            <button onclick="doExtract()" class="bg-finch-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-finch-600">Extract</button>
          </div>
          <div id="extract-result" class="text-sm text-gray-500">Enter a URL and prompt, then click Extract</div>
        </div>
      \`;
    }

    function renderBrowserPanel(el) {
      el.innerHTML = \`
        <div class="bg-white rounded-lg shadow p-4">
          <h3 class="font-medium mb-4">Browser Sessions</h3>
          <button onclick="createSession()" class="bg-finch-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-finch-600 mb-4">Create Session</button>
          <div id="session-result" class="text-sm text-gray-500">No active sessions</div>
        </div>
      \`;
    }

    function renderAgentPanel(el) {
      el.innerHTML = \`
        <div class="bg-white rounded-lg shadow p-4">
          <h3 class="font-medium mb-4">Agent Run</h3>
          <div class="space-y-2 mb-3">
            <input id="agent-url" type="text" placeholder="Starting URL (optional)" class="w-full border rounded px-3 py-2 text-sm">
            <textarea id="agent-goal" placeholder="What should the agent do?" class="w-full border rounded px-3 py-2 text-sm" rows="2"></textarea>
            <button onclick="runAgent()" class="bg-finch-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-finch-600">Run Agent</button>
          </div>
          <div id="agent-result" class="text-sm text-gray-500">Enter a goal and click Run Agent</div>
        </div>
      \`;
    }

    function renderProvidersPanel(el) {
      el.innerHTML = \`
        <div class="bg-white rounded-lg shadow p-4">
          <h3 class="font-medium mb-4">LLM Providers</h3>
          <div id="providers-list" class="text-sm text-gray-500">Loading...</div>
        </div>
      \`;
      checkProviders();
    }

    async function checkProviders() {
      try {
        const res = await fetch(API + '/v1/agent/providers');
        const data = await res.json();
        document.getElementById('providers-list').innerHTML = \`
          <div class="grid gap-2">
            \${(data.providers || []).map(p => '<div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-green-500"></span>' + p + '</div>').join('')}
            \${(!data.providers || data.providers.length === 0) ? '<div class="text-yellow-600">No providers configured. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, etc. in .env</div>' : ''}
          </div>
          <div class="mt-4 text-xs text-gray-400">
            Configure providers by setting environment variables in your .env file.
            Supported: openai, anthropic, gemini, openrouter, ollama
          </div>
        \`;
      } catch {
        document.getElementById('providers-list').innerHTML = '<div class="text-red-500">Could not reach API</div>';
      }
    }

    async function doSearch() {
      const q = document.getElementById('search-query').value;
      const l = parseInt(document.getElementById('search-limit').value) || 5;
      if (!q) return;
      const el = document.getElementById('search-results');
      el.textContent = 'Searching...';
      try {
        const res = await fetch(API + '/v1/search', {
          method: 'POST', headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ query: q, limit: l })
        });
        const data = await res.json();
        if (data.error) { el.innerHTML = '<span class="text-red-500">' + data.error + '</span>'; return; }
        el.innerHTML = '<div class="text-xs text-gray-400 mb-2">Found ' + data.results.length + ' results in ' + data.tookMs + 'ms' + (data.cached ? ' (cached)' : '') + '</div>' +
          data.results.map(r => '<div class="mb-2 p-2 bg-gray-50 rounded"><a href="' + r.url + '" class="text-blue-600 text-sm font-medium" target="_blank">' + r.title + '</a><div class="text-xs text-gray-500">' + r.url + '</div><div class="text-sm mt-1">' + r.snippet + '</div></div>').join('');
      } catch(e) { el.innerHTML = '<span class="text-red-500">Error: ' + e.message + '</span>'; }
    }

    async function doFetch() {
      const url = document.getElementById('fetch-url').value;
      const format = document.getElementById('fetch-format').value;
      if (!url) return;
      const el = document.getElementById('fetch-result');
      el.textContent = 'Fetching...';
      try {
        const res = await fetch(API + '/v1/fetch', {
          method: 'POST', headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ url, format })
        });
        const data = await res.json();
        if (data.error) { el.innerHTML = '<span class="text-red-500">' + data.error + '</span>'; return; }
        el.innerHTML = '<div class="text-xs text-gray-400 mb-2">Status: ' + data.status + ' | ' + data.tookMs + 'ms' + (data.cached ? ' (cached)' : '') + ' | Title: ' + (data.title || 'N/A') + '</div>' +
          '<pre class="text-xs bg-gray-50 p-3 rounded max-h-96 overflow-y-auto"><code>' + escapeHtml(data.content.slice(0, 2000)) + '</code></pre>';
      } catch(e) { el.innerHTML = '<span class="text-red-500">Error: ' + e.message + '</span>'; }
    }

    async function doExtract() {
      const url = document.getElementById('extract-url').value;
      const prompt = document.getElementById('extract-prompt').value;
      if (!url) return;
      const el = document.getElementById('extract-result');
      el.textContent = 'Extracting...';
      try {
        const res = await fetch(API + '/v1/extract', {
          method: 'POST', headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ url, prompt })
        });
        const data = await res.json();
        if (data.error) { el.innerHTML = '<span class="text-red-500">' + data.error + '</span>'; return; }
        el.innerHTML = '<div class="text-xs text-gray-400 mb-2">Provider: ' + data.provider + ' | Model: ' + (data.model || 'N/A') + ' | ' + data.tookMs + 'ms</div>' +
          '<pre class="text-xs bg-gray-50 p-3 rounded max-h-96 overflow-y-auto"><code>' + escapeHtml(JSON.stringify(data.data, null, 2)) + '</code></pre>';
      } catch(e) { el.innerHTML = '<span class="text-red-500">Error: ' + e.message + '</span>'; }
    }

    async function createSession() {
      const el = document.getElementById('session-result');
      try {
        const res = await fetch(API + '/v1/browser/session', {
          method: 'POST', headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({})
        });
        const data = await res.json();
        el.innerHTML = '<pre class="text-xs bg-gray-50 p-3 rounded"><code>' + escapeHtml(JSON.stringify(data, null, 2)) + '</code></pre>';
      } catch(e) { el.innerHTML = '<span class="text-red-500">Error: ' + e.message + '</span>'; }
    }

    async function runAgent() {
      const url = document.getElementById('agent-url').value;
      const goal = document.getElementById('agent-goal').value;
      if (!goal) return;
      const el = document.getElementById('agent-result');
      el.textContent = 'Starting agent...';
      try {
        const res = await fetch(API + '/v1/agent/run', {
          method: 'POST', headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ url: url || undefined, goal })
        });
        const data = await res.json();
        el.innerHTML = '<pre class="text-xs bg-gray-50 p-3 rounded"><code>' + escapeHtml(JSON.stringify(data, null, 2)) + '</code></pre>';
      } catch(e) { el.innerHTML = '<span class="text-red-500">Error: ' + e.message + '</span>'; }
    }

    function escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    init();
  </script>
</body>
</html>`);
});

serve({ fetch: app.fetch, port });
console.log(`[openfinch-dashboard] Running on http://localhost:${port}`);
