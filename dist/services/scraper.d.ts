import { DiscoursePost } from "../utils/types";
export declare class TDSDiscourseScaper {
    private client;
    private baseUrl;
    constructor(baseUrl?: string);
    private delay;
    getCategoryTopics(categoryId: number, startDate: Date, endDate: Date): Promise<any[]>;
    getTopicPosts(topicId: number): Promise<any[]>;
    cleanHtml(htmlContent: string): string;
    scrapeTDSPosts(startDate?: string, endDate?: string): Promise<DiscoursePost[]>;
    private extractKeywords;
    savePosts(posts: DiscoursePost[], filename?: string): Promise<void>;
}
//# sourceMappingURL=scraper.d.ts.map