import { TCP_SERVICE } from "@common/configuration/tcp.config";
import { TcpClient } from "@common/interfaces/tcp/common/tcp-client.interface";
import { Controller, Get, Post, Put, Delete, Body, Param, Query, Inject } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { ResponseDto } from '@common/interfaces/gateway/response-gateway.dto';
import { firstValueFrom, map } from "rxjs";
import { TCP_USER_ACCESS_SERVICE_MESSAGE } from "@common/constant/enum/tcp-message-pattern.constant";
import { ProcessId } from "@common/decorators/processid.decorator";
import { Authorization } from "@common/decorators/authorizer.decorator";
import { Roles } from "@common/decorators/role.decorator";
import { ROLE } from "@common/constant/enum/action.constant";
import { Question } from "@common/schemas/user-access/question.schema";
import { QUESTION_GROUP } from "@common/schemas/user-access/question.schema";
import { CreateQuestionRequestDto, CreateManyQuestionsRequestDto, UpdateQuestionRequestDto } from "@common/interfaces/gateway/question/question-request.interface";

@ApiTags('Question - Quản lý câu hỏi')
@Controller('question')
export class QuestionController {
    constructor(
        @Inject(TCP_SERVICE.USER_ACCESS_SERVICE) private readonly userAccessService: TcpClient
    ) { }

    @Get()
    @ApiOperation({
        summary: 'Lấy danh sách câu hỏi',
        description: 'API lấy tất cả câu hỏi với phân trang và bộ lọc theo nhóm, trạng thái'
    })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số câu hỏi mỗi trang (mặc định: 10)' })
    @ApiQuery({ name: 'group', required: false, type: String, description: 'Lọc theo nhóm (A-I)' })
    @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Lọc theo trạng thái active' })
    async getAllQuestions(
        @ProcessId() processId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('group') group?: QUESTION_GROUP,
        @Query('isActive') isActive?: boolean
    ) {
        const rs = await firstValueFrom(
            this.userAccessService.send<{ questions: Question[]; total: number; totalPage: number }, any>(
                TCP_USER_ACCESS_SERVICE_MESSAGE.GET_ALL_QUESTION,
                { data: { page, limit, group, isActive }, processId }
            ).pipe(map(row => row.data))
        );
        return new ResponseDto<{ questions: Question[]; total: number; totalPage: number }>({ data: rs });
    }

    @Get('grouped')
    @ApiOperation({
        summary: 'Lấy câu hỏi theo nhóm',
        description: 'API lấy tất cả câu hỏi được nhóm theo nhóm (A-I). Dùng cho trắc nghiệm'
    })
    async getGroupedQuestions(@ProcessId() processId: string) {
        const rs = await firstValueFrom(
            this.userAccessService.send<any[], any>(
                TCP_USER_ACCESS_SERVICE_MESSAGE.GET_GROUPED_QUESTIONS,
                { data: {}, processId }
            ).pipe(map(row => row.data))
        );
        return new ResponseDto<any[]>({ data: rs });
    }

    @Get('active')
    @ApiOperation({
        summary: 'Lấy câu hỏi đang active',
        description: 'API lấy các câu hỏi đang ở trạng thái active (dùng cho người dùng làm test)'
    })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số câu hỏi tối đa (mặc định: lấy tất cả)' })
    async getActiveQuestions(
        @ProcessId() processId: string,
        @Query('limit') limit?: number
    ) {
        const rs = await firstValueFrom(
            this.userAccessService.send<Question[], any>(
                TCP_USER_ACCESS_SERVICE_MESSAGE.GET_PUBLISHED_QUESTIONS,
                { data: { limit }, processId }
            ).pipe(map(row => row.data))
        );
        return new ResponseDto<Question[]>({ data: rs });
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Lấy câu hỏi theo ID',
        description: 'API lấy chi tiết một câu hỏi bất kỳ theo MongoDB ID'
    })
    async getQuestionById(
        @Param('id') id: string,
        @ProcessId() processId: string
    ) {
        const rs = await firstValueFrom(
            this.userAccessService.send<Question, { id: string }>(
                TCP_USER_ACCESS_SERVICE_MESSAGE.GET_QUESTION_BY_ID,
                { data: { id }, processId }
            ).pipe(map(row => row.data))
        );
        return new ResponseDto<Question>({ data: rs });
    }

    @Post()
    @ApiOperation({
        summary: 'Tạo câu hỏi mới',
        description: 'API tạo một câu hỏi mới. Chỉ ADMIN được phép tạo'
    })
    @Authorization({ secured: true })
    @Roles([ROLE.ADMIN])
    async createQuestion(
        @Body() data: CreateQuestionRequestDto,
        @ProcessId() processId: string
    ) {
        const rs = await firstValueFrom(
            this.userAccessService.send<Question, CreateQuestionRequestDto>(
                TCP_USER_ACCESS_SERVICE_MESSAGE.CREATE_QUESTION,
                { data: data, processId }
            ).pipe(map(row => row.data))
        );
        return new ResponseDto<Question>({ data: rs });
    }

    @Post('many')
    @ApiOperation({
        summary: 'Tạo nhiều câu hỏi',
        description: 'API tạo nhiều câu hỏi cùng lúc (batch). Chỉ ADMIN được phép tạo'
    })
    @Authorization({ secured: true })
    @Roles([ROLE.ADMIN])
    async createManyQuestions(
        @Body() data: CreateManyQuestionsRequestDto,
        @ProcessId() processId: string
    ) {
        const rs = await firstValueFrom(
            this.userAccessService.send<Question[], CreateManyQuestionsRequestDto>(
                TCP_USER_ACCESS_SERVICE_MESSAGE.CREATE_MANY_QUESTION,
                { data: data, processId }
            ).pipe(map(row => row.data))
        );
        return new ResponseDto<Question[]>({ data: rs });
    }

    @Put(':id')
    @ApiOperation({
        summary: 'Cập nhật câu hỏi',
        description: 'API cập nhật nội dung, nhóm hoặc traits của một câu hỏi. Chỉ ADMIN được phép sửa'
    })
    @Authorization({ secured: true })
    @Roles([ROLE.ADMIN])
    async updateQuestion(
        @Param('id') id: string,
        @Body() data: UpdateQuestionRequestDto,
        @ProcessId() processId: string
    ) {
        const rs = await firstValueFrom(
            this.userAccessService.send<Question, any>(
                TCP_USER_ACCESS_SERVICE_MESSAGE.UPDATE_QUESTION,
                { data: { id, ...data }, processId }
            ).pipe(map(row => row.data))
        );
        return new ResponseDto<Question>({ data: rs });
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Xóa câu hỏi',
        description: 'API xóa một câu hỏi theo ID. Chỉ ADMIN được phép xóa'
    })
    @Authorization({ secured: true })
    @Roles([ROLE.ADMIN])
    async deleteQuestion(
        @Param('id') id: string,
        @ProcessId() processId: string
    ) {
        const rs = await firstValueFrom(
            this.userAccessService.send<Question, { id: string }>(
                TCP_USER_ACCESS_SERVICE_MESSAGE.DELETE_QUESTION,
                { data: { id }, processId }
            ).pipe(map(row => row.data))
        );
        return new ResponseDto<Question>({ data: rs });
    }
}
