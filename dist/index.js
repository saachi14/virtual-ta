"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const api_1 = require("./routes/api");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5005;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
// Routes
app.use("/api", api_1.apiRouter);
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
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        answer: "Internal server error occurred.",
        links: []
    });
});
// Initialize and start server
const startServer = async () => {
    try {
        console.log("Initializing QA system...");
        await (0, api_1.initializeQASystem)();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=index.js.map