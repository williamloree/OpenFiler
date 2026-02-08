import { Request, Response } from "express";
import { fileUploadMiddleware } from "../config/multerConfig";
import { IReqFile, IFile } from "../@types/file";
import { unlink, access } from "fs";
import { join } from "path";
import { promisify } from "util";
import { logger } from "../config/logger";
import { getAllPrivateFiles, setFilePrivacy, removeFileMetadata, getFilePrivacy } from "../services/metadata.service";
import { extractToken, isValidToken } from "../middleware/auth.middleware";

const unlinkAsync = promisify(unlink);
const accessAsync = promisify(access);

export const fileCreate = [
  fileUploadMiddleware,
  async (req: Request, res: Response) => {
    try {
      const files: IFile[] = [];

      if (!req.files || Object.keys(req.files).length === 0) {
        logger.warn({ requestId: req.requestId }, "Upload attempted with no files");
        return res.status(400).json({
          message: "Aucun fichier n'a été uploadé.",
          error: 'NO_FILES'
        });
      }

      for (const fieldname in req.files) {
        const fieldFiles = req.files[fieldname] as IReqFile[];

        fieldFiles.forEach((file: IReqFile) => {
          files.push({
            name: file.filename,
            defaultName: file.originalname,
            type: file.mimetype,
            size: file.size,
            path: `/${file.fieldname}`,
            fieldname: file.fieldname,
            url: `/preview/${file.fieldname}/${file.filename}`
          });
        });
      }

      logger.info({
        requestId: req.requestId,
        count: files.length,
        files: files.map(f => ({ name: f.name, type: f.type, size: f.size })),
        event: "files_uploaded",
      }, `${files.length} file(s) uploaded`);

      return res.status(201).json({
        message: `${files.length} fichier(s) uploadé(s) avec succès.`,
        files,
        count: files.length
      });

    } catch (error) {
      logger.error({ requestId: req.requestId, err: error }, "File upload failed");
      return res.status(500).json({
        message: "Erreur lors de l'enregistrement des fichiers.",
        error: 'INTERNAL_ERROR'
      });
    }
  },
];

export const deleteFile = async (req: Request, res: Response) => {
  try {
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        message: "Nom du fichier et type requis.",
        error: 'MISSING_PARAMETERS'
      });
    }

    const folder = type.startsWith('image/') ? 'image' :
                   type.startsWith('application/') ? 'document' :
                   type.startsWith('video/') ? 'video' : null;

    if (!folder) {
      return res.status(400).json({
        message: "Type de fichier non reconnu.",
        error: 'INVALID_FILE_TYPE'
      });
    }

    const filePath = join(process.cwd(), 'upload', folder, name);

    try {
      await accessAsync(filePath);
    } catch {
      logger.warn({ requestId: req.requestId, filename: name, folder }, "Delete attempted on non-existent file");
      return res.status(404).json({
        message: "Fichier non trouvé.",
        error: 'FILE_NOT_FOUND'
      });
    }

    await unlinkAsync(filePath);
    await removeFileMetadata(folder, name);

    logger.info({ requestId: req.requestId, filename: name, folder, event: "file_deleted" }, "File deleted");

    return res.json({
      message: "Fichier supprimé avec succès.",
      filename: name
    });

  } catch (error) {
    logger.error({ requestId: req.requestId, err: error }, "File deletion failed");
    return res.status(500).json({
      message: "Erreur lors de la suppression du fichier.",
      error: 'INTERNAL_ERROR'
    });
  }
};

export const getFileInfo = async (req: Request, res: Response) => {
  try {
    const { name, folder } = req.params;

    if (!name || !folder) {
      return res.status(400).json({
        message: "Nom du fichier et dossier requis.",
        error: 'MISSING_PARAMETERS'
      });
    }

    const filePath = join(process.cwd(), 'upload', folder, name);

    try {
      await accessAsync(filePath);
      return res.json({
        exists: true,
        url: `/preview/${folder}/${name}`,
        filename: name,
        folder
      });
    } catch {
      return res.status(404).json({
        message: "Fichier non trouvé.",
        error: 'FILE_NOT_FOUND'
      });
    }

  } catch (error) {
    logger.error({ requestId: req.requestId, err: error }, "Get file info failed");
    return res.status(500).json({
      message: "Erreur lors de la récupération des informations du fichier.",
      error: 'INTERNAL_ERROR'
    });
  }
};

export const listFiles = async (req: Request, res: Response) => {
  try {
    const { folder } = req.query;
    const fs = require('fs').promises;

    const folders = folder ? [folder as string] : ['image', 'document', 'video'];
    const allFiles: any[] = [];
    const privateFiles = await getAllPrivateFiles();

    for (const folderName of folders) {
      const folderPath = join(process.cwd(), 'upload', folderName);

      try {
        const files = await fs.readdir(folderPath);
        const fileInfos = await Promise.all(
          files.map(async (filename: string) => {
            const filePath = join(folderPath, filename);
            const stats = await fs.stat(filePath);
            return {
              name: filename,
              folder: folderName,
              size: stats.size,
              created: stats.birthtime,
              modified: stats.mtime,
              url: `/preview/${folderName}/${filename}`,
              isPrivate: privateFiles.has(`${folderName}/${filename}`)
            };
          })
        );
        allFiles.push(...fileInfos);
      } catch (error) {
        logger.warn({ folder: folderName, err: error }, "Folder not accessible");
      }
    }

    return res.json({
      files: allFiles,
      count: allFiles.length
    });

  } catch (error) {
    logger.error({ requestId: req.requestId, err: error }, "List files failed");
    return res.status(500).json({
      message: "Erreur lors de la récupération de la liste des fichiers.",
      error: 'INTERNAL_ERROR'
    });
  }
};

export const getStats = async (_req: Request, res: Response) => {
  try {
    const fs = require('fs').promises;
    const folders = ['image', 'document', 'video'];
    const stats: Record<string, { count: number; size: number }> = {};
    let totalFiles = 0;
    let totalSize = 0;

    for (const folderName of folders) {
      const folderPath = join(process.cwd(), 'upload', folderName);
      let count = 0;
      let size = 0;

      try {
        const files = await fs.readdir(folderPath);
        for (const filename of files) {
          const filePath = join(folderPath, filename);
          const fileStat = await fs.stat(filePath);
          if (fileStat.isFile()) {
            count++;
            size += fileStat.size;
          }
        }
      } catch {
        // folder doesn't exist yet
      }

      stats[folderName] = { count, size };
      totalFiles += count;
      totalSize += size;
    }

    return res.json({ totalFiles, totalSize, folders: stats });
  } catch (error) {
    logger.error({ err: error }, "Get stats failed");
    return res.status(500).json({
      message: "Erreur lors de la récupération des statistiques.",
      error: 'INTERNAL_ERROR'
    });
  }
};

export const downloadFile = async (req: Request, res: Response) => {
  try {
    const { folder, name } = req.params;

    if (!name || !folder) {
      return res.status(400).json({
        message: "Nom du fichier et dossier requis.",
        error: 'MISSING_PARAMETERS'
      });
    }

    const allowedFolders = ['image', 'document', 'video'];
    if (!allowedFolders.includes(folder)) {
      return res.status(400).json({
        message: "Dossier non valide.",
        error: 'INVALID_FOLDER'
      });
    }

    const filePath = join(process.cwd(), 'upload', folder, name);

    try {
      await accessAsync(filePath);
    } catch {
      return res.status(404).json({
        message: "Fichier non trouvé.",
        error: 'FILE_NOT_FOUND'
      });
    }

    const isPrivate = await getFilePrivacy(folder, name);
    if (isPrivate) {
      const token = extractToken(req);
      if (!isValidToken(token)) {
        return res.status(401).json({
          message: "Ce fichier est privé. Un token valide est requis.",
          error: "UNAUTHORIZED",
        });
      }
    }

    logger.info({ requestId: req.requestId, filename: name, folder, event: "file_downloaded" }, "File downloaded");

    return res.download(filePath, name);
  } catch (error) {
    logger.error({ requestId: req.requestId, err: error }, "File download failed");
    return res.status(500).json({
      message: "Erreur lors du téléchargement du fichier.",
      error: 'INTERNAL_ERROR'
    });
  }
};

export const toggleFileVisibility = async (req: Request, res: Response) => {
  try {
    const { folder, name, isPrivate } = req.body;

    if (!folder || !name || typeof isPrivate !== "boolean") {
      return res.status(400).json({
        message: "folder, name et isPrivate (boolean) sont requis.",
        error: "MISSING_PARAMETERS",
      });
    }

    const allowedFolders = ["image", "document", "video"];
    if (!allowedFolders.includes(folder)) {
      return res.status(400).json({
        message: "Dossier non valide.",
        error: "INVALID_FOLDER",
      });
    }

    const filePath = join(process.cwd(), "upload", folder, name);
    try {
      await accessAsync(filePath);
    } catch {
      return res.status(404).json({
        message: "Fichier non trouvé.",
        error: "FILE_NOT_FOUND",
      });
    }

    await setFilePrivacy(folder, name, isPrivate);

    return res.json({
      message: `Visibilité mise à jour: ${isPrivate ? "privé" : "public"}.`,
      name,
      folder,
      isPrivate,
    });
  } catch (error) {
    logger.error({ requestId: req.requestId, err: error }, "Toggle visibility failed");
    return res.status(500).json({
      message: "Erreur lors de la mise à jour de la visibilité.",
      error: "INTERNAL_ERROR",
    });
  }
};
