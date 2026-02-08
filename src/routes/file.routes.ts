import { Router } from "express";
import { fileCreate, deleteFile, getFileInfo, listFiles, getStats, downloadFile, toggleFileVisibility } from "../controller";
import { apiAuth } from "../middleware/auth.middleware";

export const router = Router();

router.post("/upload", fileCreate);
router.delete("/files", deleteFile);
router.get("/files", listFiles);
router.get("/files/:folder/:name", getFileInfo);
router.get("/stats", getStats);
router.get("/download/:folder/:name", downloadFile);
router.patch("/files/visibility", apiAuth, toggleFileVisibility);

router.get("/health", (_req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "filer-service",
    version: "1.0.0"
  });
});

router.get("/config/allowed-types", (_req, res) => {
  res.json({
    image: ["image/jpeg", "image/jpg", "image/png", "image/svg+xml", "image/webp", "image/bmp"],
    document: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    video: ["video/mp4", "video/avi", "video/mov", "video/wmv", "video/flv", "video/webm", "video/mkv"],
    limits: {
      fileSize: "64MB",
      maxFiles: {
        image: 6,
        document: 3,
        video: 2
      }
    }
  });
});
