import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { closeDatabase, getDatabase } from "./lib/mongo.js";
import authRoutes from "./routes/auth.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import artworkRoutes from "./routes/artwork.routes.js";
import customRequestRoutes from "./routes/customRequest.routes.js";
import artistRoutes from "./routes/artist.routes.js";
import orderRoutes from "./routes/order.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import ratingRoutes from "./routes/rating.routes.js";
import generateRoutes from "./routes/generate.routes.js";
import { createServer } from "http";
import { initSocket } from "./socket.js";

dotenv.config();

const app = express();
app.use(cors({
  origin: "*", // Or specify the frontend URL: "https://for-artist.vercel.app"
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true
}));
app.use(express.json());
app.use("/uploads", express.static("public/uploads"));

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/artworks", artworkRoutes);
app.use("/api/custom-requests", customRequestRoutes);
app.use("/api/artist", artistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/generate", generateRoutes);

app.get("/api/health", async (_req, res) => {
  try {
    const db = await getDatabase();
    const collections = await db.collections();

    res.json({
      status: "ok",
      nodeEnv: process.env.NODE_ENV ?? "development",
      database: db.databaseName,
      collections: collections.map((c) => c.collectionName),
    });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: (error as Error).message });
  }
});

app.use((_req, res) => {
  res.status(404).json({ message: "Not found" });
});

async function bootstrap() {
  try {
    const port = process.env.PORT ?? "5005";
    await getDatabase();

    // Create HTTP server from Express app
    const httpServer = createServer(app);

    // Initialize Socket.io
    initSocket(httpServer);

    httpServer.listen(port, () => {
      console.log(`API ready on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  console.log("\nGracefully shutting down...");
  await closeDatabase();
  process.exit(0);
});

// Run bootstrap if not deployed to Vercel
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  bootstrap();
}

export default app;
