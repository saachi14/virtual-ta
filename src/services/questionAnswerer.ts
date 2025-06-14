import OpenAI from "openai";
import { EmbeddingSearch } from "./embeddings";
import { QuestionResponse, SearchResult, SpecificAnswer } from "../utils/types";

export class TDSQuestionAnswerer {
  private openai: OpenAI;
  private searchEngine: EmbeddingSearch;
  private specificAnswers: Record<string, SpecificAnswer>;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    this.searchEngine = new EmbeddingSearch();
    this.specificAnswers = {
      gpt_model: {
        keywords: ["gpt-3.5-turbo", "gpt-4o-mini", "openai", "api", "model"],
        answer:
          "You must use gpt-3.5-turbo-0125, even if the AI Proxy only supports gpt-4o-mini. Use the OpenAI API directly for this question.",
        required_links: [
          "https://discourse.onlinedegree.iitm.ac.in/t/ga5-question-8-clarification/155939"
        ]
      },
      ga4_bonus: {
        keywords: ["ga4", "bonus", "dashboard", "score", "10/10"],
        answer:
          "If a student scores 10/10 on GA4 as well as a bonus, it would appear as 110 on the dashboard.",
        required_links: [
          "https://discourse.onlinedegree.iitm.ac.in/t/ga4-data-sourcing-discussion-thread-tds-jan-2025/165959"
        ]
      },
      docker_podman: {
        keywords: ["docker", "podman", "container"],
        answer:
          "While you can use Docker if you're familiar with it, we recommend using Podman for this course as it's what we'll be teaching and supporting. Docker is acceptable if you prefer it.",
        required_links: ["https://tds.s-anand.net/#/docker"]
      },
      exam_date: {
        keywords: ["tds", "sep", "2025", "exam", "end-term"],
        answer:
          "I don't know when the TDS Sep 2025 end-term exam is scheduled, as this information is not available yet. Please check the official announcements closer to the course start date.",
        required_links: []
      }
    };
  }

  async initialize(): Promise<void> {
    await this.searchEngine.loadData();
    await this.searchEngine.createEmbeddings();
  }

  private extractKeywords(question: string): string[] {
    const stopWords = new Set([
      "the",
      "is",
      "at",
      "which",
      "on",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "with",
      "to",
      "for",
      "of",
      "as",
      "by",
      "i",
      "should",
      "would",
      "how",
      "when",
      "what",
      "where",
      "why"
    ]);
    const words = question.toLowerCase().match(/\b\w{3,}\b/g) || [];
    return words.filter((word) => !stopWords.has(word));
  }

  private matchSpecificQuestion(question: string): SpecificAnswer | null {
    const questionLower = question.toLowerCase();
    const keywords = this.extractKeywords(question);

    for (const [, config] of Object.entries(this.specificAnswers)) {
      let matchCount = 0;
      for (const keyword of config.keywords) {
        if (questionLower.includes(keyword.toLowerCase())) {
          matchCount++;
        }
      }

      // If we have enough keyword matches, use the specific answer
      if (matchCount >= Math.min(2, Math.floor(config.keywords.length / 2))) {
        return config;
      }
    }

    return null;
  }

  private async generateAnswerWithGPT(
    question: string,
    similarPosts: SearchResult[]
  ): Promise<string> {
    if (!similarPosts.length) {
      return "I couldn't find relevant information to answer your question. Please try rephrasing or contact the teaching assistants directly.";
    }

    // Prepare context from similar posts
    const context = similarPosts
      .slice(0, 3)
      .map(
        (post) => `Title: ${post.title}\nContent: ${post.post.cleaned_content}`
      )
      .join("\n\n---\n\n");

    const systemPrompt = `You are a helpful teaching assistant for the Tools in Data Science (TDS) course at IIT Madras. 
Answer student questions based on the provided context from course discussions. 
Be concise, accurate, and helpful. If the context doesn't contain enough information, say so clearly.

Context from course discussions:
${context}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question }
        ],
        max_tokens: 300,
        temperature: 0.3
      });

      return (
        response.choices[0]?.message?.content ||
        "I could not generate an answer for your question."
      );
    } catch (error) {
      console.error("Error generating answer with GPT:", error);
      // Fallback to simple answer
      return (
        similarPosts[0]?.post.cleaned_content.substring(0, 200) + "..." ||
        "I encountered an error while generating an answer."
      );
    }
  }

  async answerQuestion(question: string): Promise<QuestionResponse> {
    // First check for specific predefined answers
    const specificMatch = this.matchSpecificQuestion(question);

    if (specificMatch) {
      // Use predefined answer
      const links = specificMatch.required_links.map((url) => {
        // Find matching post for this URL
        const matchingPost = this.searchEngine["postsData"]?.find(
          (post) => post.topic_url.includes(url) || url.includes(post.topic_url)
        );

        return {
          url,
          text: matchingPost?.topic_title || "Relevant Discussion"
        };
      });

      return {
        answer: specificMatch.answer,
        links
      };
    }

    // Fallback to similarity search + GPT generation
    const similarPosts = await this.searchEngine.searchSimilarPosts(
      question,
      10
    );
    const relevantPosts = similarPosts.filter((post) => post.similarity > 0.3);

    const postsToUse =
      relevantPosts.length > 0 ? relevantPosts : similarPosts.slice(0, 3);

    // Use GPT to generate better answers
    const answer = await this.generateAnswerWithGPT(question, postsToUse);

    // Format links
    const links = postsToUse.slice(0, 3).map((post) => ({
      url: post.url,
      text: post.title || post.content.substring(0, 100) + "..."
    }));

    return {
      answer,
      links
    };
  }
}
