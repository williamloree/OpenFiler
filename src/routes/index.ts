import { Router } from "express";
import { router as fileRoute } from "./file.routes";

export const router = Router();

router.use("/", fileRoute);
