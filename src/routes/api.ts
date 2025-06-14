import { Router, Request, Response } from "express";
import { TDSQuestionAnswerer } from "../services/questionAnswerer";
import { ImageProcessor } from "../utils/imageProcessor";
import { QuestionRequest, QuestionResponse } from "../utils/types";

const router = Router();
let qaSystem: TDSQuestionAnswerer | null = null;

// Initialize QA system
const initializeQASystem = async (): Promise<void> => {
  if (!qaSystem) {
    try {
      qaSystem = new TDSQuestionAnswerer();
      await qaSystem.initialize();
      console.log("QA System initialized successfully");
    } catch (error) {
      console.error("Error initializing QA system:", error);
      qaSystem = null;
    }
  }
};

router.post("/", async (req: Request, res: Response) => {
  try {
    const { question, image }: QuestionRequest = req.body;

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
      const imageContext = await ImageProcessor.processBase64Image(image);
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
    const response: QuestionResponse = {
      answer:
        result.answer || "I could not generate an answer for your question.",
      links: result.links.map((link) => ({
        url: String(link.url),
        text: String(link.text)
      }))
    };

    res.json(response);
  } catch (error) {
    console.error("Error in answer_question:", error);
    res.status(500).json({
      answer: "Sorry, I encountered an error while processing your question.",
      links: []
    });
  }
});

export { router as apiRouter, initializeQASystem };
