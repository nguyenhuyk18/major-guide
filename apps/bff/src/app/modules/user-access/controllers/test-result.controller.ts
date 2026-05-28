import { TCP_SERVICE } from "@common/configuration/tcp.config";
import { TcpClient } from "@common/interfaces/tcp/common/tcp-client.interface";
import { Controller, Get, Post, Delete, Body, Param, Query, Inject } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { ResponseDto } from '@common/interfaces/gateway/response-gateway.dto';
import { firstValueFrom, map } from "rxjs";
import { TCP_USER_ACCESS_SERVICE_MESSAGE } from "@common/constant/enum/tcp-message-pattern.constant";
import { ProcessId } from "@common/decorators/processid.decorator";
import { Authorization } from "@common/decorators/authorizer.decorator";
import { Roles } from "@common/decorators/role.decorator";
import { ROLE } from "@common/constant/enum/action.constant";
import { TestResult } from "@common/schemas/user-access/test-result.schema";
import { SaveAnswerRequestDto, SubmitTestRequestDto } from "@common/interfaces/gateway/question/test-result-request.interface";

@ApiTags('TestResult - Kết quả bài test')
@Controller('test-result')
export class TestResultController {
    constructor(
        @Inject(TCP_SERVICE.USER_ACCESS_SERVICE) private readonly userAccessService: TcpClient
    ) { }

    @Post('answer')
    @ApiOperation({
        summary: 'Lưu đáp án từng câu',
        description: 'API lưu tạm đáp án của từng câu hỏi khi người dùng đang làm bài test (chưa nộp bài). Dùng để khôi phục tiến độ làm bài.'
    })
    @Authorization({ secured: true })
    async saveAnswer(
        @Body() data: SaveAnswerRequestDto,
        @ProcessId() processId: string
    ) {
        const rs = await firstValueFrom(
            this.userAccessService.send<TestResult, SaveAnswerRequestDto>(
                TCP_USER_ACCESS_SERVICE_MESSAGE.SAVE_TEST_ANSWER,
                { data: data, processId }
            ).pipe(map(row => row.data))
        );
        return new ResponseDto<TestResult>({ data: rs });
    }

    @Post('submit')
    @ApiOperation({
        summary: 'Nộp bài test',
        description: 'API nộp bài test hoàn chỉnh. Bao gồm tất cả đáp án, điểm traits và tổng điểm. Sau khi nộp sẽ tạo testId mới và không thể sửa.'
    })
    @Authorization({ secured: true })
    async submitTest(
        @Body() data: SubmitTestRequestDto,
        @ProcessId() processId: string
    ) {
        const rs = await firstValueFrom(
            this.userAccessService.send<TestResult, SubmitTestRequestDto>(
                TCP_USER_ACCESS_SERVICE_MESSAGE.SUBMIT_TEST_RESULT,
                { data: data, processId }
            ).pipe(map(row => row.data))
        );
        return new ResponseDto<TestResult>({ data: rs });
    }

    @Get('user/:userId')
    @ApiOperation({
        summary: 'Lấy kết quả test của user',
        description: 'API lấy tất cả kết quả bài test của một người dùng (bao gồm cả các bài test đã làm trước đó)'
    })
    async getResultsByUser(
        @Param('userId') userId: string,
        @ProcessId() processId: string
    ) {
        const rs = await firstValueFrom(
            this.userAccessService.send<TestResult[], any>(
                TCP_USER_ACCESS_SERVICE_MESSAGE.GET_TEST_RESULTS_BY_USER,
                { data: { userId }, processId }
            ).pipe(map(row => row.data))
        );
        return new ResponseDto<TestResult[]>({ data: rs });
    }

    @Get('user/:userId/latest')
    @ApiOperation({
        summary: 'Lấy kết quả test mới nhất',
        description: 'API lấy kết quả bài test mới nhất và đã hoàn thành của một người dùng'
    })
    async getLatestResult(
        @Param('userId') userId: string,
        @ProcessId() processId: string
    ) {
        const rs = await firstValueFrom(
            this.userAccessService.send<TestResult | null, any>(
                TCP_USER_ACCESS_SERVICE_MESSAGE.GET_LATEST_TEST_RESULT,
                { data: { userId }, processId }
            ).pipe(map(row => row.data))
        );
        return new ResponseDto<TestResult | null>({ data: rs });
    }

    @Get('user/:userId/inprogress')
    @ApiOperation({
        summary: 'Lấy bài test đang dở',
        description: 'API lấy bài test chưa hoàn thành của một người dùng (isCompleted = false)'
    })
    async getInProgressTest(
        @Param('userId') userId: string,
        @ProcessId() processId: string
    ) {
        const rs = await firstValueFrom(
            this.userAccessService.send<TestResult | null, any>(
                TCP_USER_ACCESS_SERVICE_MESSAGE.GET_INPROGRESS_TEST_RESULT,
                { data: { userId }, processId }
            ).pipe(map(row => row.data))
        );
        return new ResponseDto<TestResult | null>({ data: rs });
    }

    @Get()
    @ApiOperation({
        summary: 'Lấy tất cả kết quả test',
        description: 'API lấy danh sách tất cả kết quả bài test của mọi người dùng (phân trang). Chỉ ADMIN được phép truy cập.'
    })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số kết quả mỗi trang (mặc định: 10)' })
    @Authorization({ secured: true })
    @Roles([ROLE.ADMIN])
    async getAllResults(
        @ProcessId() processId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        const rs = await firstValueFrom(
            this.userAccessService.send<{ results: TestResult[]; total: number; totalPage: number }, any>(
                TCP_USER_ACCESS_SERVICE_MESSAGE.GET_ALL_TEST_RESULTS,
                { data: { page, limit }, processId }
            ).pipe(map(row => row.data))
        );
        return new ResponseDto<{ results: TestResult[]; total: number; totalPage: number }>({ data: rs });
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Lấy kết quả test theo ID',
        description: 'API lấy chi tiết một kết quả bài test bất kỳ theo MongoDB ID'
    })
    async getResultById(
        @Param('id') id: string,
        @ProcessId() processId: string
    ) {
        const rs = await firstValueFrom(
            this.userAccessService.send<TestResult, any>(
                TCP_USER_ACCESS_SERVICE_MESSAGE.GET_TEST_RESULT_BY_ID,
                { data: { id }, processId }
            ).pipe(map(row => row.data))
        );
        return new ResponseDto<TestResult>({ data: rs });
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Xóa kết quả test',
        description: 'API xóa một kết quả bài test theo ID. Chỉ ADMIN được phép xóa.'
    })
    @Authorization({ secured: true })
    @Roles([ROLE.ADMIN])
    async deleteResult(
        @Param('id') id: string,
        @ProcessId() processId: string
    ) {
        const rs = await firstValueFrom(
            this.userAccessService.send<TestResult, any>(
                TCP_USER_ACCESS_SERVICE_MESSAGE.DELETE_TEST_RESULT,
                { data: { id }, processId }
            ).pipe(map(row => row.data))
        );
        return new ResponseDto<TestResult>({ data: rs });
    }
}
