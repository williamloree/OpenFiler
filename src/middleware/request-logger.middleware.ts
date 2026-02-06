import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { logger } from "../config/logger";

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  logger.info({
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get("user-agent"),
    event: "request_start",
  });

  res.on("finish", () => {
    const durationMs = Date.now() - startTime;

    const logMethod = res.statusCode >= 400 ? "warn" : "info";
    logger[logMethod]({
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      event: "request_end",
    });
  });

  next();
};
