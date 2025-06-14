export interface DiscoursePost {
    id: number;
    topic_title: string;
    cleaned_content: string;
    topic_url: string;
    username: string;
    created_at: string;
    keywords: string[];
    post_number?: number;
    topic_id?: number;
}
export interface SearchResult {
    post: DiscoursePost;
    similarity: number;
    url: string;
    title: string;
    content: string;
}
export interface QuestionRequest {
    question: string;
    image?: string;
}
export interface QuestionResponse {
    answer: string;
    links: Array<{
        url: string;
        text: string;
    }>;
}
export interface SpecificAnswer {
    keywords: string[];
    answer: string;
    required_links: string[];
}
export interface EmbeddingData {
    embeddings: number[][];
    posts: DiscoursePost[];
}
//# sourceMappingURL=types.d.ts.map