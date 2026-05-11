import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "public");
const PORT = parseInt(process.env.DEMO_SITE_PORT || "4173", 10);

const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const ROUTES = {
  "/": "index.html",
  "/products": "products.html",
  "/product/laptop": "product-laptop.html",
  "/product/tablet": "product-tablet.html",
  "/product/headphones": "product-headphones.html",
  "/docs": "docs.html",
  "/form": "form.html",
  "/js-rendered": "js-rendered.html",
  "/health": null, // handled inline
  "/api/products": null, // handled inline
};

const PRODUCTS = [
  { id: 1, name: "QuantumBook Pro", price: 1299, category: "laptops", rating: 4.7, inStock: true },
  { id: 2, name: "NovaTab S9", price: 799, category: "tablets", rating: 4.5, inStock: true },
  { id: 3, name: "AuraBuds X2", price: 249, category: "headphones", rating: 4.3, inStock: true },
  { id: 4, name: "CyberDesk 27", price: 599, category: "monitors", rating: 4.6, inStock: false },
  { id: 5, name: "EcoMouse Air", price: 89, category: "accessories", rating: 4.1, inStock: true },
  { id: 6, name: "CodeBoard MK3", price: 179, category: "accessories", rating: 4.8, inStock: true },
];

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // CORS headers for OpenFinch fetch
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // API: health
  if (pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "openfinch-demo-site", version: "0.1.0" }));
    return;
  }

  // API: products
  if (pathname === "/api/products") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ products: PRODUCTS }));
    return;
  }

  // Static files
  const routePath = ROUTES[pathname];
  if (routePath !== undefined) {
    if (routePath === null) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
      return;
    }
    const filePath = path.join(PUBLIC, routePath);
    serveFile(res, filePath);
    return;
  }

  // 404
  res.writeHead(404, { "Content-Type": "text/html" });
  res.end("<h1>404 - Page Not Found</h1><p>The page you're looking for doesn't exist.</p>");
});

function serveFile(res, filePath) {
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/html" });
      res.end("<h1>500 - Internal Server Error</h1>");
      return;
    }
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
}

server.listen(PORT, () => {
  console.log(`[demo-site] OpenFinch Demo Site running at http://localhost:${PORT}`);
  console.log(`[demo-site] Pages: /, /products, /products/{id}, /docs, /form, /js-rendered`);
  console.log(`[demo-site] APIs: /health, /api/products`);
});
