import { defineConfig } from "vitepress";

export default defineConfig({
  title: "OpenFinch",
  description: "Self-hosted AI web agent infrastructure. Search, fetch, extract, browse, and run AI web agents from your own machine.",
  srcDir: ".",
  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
    ["meta", { name: "theme-color", content: "#14b8a6" }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:site_name", content: "OpenFinch" }],
  ],
  themeConfig: {
    logo: "/logo.svg",
    siteTitle: "OpenFinch",

    nav: [
      { text: "Guide", link: "/guide/getting-started", activeMatch: "/guide/" },
      { text: "API", link: "/api/overview", activeMatch: "/api/" },
      { text: "Concepts", link: "/concepts/architecture", activeMatch: "/concepts/" },
      { text: "Reference", link: "/reference/troubleshooting", activeMatch: "/reference/" },
      {
        text: "v0.1.0",
        items: [
          { text: "Changelog", link: "https://github.com/JonusNattapong/OpenFinch/blob/main/docs/release-notes/v0.1.0.md" },
          { text: "GitHub", link: "https://github.com/JonusNattapong/OpenFinch" },
        ],
      },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Getting Started",
          items: [
            { text: "Introduction", link: "/guide/getting-started" },
            { text: "Installation", link: "/guide/installation" },
            { text: "Deployment", link: "/guide/deployment" },
            { text: "Quick Start", link: "/guide/quick-start" },
          ],
        },
        {
          text: "Tools",
          items: [
            { text: "CLI", link: "/guide/cli" },
            { text: "MCP Server", link: "/guide/mcp" },
            { text: "SDK", link: "/guide/sdk" },
          ],
        },
      ],
      "/api/": [
        {
          text: "API Reference",
          items: [
            { text: "Overview", link: "/api/overview" },
            { text: "Search", link: "/api/search" },
            { text: "Fetch", link: "/api/fetch" },
            { text: "Extract", link: "/api/extract" },
            { text: "Browser", link: "/api/browser" },
            { text: "Agent", link: "/api/agent" },
          ],
        },
      ],
      "/concepts/": [
        {
          text: "Concepts",
          items: [
            { text: "Architecture", link: "/concepts/architecture" },
            { text: "LLM Providers", link: "/concepts/providers" },
            { text: "Safety", link: "/concepts/safety" },
            { text: "Comparison", link: "/concepts/comparison" },
          ],
        },
      ],
      "/reference/": [
        {
          text: "Reference",
          items: [
            { text: "Troubleshooting", link: "/reference/troubleshooting" },
            { text: "Benchmarks", link: "/reference/benchmarks" },
            { text: "Smoke Tests", link: "/reference/smoke-tests" },
            { text: "Docker Guide", link: "/reference/docker" },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/JonusNattapong/OpenFinch" },
      { icon: "twitter", link: "https://x.com/openfinch" },
    ],

    search: {
      provider: "local",
      options: {
        detailedView: true,
      },
    },

    footer: {
      message: "MIT License",
      copyright: "Copyright © 2024-present OpenFinch",
    },

    editLink: {
      pattern: "https://github.com/JonusNattapong/OpenFinch/edit/main/site/:path",
      text: "Edit this page on GitHub",
    },
  },

  markdown: {
    theme: {
      light: "github-light",
      dark: "github-dark",
    },
  },

  ignoreDeadLinks: true,

  vite: {
    ssr: {
      noExternal: ["vitepress"],
    },
  },
});
