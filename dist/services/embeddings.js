"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingSearch = void 0;
const openai_1 = __importDefault(require("openai"));
const fs = __importStar(require("fs/promises"));
class EmbeddingSearch {
    constructor() {
        this.postsData = [];
        this.embeddings = [];
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY environment variable is required");
        }
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY
        });
    }
    async loadData(postsFile = "src/data/discourse_posts.json") {
        try {
            const data = await fs.readFile(postsFile, "utf-8");
            this.postsData = JSON.parse(data);
            console.log(`Loaded ${this.postsData.length} posts`);
        }
        catch (error) {
            console.error(`Error loading data from ${postsFile}:`, error);
            this.postsData = [];
        }
    }
    async createEmbeddings(forceRecreate = false) {
        const embeddingsFile = "src/data/embeddings.json";
        if (!forceRecreate) {
            try {
                const data = await fs.readFile(embeddingsFile, "utf-8");
                const embeddingData = JSON.parse(data);
                this.embeddings = embeddingData.embeddings;
                console.log("Loaded existing embeddings");
                return;
            }
            catch (error) {
                console.log("No existing embeddings found, creating new ones...");
            }
        }
        if (this.postsData.length === 0) {
            await this.loadData();
        }
        console.log("Creating embeddings using OpenAI...");
        const texts = this.postsData.map((post) => `${post.topic_title} ${post.cleaned_content}`.trim());
        this.embeddings = [];
        // Process in batches to avoid rate limits
        const batchSize = 20;
        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize);
            console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)}`);
            try {
                const response = await this.openai.embeddings.create({
                    model: "text-embedding-3-small",
                    input: batch
                });
                for (const embedding of response.data) {
                    this.embeddings.push(embedding.embedding);
                }
                // Rate limiting
                if (i + batchSize < texts.length) {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                }
            }
            catch (error) {
                console.error(`Error creating embeddings for batch ${i}:`, error);
                // Fallback: create zero embeddings for failed batch
                for (let j = 0; j < batch.length; j++) {
                    this.embeddings.push(new Array(1536).fill(0)); // text-embedding-3-small has 1536 dimensions
                }
            }
        }
        // Save embeddings
        const embeddingData = {
            embeddings: this.embeddings,
            posts: this.postsData
        };
        await fs.writeFile(embeddingsFile, JSON.stringify(embeddingData, null, 2));
        console.log("Embeddings created and saved");
    }
    cosineSimilarity(a, b) {
        const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
        const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
        const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
        return dotProduct / (magnitudeA * magnitudeB);
    }
    async searchSimilarPosts(query, topK = 5) {
        if (this.embeddings.length === 0) {
            await this.createEmbeddings();
        }
        if (this.postsData.length === 0) {
            return [];
        }
        try {
            // Create query embedding using OpenAI
            const response = await this.openai.embeddings.create({
                model: "text-embedding-3-small",
                input: query
            });
            const queryEmbedding = response.data[0].embedding;
            // Calculate similarities
            const similarities = this.embeddings.map((embedding) => this.cosineSimilarity(queryEmbedding, embedding));
            // Get top k similar posts
            const sortedIndices = similarities
                .map((sim, idx) => ({ similarity: sim, index: idx }))
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, topK);
            return sortedIndices.map(({ similarity, index }) => ({
                post: this.postsData[index],
                similarity,
                url: this.postsData[index].topic_url,
                title: this.postsData[index].topic_title,
                content: this.postsData[index].cleaned_content.substring(0, 200) + "..."
            }));
        }
        catch (error) {
            console.error("Error searching similar posts:", error);
            return [];
        }
    }
}
exports.EmbeddingSearch = EmbeddingSearch;
//# sourceMappingURL=embeddings.js.map