import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { authRouter } from './server/routes/authRoutes.js';
import { schoolRouter } from './server/routes/schoolRoutes.js';
import { planRouter } from './server/routes/planRoutes.js';
import { activityRouter } from './server/routes/activityRoutes.js';
import { followUpRouter } from './server/routes/followUpRoutes.js';
import { userRouter } from './server/routes/userRoutes.js';
import { statsRouter } from './server/routes/statsRoutes.js';
import { regulationRouter } from './server/routes/regulationRoutes.js';
import { auditRouter } from './server/routes/auditRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// Middlewares
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/schools', schoolRouter);
app.use('/api/plans', planRouter);
app.use('/api/activities', activityRouter);
app.use('/api/follow-ups', followUpRouter);
app.use('/api/users', userRouter);
app.use('/api/stats', statsRouter);
app.use('/api/regulations', regulationRouter);
app.use('/api/audit-logs', auditRouter);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    system: 'SIPENGAWAS SMP GARUT',
    timestamp: new Date().toISOString(),
  });
});

// Jalankan server lokal HANYA jika tidak berjalan di Vercel
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    import('vite').then(({ createServer: createViteServer }) => {
      createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      }).then((vite) => {
        app.use(vite.middlewares);
        app.listen(PORT, () => {
          console.log(`[SIPENGAWAS SMP GARUT] Server berjalan di port ${PORT} (Development)`);
        });
      });
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    app.listen(PORT, () => {
      console.log(`[SIPENGAWAS SMP GARUT] Server berjalan di port ${PORT} (Production)`);
    });
  }
}

export default app;
