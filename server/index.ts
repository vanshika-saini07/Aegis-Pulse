import "dotenv/config";
import { app } from "./app.js";
import { prisma } from "./lib/prisma.js";

const port = Number(process.env.PORT) || 4000;
const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Aegis Pulse listening on port ${port}`);
});

async function shutdown(signal: string) {
  console.log(`${signal} received; closing server`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
