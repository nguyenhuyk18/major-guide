import { Controller, UseInterceptors } from "@nestjs/common";
import { TestResultService } from "../services/test-result.service";
import { MessagePattern } from "@nestjs/microservices";
import { TCP_USER_ACCESS_SERVICE_MESSAGE } from "@common/constant/enum/tcp-message-pattern.constant";
import { ResponseTcp } from "@common/interfaces/tcp/common/response-tcp.interface";
import { TestResult, AnswerOption, TraitScore } from "@common/schemas/user-access/test-result.schema";
import { TcpLoggingInterceptor } from "@common/interceptors/tcpLogging.interceptors";
import { RequestParams } from "@common/decorators/request-params.decorator";

@Controller()
@UseInterceptors(TcpLoggingInterceptor)
export class TestResultController {
    constructor(private readonly testResultService: TestResultService) { }

    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.SAVE_TEST_ANSWER)
    async saveAnswer(@RequestParams() data: { userId: string; questionId: string; score: number }) {
        const result = await this.testResultService.saveAnswer(data);
        return ResponseTcp.success<TestResult>(result);
    }

    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.SUBMIT_TEST_RESULT)
    async submitTest(@RequestParams() data: {
        userId: string;
        answers: AnswerOption[];
        traitScores: TraitScore[];
        totalScore: number;
    }) {
        const result = await this.testResultService.submitTest(data);
        return ResponseTcp.success<TestResult>(result);
    }

    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.GET_TEST_RESULTS_BY_USER)
    async getResultsByUser(@RequestParams() params: { userId: string }) {
        const results = await this.testResultService.getResultsByUser(params.userId);
        return ResponseTcp.success<TestResult[]>(results);
    }

    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.GET_LATEST_TEST_RESULT)
    async getLatestResult(@RequestParams() params: { userId: string }) {
        const result = await this.testResultService.getLatestResult(params.userId);
        return ResponseTcp.success<TestResult | null>(result);
    }

    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.GET_INPROGRESS_TEST_RESULT)
    async getInProgressTest(@RequestParams() params: { userId: string }) {
        const result = await this.testResultService.getInProgressTest(params.userId);
        return ResponseTcp.success<TestResult | null>(result);
    }

    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.GET_ALL_TEST_RESULTS)
    async getAllResults(@RequestParams() params: { page?: number; limit?: number }) {
        const result = await this.testResultService.getAllResults(params.page, params.limit);
        return ResponseTcp.success(result);
    }

    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.GET_TEST_RESULT_BY_ID)
    async getResultById(@RequestParams() params: { id: string }) {
        const result = await this.testResultService.getResultById(params.id);
        return ResponseTcp.success<TestResult>(result);
    }

    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.DELETE_TEST_RESULT)
    async deleteResult(@RequestParams() params: { id: string }) {
        const result = await this.testResultService.deleteResult(params.id);
        return ResponseTcp.success<TestResult>(result);
    }
}
