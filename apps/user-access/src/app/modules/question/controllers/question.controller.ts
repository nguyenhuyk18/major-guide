import { Controller, UseInterceptors } from "@nestjs/common";
import { QuestionService } from "../services/question.service";
import { MessagePattern } from "@nestjs/microservices";
import { TCP_USER_ACCESS_SERVICE_MESSAGE } from "@common/constant/enum/tcp-message-pattern.constant";
import { ResponseTcp } from "@common/interfaces/tcp/common/response-tcp.interface";
import { Question } from "@common/schemas/user-access/question.schema";
import { TcpLoggingInterceptor } from "@common/interceptors/tcpLogging.interceptors";
import { RequestParams } from "@common/decorators/request-params.decorator";
import { QUESTION_GROUP, TRAIT } from "@common/schemas/user-access/question.schema";

@Controller()
@UseInterceptors(TcpLoggingInterceptor)
export class QuestionController {
    constructor(private readonly questionService: QuestionService) { }

    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.GET_ALL_QUESTION)
    async getAllQuestions(@RequestParams() params: {
        page?: number;
        limit?: number;
        group?: QUESTION_GROUP;
        isActive?: boolean;
    }) {
        const result = await this.questionService.findAll(params);
        return ResponseTcp.success(result);
    }

    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.GET_PUBLISHED_QUESTIONS)
    async getActiveQuestions(@RequestParams() params: { limit?: number }) {
        const questions = await this.questionService.findAllActive(params.limit);
        return ResponseTcp.success<Question[]>(questions);
    }

    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.GET_QUESTION_BY_ID)
    async getQuestionById(@RequestParams() params: { id: string }) {
        const question = await this.questionService.findById(params.id);
        return ResponseTcp.success<Question>(question);
    }

    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.CREATE_QUESTION)
    async createQuestion(@RequestParams() data: {
        questionId: string;
        group: QUESTION_GROUP;
        text: string;
        traits?: TRAIT[];
        isActive?: boolean;
    }) {
        const question = await this.questionService.create(data);
        return ResponseTcp.success<Question>(question);
    }

    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.CREATE_MANY_QUESTION)
    async createManyQuestions(@RequestParams() data: {
        questions: {
            questionId: string;
            group: QUESTION_GROUP;
            text: string;
            traits?: TRAIT[];
            isActive?: boolean;
        }[]
    }) {
        const questions = await this.questionService.createMany(data.questions);
        return ResponseTcp.success<Question[]>(questions);
    }

    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.GET_GROUPED_QUESTIONS)
    async getGroupedQuestions() {
        const grouped = await this.questionService.findAllGrouped();
        return ResponseTcp.success<any[]>(grouped);
    }

    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.UPDATE_QUESTION)
    async updateQuestion(@RequestParams() data: {
        id: string;
        group?: QUESTION_GROUP;
        text?: string;
        traits?: TRAIT[];
        isActive?: boolean;
    }) {
        const { id, ...updateData } = data;
        const question = await this.questionService.update(id, updateData);
        return ResponseTcp.success<Question>(question);
    }

    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.DELETE_QUESTION)
    async deleteQuestion(@RequestParams() params: { id: string }) {
        const question = await this.questionService.delete(params.id);
        return ResponseTcp.success<Question>(question);
    }
}
