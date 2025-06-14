"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeQASystem = exports.apiRouter = void 0;
const express_1 = require("express");
const questionAnswerer_1 = require("../services/questionAnswerer");
const imageProcessor_1 = require("../utils/imageProcessor");
const router = (0, express_1.Router)();
exports.apiRouter = router;
let qaSystem = null;
// Initialize QA system
const initializeQASystem = async () => {
    if (!qaSystem) {
        try {
            qaSystem = new questionAnswerer_1.TDSQuestionAnswerer();
            await qaSystem.initialize();
            console.log("QA System initialized successfully");
        }
        catch (error) {
            console.error("Error initializing QA system:", error);
            qaSystem = null;
        }
    }
};
exports.initializeQASystem = initializeQASystem;
router.post("/", async (req, res) => {
    try {
        const { question, image } = req.body;
        if (!question) {
            return res.status(400).json({
                error: "Question is required",
                answer: "Please provide a question to answer.",
                links: []
            });
        }
        // Process image if provided
        let processedQuestion = question;
        if (image) {
            const imageContext = await imageProcessor_1.ImageProcessor.processBase64Image(image);
            console.log(`Image processed: ${imageContext}`);
            // For questions with images, we can add context
            if (question.toLowerCase().includes("gpt")) {
                processedQuestion = `${question} [Image shows question about model selection]`;
            }
        }
        // Initialize QA system if not done
        if (!qaSystem) {
            await initializeQASystem();
        }
        if (!qaSystem) {
            return res.json({
                answer: "System is currently unavailable. Please try again later.",
                links: []
            });
        }
        // Get answer
        const result = await qaSystem.answerQuestion(processedQuestion);
        // Ensure the response has the correct format
        const response = {
            answer: result.answer || "I could not generate an answer for your question.",
            links: result.links.map((link) => ({
                url: String(link.url),
                text: String(link.text)
            }))
        };
        res.json(response);
    }
    catch (error) {
        console.error("Error in answer_question:", error);
        res.status(500).json({
            answer: "Sorry, I encountered an error while processing your question.",
            links: []
        });
    }
});
//# sourceMappingURL=api.js.map