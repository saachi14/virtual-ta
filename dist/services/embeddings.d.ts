import { SearchResult } from "../utils/types";
export declare class EmbeddingSearch {
    private openai;
    private postsData;
    private embeddings;
    constructor();
    loadData(postsFile?: string): Promise<void>;
    createEmbeddings(forceRecreate?: boolean): Promise<void>;
    private cosineSimilarity;
    searchSimilarPosts(query: string, topK?: number): Promise<SearchResult[]>;
}
//# sourceMappingURL=embeddings.d.ts.map