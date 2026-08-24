import "dotenv/config";
import express from "express";
// Vite middleware for development (removed static import)
import path from "path";
import fs from "fs";
import { apiRouter } from "./src/server/api";
import { admRouter } from "./src/server/adm";

async function startServer() {
  const app = express();
  app.set("trust proxy", 1);
    const PORT = Number(process.env.PORT || 3000);

  app.use(express.json({ limit: "5mb" }));

  // Mount API paths
  app.use("/api/adm", admRouter);
  app.use("/api", apiRouter);

  // Vite middleware for development
  const isProd = process.env.NODE_ENV === "production" || fs.existsSync(path.join(process.cwd(), 'server.cjs')) || !fs.existsSync(path.join(process.cwd(), 'vite.config.ts'));

  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    let distPath = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(path.join(distPath, 'index.html'))) {
      distPath = process.cwd();
    }
    app.use(express.static(distPath, { index: false }));
    app.get('*', async (req, res) => {
      try {
        let html = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');
        const [pixelsRows]: any = await (await import('./src/server/db')).pool.query('SELECT codigo FROM config_pixel WHERE ativo = 1');
        let injectedPixels = '';
        if (pixelsRows && pixelsRows.length > 0) {
          injectedPixels = pixelsRows.map((row: any) => {
            const code = row.codigo || '';
            return code.replace(/\\n/g, '\n');
          }).join('\n');
        }
        if (injectedPixels) {
          html = html.replace('</head>', `\n${injectedPixels}\n</head>`);
        }
        res.send(html);
      } catch (err) {
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
