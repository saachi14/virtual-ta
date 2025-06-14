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
exports.TDSDiscourseScaper = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const fs = __importStar(require("fs/promises"));
class TDSDiscourseScaper {
    constructor(baseUrl = "https://discourse.onlinedegree.iitm.ac.in") {
        this.baseUrl = baseUrl;
        this.client = axios_1.default.create({
            baseURL: baseUrl,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
            timeout: 30000
        });
    }
    async delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    async getCategoryTopics(categoryId, startDate, endDate) {
        const topics = [];
        let page = 0;
        while (true) {
            try {
                const response = await this.client.get(`/c/${categoryId}.json?page=${page}`);
                const data = response.data;
                if (!data?.topic_list?.topics?.length) {
                    break;
                }
                for (const topic of data.topic_list.topics) {
                    const createdAt = new Date(topic.created_at);
                    if (createdAt >= startDate && createdAt <= endDate) {
                        topics.push(topic);
                    }
                    else if (createdAt < startDate) {
                        return topics;
                    }
                }
                page++;
                await this.delay(1000); // Rate limiting
            }
            catch (error) {
                console.error(`Error fetching page ${page}:`, error);
                break;
            }
        }
        return topics;
    }
    async getTopicPosts(topicId) {
        try {
            const response = await this.client.get(`/t/${topicId}.json`);
            const data = response.data;
            return data?.post_stream?.posts || [];
        }
        catch (error) {
            console.error(`Error fetching topic ${topicId}:`, error);
            return [];
        }
    }
    cleanHtml(htmlContent) {
        const $ = cheerio.load(htmlContent);
        return $.text().trim();
    }
    async scrapeTDSPosts(startDate = "2025-01-01", endDate = "2025-04-14") {
        const start = new Date(startDate);
        const end = new Date(endDate);
        console.log(`Scraping TDS posts from ${startDate} to ${endDate}`);
        // TDS category ID (update with actual ID)
        const tdsCategoryId = 12;
        const topics = await this.getCategoryTopics(tdsCategoryId, start, end);
        const allPosts = [];
        for (const topic of topics) {
            console.log(`Scraping topic: ${topic.title}`);
            const posts = await this.getTopicPosts(topic.id);
            for (const post of posts) {
                const processedPost = {
                    id: post.id,
                    topic_title: topic.title,
                    cleaned_content: this.cleanHtml(post.cooked),
                    topic_url: `${this.baseUrl}/t/${topic.id}/${post.post_number}`,
                    username: post.username,
                    created_at: post.created_at,
                    keywords: this.extractKeywords(post.cooked + " " + topic.title),
                    post_number: post.post_number,
                    topic_id: topic.id
                };
                allPosts.push(processedPost);
            }
            await this.delay(500); // Rate limiting
        }
        return allPosts;
    }
    extractKeywords(text) {
        const cleanText = this.cleanHtml(text).toLowerCase();
        const words = cleanText.match(/\b\w{3,}\b/g) || [];
        const stopWords = new Set([
            "the",
            "and",
            "or",
            "but",
            "in",
            "on",
            "at",
            "to",
            "for",
            "of",
            "with",
            "by",
            "from",
            "this",
            "that",
            "these",
            "those",
            "a",
            "an"
        ]);
        return [...new Set(words.filter((word) => !stopWords.has(word)))];
    }
    async savePosts(posts, filename = "src/data/discourse_posts.json") {
        await fs.writeFile(filename, JSON.stringify(posts, null, 2), "utf-8");
        console.log(`Saved ${posts.length} posts to ${filename}`);
    }
}
exports.TDSDiscourseScaper = TDSDiscourseScaper;
// Script runner
if (require.main === module) {
    const scraper = new TDSDiscourseScaper();
    scraper
        .scrapeTDSPosts()
        .then((posts) => scraper.savePosts(posts))
        .catch(console.error);
}
//# sourceMappingURL=scraper.js.map