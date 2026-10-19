import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./static";
import { pool } from "./db";
import PostgresStore from "connect-pg-simple";

const PostgresSessionStore = PostgresStore(session);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("trust proxy", 1);

// Increase request size limit for image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Session configuration (database-backed - essential for Vercel persistence)
const sessionMiddleware = session({
  store: new PostgresSessionStore({
    pool: pool,
    createTableIfMissing: true,
    tableName: 'sessions'
  }),
  secret: process.env.SESSION_SECRET || 'bookshare-secret-key-for-development',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production", // secure in production (HTTPS)
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax' 
  }
});
// Static files and Vite modules do not need a database session lookup.
app.use("/api", sessionMiddleware);
app.set("sessionMiddleware", sessionMiddleware);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Register routes immediately
// We don't await the server object here for exports, 
// but the routes themselves are registered synchronously inside the function calls.
app.get('/marketing', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'marketing-website.html'));
});

app.get(['/downloads.html', '/downloads'], (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.sendFile(path.join(__dirname, '..', 'downloads.html'));
});

// Create a promise for the server that we can use locally
const serverPromise = registerRoutes(app);

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
  serveStatic(app);
} else {
  // In development, handle Vite setup and local port listening
  (async () => {
    try {
      const server = await serverPromise;
      const viteModule = "./vite";
      const { setupVite } = await import(viteModule);
      await setupVite(app, server);
      const port = process.env.PORT ? parseInt(process.env.PORT) : 5001;
      
      server.on('error', (e: any) => {
        if (e.code === 'EADDRINUSE') {
          console.error(`❌ Port ${port} is already in use. Please close any other processes (like old dev servers) and try again.`);
          process.exit(1);
        } else {
          console.error('❌ Server error:', e);
        }
      });

      server.listen(port, "0.0.0.0", () => {
        log(`serving on port ${port} (http://localhost:${port} and http://127.0.0.1:${port})`);
      });

      // Graceful shutdown handler
      const shutdown = async (signal: string) => {
        log(`\n👋 ${signal} received. Shutting down gracefully...`);
        
        // Modern Node.js API to kill all active connections (Vite HMR, keep-alive browser tabs)
        // This is the most effective way to prevent port-locking on Windows.
        if (typeof (server as any).closeAllConnections === 'function') {
          log('🔌 Forcing all connections to close...');
          (server as any).closeAllConnections();
        }

        server.close(async () => {
          log('📡 Server closed');
          try {
            await pool.end();
            log('🗄️ Database pool closed');
            process.exit(0);
          } catch (err) {
            console.error('❌ Error closing database pool:', err);
            process.exit(1);
          }
        });

        // Force close after 5s (more aggressive than before)
        setTimeout(() => {
          console.error('🕒 Forceful shutdown after timeout');
          process.exit(1);
        }, 5000);
      };

      process.on('SIGINT', () => shutdown('SIGINT'));
      process.on('SIGTERM', () => shutdown('SIGTERM'));
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  })();
}

// Global error handlers to prevent silent crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

export default app;
