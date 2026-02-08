import express from "express";
import cors from "cors";
import path from "path";
import { mkdirSync } from "fs";
import * as dotenv from "dotenv";

import { router } from "./routes";
import { simpleAuth, extractToken, isValidToken } from "./middleware/auth.middleware";
import { requestLogger } from "./middleware/request-logger.middleware";
import { logger } from "./config/logger";
import { getFilePrivacy } from "./services/metadata.service";
import { access as fsAccess } from "fs/promises";

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.APP_ALLOWED_ORIGIN || "*",
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '70mb' }));
app.use(express.urlencoded({ extended: true, limit: '70mb' }));

app.use(requestLogger);

const createUploadDirectories = () => {
  try {
    const uploadDir = path.join(process.cwd(), 'upload');
    mkdirSync(uploadDir, { recursive: true });
    mkdirSync(path.join(uploadDir, 'image'), { recursive: true });
    mkdirSync(path.join(uploadDir, 'document'), { recursive: true });
    mkdirSync(path.join(uploadDir, 'video'), { recursive: true });
    logger.info("Upload directories created successfully");
  } catch (error) {
    logger.error({ err: error }, "Failed to create upload directories");
  }
};

createUploadDirectories();

app.get("/favicon.ico", (_req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "favicon.ico"));
});

app.get("/", simpleAuth, (_req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "browser.html"));
});

app.use("/api", router);

app.get("/preview/:folder/:filename", async (req, res) => {
  const { folder, filename } = req.params;

  const allowedFolders = ["image", "document", "video"];
  if (!allowedFolders.includes(folder)) {
    return res.status(400).json({ message: "Dossier non valide.", error: "INVALID_FOLDER" });
  }

  if (filename.includes("..") || filename.includes("/") || filename.includes("\\") || filename.startsWith(".")) {
    return res.status(400).json({ message: "Nom de fichier non valide.", error: "INVALID_FILENAME" });
  }

  const filePath = path.join(process.cwd(), "upload", folder, filename);

  try {
    await fsAccess(filePath);
  } catch {
    return res.status(404).json({ message: "Fichier non trouvé.", error: "FILE_NOT_FOUND" });
  }

  const isPrivate = await getFilePrivacy(folder, filename);

  if (isPrivate) {
    const token = extractToken(req);
    if (!isValidToken(token)) {
      return res.status(401).json({
        message: "Ce fichier est privé. Un token valide est requis.",
        error: "UNAUTHORIZED",
      });
    }
  }

  return res.sendFile(filePath);
});

app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ err, stack: err.stack }, "Unhandled error");

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
  logger.info({ host: HOST, port: PORT }, "Server started");
  logger.info({ url: `http://${HOST}:${PORT}/` }, "File browser");
  logger.info({ url: `http://${HOST}:${PORT}/api/health` }, "Health check");
  logger.info({ url: `http://${HOST}:${PORT}/api/upload` }, "Upload endpoint");
  logger.info({ url: `http://${HOST}:${PORT}/preview/` }, "Preview files");
});
