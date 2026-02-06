import { mkdirSync } from "fs";
import multer from "multer";
import { join } from "path";
import { getSlugifiedFilenameWithExtension } from "../helpers/slug.helper";
import { NextFunction, Request, Response } from "express";

import { ErrorTypes } from "../helpers/error-handler.helper";
import { ArrayFields, ObjectAuthorizedMimeTypes } from "../@types/multer";
import { logger } from "./logger";

const authorizedMimeTypes: ObjectAuthorizedMimeTypes = {
  image: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/svg+xml",
    "image/webp",
    "image/bmp",
  ],
  document: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  video: [
    "video/mp4",
    "video/avi",
    "video/mov",
    "video/wmv",
    "video/flv",
    "video/webm",
    "video/mkv",
  ],
};

const fields: ArrayFields = [
  { name: "image", maxCount: 6 },
  { name: "document", maxCount: 3 },
  { name: "video", maxCount: 2 },
];

const getMulterUpload = () => {
  return multer({
    storage: multer.diskStorage({
      filename: (_req, file, cb) => {
        try {
          const filename = `${Date.now()}_${getSlugifiedFilenameWithExtension(
            file.originalname
          )}`;
          cb(null, filename);
        } catch (error) {
          cb(error as Error, "");
        }
      },
      destination: (_req, file, cb) => {
        try {
          const pathToFolder = join(process.cwd(), `upload/${file.fieldname}`);
          mkdirSync(pathToFolder, { recursive: true });
          cb(null, pathToFolder);
        } catch (error) {
          cb(error as Error, "");
        }
      },
    }),
    limits: {
      fileSize: 67108864, // 64MB
      files: 10, // Maximum 10 fichiers au total
    },
    fileFilter: (_req, file, cb) => {
      const fieldAuthorizedTypes =
        authorizedMimeTypes[file.fieldname as keyof ObjectAuthorizedMimeTypes];

      if (
        !fieldAuthorizedTypes ||
        !fieldAuthorizedTypes.includes(file.mimetype)
      ) {
        return cb(
          new Error(`TYPE_NOT_ALLOWED:${file.fieldname}:${file.mimetype}`)
        );
      }

      cb(null, true);
    },
  });
};

export const fileUploadMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const upload = getMulterUpload();

  upload.fields(fields)(req, res, (err: any) => {
    if (err) {
      logger.warn({ err, code: err.code, event: "upload_error" }, "Multer upload error");

      if (err.message.startsWith("TYPE_NOT_ALLOWED")) {
        const [, fieldname, mimetype] = err.message.split(":");
        res.status(400).json({
          message: `Type de fichier non autorisé pour le champ "${fieldname}". Type reçu: ${mimetype}`,
          error: "INVALID_FILE_TYPE",
        });
        return;
      }

      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({
          message: "Le fichier est trop volumineux (maximum 64MB).",
          error: "FILE_TOO_LARGE",
        });
        return;
      }

      if (err.code === "LIMIT_FILE_COUNT") {
        res.status(400).json({
          message: "Trop de fichiers uploadés.",
          error: "TOO_MANY_FILES",
        });
        return;
      }
      const message =
        ErrorTypes?.[err.code as keyof typeof ErrorTypes]?.message ||
        "Une erreur est survenue lors du traitement des fichiers";

      res.status(400).json({
        message,
        error: err.code || "UPLOAD_ERROR",
      });
      return;
    }

    next();
  });
};
