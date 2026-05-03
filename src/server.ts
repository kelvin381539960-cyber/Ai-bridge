import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { assertConfig, config } from './config.js';
import { requireApiKey } from './middleware/auth.js';
import { filesRouter } from './routes/files.js';
import { contentRouter } from './routes/content.js';
import { editRouter } from './routes/edit.js';

assertConfig();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(rateLimit({ windowMs: 60_000, limit: 120 }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'ai-bridge', version: '0.1.0' });
});

app.use('/api', requireApiKey);
app.use('/api', filesRouter);
app.use('/api/content', contentRouter);
app.use('/api/edit', editRouter);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const err = error as Error & { statusCode?: number; issues?: unknown };
  const statusCode = err.statusCode || (err.name === 'ZodError' ? 400 : 500);
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    issues: err.issues,
  });
});

app.listen(config.port, () => {
  console.log(`AI Bridge listening on port ${config.port}`);
});
