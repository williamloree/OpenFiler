import { Request, Response } from "express";
import { fileUploadMiddleware } from "../config/multerConfig";
import { IReqFile, IFile } from "../@types/file";
import { unlink, access } from "fs";
import { join } from "path";
import { promisify } from "util";

const unlinkAsync = promisify(unlink);
const accessAsync = promisify(access);

export const fileCreate = [
  fileUploadMiddleware,
  async (req: Request, res: Response) => {
    try {
      const files: IFile[] = [];
      
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ 
          message: "Aucun fichier n'a été uploadé.",
          error: 'NO_FILES'
        });
      }
      
      // Traitement des fichiers uploadés
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
      
      return res.status(201).json({ 
        message: `${files.length} fichier(s) uploadé(s) avec succès.`,
        files,
        count: files.length
      });
      
    } catch (error) {
      console.error("<fileController: fileCreate>", error);
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
      return res.status(404).json({ 
        message: "Fichier non trouvé.",
        error: 'FILE_NOT_FOUND'
      });
    }
    
    await unlinkAsync(filePath);
    
    return res.json({ 
      message: "Fichier supprimé avec succès.",
      filename: name
    });
    
  } catch (error) {
    console.error("<fileController: deleteFile>", error);
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
    console.error("<fileController: getFileInfo>", error);
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
              url: `/preview/${folderName}/${filename}`
            };
          })
        );
        allFiles.push(...fileInfos);
      } catch (error) {
        console.warn(`Dossier ${folderName} non accessible:`, error);
      }
    }
    
    return res.json({ 
      files: allFiles,
      count: allFiles.length
    });
    
  } catch (error) {
    console.error("<fileController: listFiles>", error);
    return res.status(500).json({ 
      message: "Erreur lors de la récupération de la liste des fichiers.",
      error: 'INTERNAL_ERROR'
    });
  }
};