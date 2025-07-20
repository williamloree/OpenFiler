import express from "express";
import cors from "cors";
import path from "path";
import { mkdirSync } from "fs";
import * as dotenv from "dotenv";

import { router } from "./routes";
import { simpleAuth } from "./middleware/auth.middleware";

dotenv.config();

const app = express();

app.use(cors({ 
  origin: process.env.APP_ALLOWED_ORIGIN || "*",
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '70mb' }));
app.use(express.urlencoded({ extended: true, limit: '70mb' }));

const createUploadDirectories = () => {
  try {
    const uploadDir = path.join(process.cwd(), 'upload');
    mkdirSync(uploadDir, { recursive: true });
    mkdirSync(path.join(uploadDir, 'image'), { recursive: true });
    mkdirSync(path.join(uploadDir, 'document'), { recursive: true });
    console.log('📁 Dossiers d\'upload créés avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la création des dossiers d\'upload:', error);
  }
};

createUploadDirectories();

if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

app.get("/", simpleAuth, (_req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "filer-service-form.html"));
});

app.use("/api", router);

// Si on veut forcer le telechargement.
// app.use("/preview", express.static(path.join(process.cwd(), "upload"), {
//   maxAge: '1d', // Cache pour 1 jour
//   etag: true,
//   setHeaders: (res, filePath) => {
//     if (filePath.includes('/image/')) {
//       res.setHeader('Content-Type', 'image/*');
//     } else if (filePath.includes('/document/')) {
//       res.setHeader('Content-Type', 'application/octet-stream');
//       res.setHeader('Content-Disposition', 'attachment');
//     }
//   }
// }));

app.use("/preview", express.static("upload"));

app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erreur globale:', err);

  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({
    message: 'Une erreur interne est survenue',
    error: process.env.NODE_ENV === 'development' ? err.message : 'INTERNAL_ERROR'
  });
});

app.use('*', (_req, res) => {
  res.status(404).json({
    message: 'Route non trouvée',
    error: 'NOT_FOUND'
  });
});

const PORT = process.env.APP_PORT || 3200;
const HOST = process.env.APP_HOST || '0.0.0.0';

app.listen(Number(PORT), HOST, () => {
  console.log(`🚀 Server ready at: http://${HOST}:${PORT}`);
  console.log(`🔐 Interface protégée: http://${HOST}:${PORT}/ (token requis)`);
  console.log(`📋 API Health Check: http://${HOST}:${PORT}/api/health`);
  console.log(`📤 Upload endpoint: http://${HOST}:${PORT}/api/upload`);
  console.log(`🖼️  Preview files: http://${HOST}:${PORT}/preview/`);
  console.log(`🔑 Token d'accès: admin123`);
});