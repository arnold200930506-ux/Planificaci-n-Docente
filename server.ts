import express from 'express';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production' || !process.env.VITE_DEV_SERVER;

async function startServer() {
  if (isProduction && fs.existsSync(path.resolve('dist'))) {
    console.log('[Server] Serving production static files from dist');
    app.use(express.static(path.resolve('dist')));

    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  } else {
    console.log('[Server] Mounting Vite dev middleware');
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
