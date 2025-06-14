import { QuestionResponse } from "../utils/types";
export declare class TDSQuestionAnswerer {
    private openai;
    private searchEngine;
    private specificAnswers;
    constructor();
    initialize(): Promise<void>;
    private extractKeywords;
    private matchSpecificQuestion;
    private generateAnswerWithGPT;
    answerQuestion(question: string): Promise<QuestionResponse>;
}
//# sourceMappingURL=questionAnswerer.d.ts.map