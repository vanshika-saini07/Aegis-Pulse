import path from "node:path";
import fs from "node:fs";
import express from "express";
import helmet from "helmet";
import { prisma } from "./lib/prisma.js";
import { sessionRouter } from "./routes/sessionRoutes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

export const app = express();

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "16kb" }));

app.get("/api/health", async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    response.json({ status: "ok", database: "connected", timestamp: new Date().toISOString() });
  } catch {
    response.status(503).json({
      error: { code: "DATABASE_UNAVAILABLE", message: "The service is temporarily unavailable." },
    });
  }
});

app.use("/api/sessions", sessionRouter);
app.use("/api", notFound);

const clientPath = path.resolve(process.cwd(), "dist");
if (process.env.NODE_ENV === "production" && fs.existsSync(clientPath)) {
  app.use(express.static(clientPath, { index: false, maxAge: "1h" }));
  app.use((_request, response) => {
    response.sendFile(path.join(clientPath, "index.html"));
  });
}

app.use(errorHandler);
