import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import multer from "multer";
import { createServer } from "http";
import { Server } from "socket.io";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import config from "../config";

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.MAX_FILE_SIZE,
  },
});

app.use((req, res, next) => {
  next();
});

(async () => {
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // PostgreSQL session store with error handling
  const PgStore = connectPgSimple(session);
  const sessionStore = new PgStore({
    conString: config.DATABASE_URL,
    createTableIfMissing: true,
    tableName: 'sessions',
    errorLog: (error) => {
      console.error('Session store error:', error.message);
    }
  });

  // Handle session store connection errors
  sessionStore.on('error', (error) => {
    console.error('Session store connection error:', error.message);
  });

  app.use(
    session({
      name: 'session_cookie_name',
      secret: config.SESSION_SECRET,
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      },
    }),
  );

  // Store io instance globally for use in routes
  (global as any).io = io;

  io.on('connection', (socket) => {
    socket.on('disconnect', () => {});
  });

  await registerRoutes(app, upload);

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    // Не логируем ошибки десериализации пользователя как критические
    if (err.message && err.message.includes('Failed to deserialize user out of session')) {
      // Просто продолжаем без логирования
      return next();
    }
    
    console.error('Error handler:', err);
    
    // Проверяем, были ли уже отправлены заголовки
    if (res.headersSent) {
      return next(err);
    }
    
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, httpServer);
  } else {
    serveStatic(app);
  }

  // Use port 5000 for Replit, otherwise use config
  const port = process.env.REPL_ID ? 5000 : config.PORT;
  
  // Global error handlers
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Don't exit the process, just log the error
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit the process, just log the error
  });

  httpServer.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    console.log(`🚀 Server running on port ${port}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    httpServer.close(() => {
      console.log('Process terminated');
    });
  });
})().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});