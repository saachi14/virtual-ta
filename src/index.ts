import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import { apiRouter, initializeQASystem } from "./routes/api";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
app.use("/api", apiRouter);

app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

app.get("/", (req, res) => {
  res.json({
    message: "TDS Virtual TA API",
    endpoints: {
      "POST /api/": "Answer questions",
      "GET /health": "Health check"
    }
  });
});

// Error handling
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({
      answer: "Internal server error occurred.",
      links: []
    });
  }
);

// Initialize and start server
const startServer = async () => {
  try {
    console.log("Initializing QA system...");
    await initializeQASystem();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
