import {
    Body,
    Controller,
    Delete,
    Get,
    Inject,
    Param,
    Post,
    Put,
    Query
} from '@nestjs/common';
import {
    ApiOperation,
    ApiQuery,
    ApiTags
} from '@nestjs/swagger';
import { firstValueFrom, map } from 'rxjs';
import { TCP_SERVICE } from '@common/configuration/tcp.config';
import { TCP_USER_ACCESS_SERVICE_MESSAGE } from '@common/constant/enum/tcp-message-pattern.constant';
import { ROLE } from '@common/constant/enum/action.constant';
import { Authorization } from '@common/decorators/authorizer.decorator';
import { UserInfo } from '@common/decorators/get-user.decorator';
import { ProcessId } from '@common/decorators/processid.decorator';
import { Roles } from '@common/decorators/role.decorator';
import {
    CreateExpertReviewDto,
    ExpertReviewListResponse,
    ExpertReviewResponse,
    UpdateExpertReviewDto
} from '@common/interfaces/gateway/review/expert-review.dto';
import { ResponseDto } from '@common/interfaces/gateway/response-gateway.dto';
import { TcpClient } from '@common/interfaces/tcp/common/tcp-client.interface';
import {
    CreateExpertReviewTcpRequest,
    DeleteExpertReviewTcpRequest,
    GetExpertReviewsTcpRequest,
    UpdateExpertReviewTcpRequest
} from '@common/interfaces/tcp/review/expert-review-tcp.interface';
import { User } from '@common/schemas/user-access/user.schema';

@ApiTags('Expert Reviews')
@Controller('reviews')
export class ReviewController {
    constructor(
        @Inject(TCP_SERVICE.USER_ACCESS_SERVICE)
        private readonly userAccessService: TcpClient
    ) { }

    @Post('experts/:expertId')
    @Authorization({ secured: true })
    @Roles([ROLE.MEMBER])
    @ApiOperation({ summary: 'Thành viên đánh giá chuyên gia' })
    async create(
        @Param('expertId') expertId: string,
        @Body() body: CreateExpertReviewDto,
        @UserInfo() user: User,
        @ProcessId() processId: string
    ) {
        const data = await firstValueFrom(
            this.userAccessService.send<ExpertReviewResponse, CreateExpertReviewTcpRequest>(
                TCP_USER_ACCESS_SERVICE_MESSAGE.CREATE_EXPERT_REVIEW,
                {
                    processId,
                    data: {
                        memberId: user.id,
                        expertId,
                        rating: body.rating,
                        comment: body.comment
                    }
                }
            ).pipe(map(response => response.data))
        );
        return new ResponseDto<ExpertReviewResponse>({ data });
    }

    @Get('experts/:expertId')
    @ApiOperation({ summary: 'Danh sách và thống kê đánh giá của chuyên gia' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getByExpert(
        @Param('expertId') expertId: string,
        @Query('page') page: string | undefined,
        @Query('limit') limit: string | undefined,
        @ProcessId() processId: string
    ) {
        const parsedPage = page === undefined ? 1 : Number(page);
        const parsedLimit = limit === undefined ? 10 : Number(limit);
        const data = await firstValueFrom(
            this.userAccessService.send<ExpertReviewListResponse, GetExpertReviewsTcpRequest>(
                TCP_USER_ACCESS_SERVICE_MESSAGE.GET_EXPERT_REVIEWS,
                { processId, data: { expertId, page: parsedPage, limit: parsedLimit } }
            ).pipe(map(response => response.data))
        );
        return new ResponseDto<ExpertReviewListResponse>({ data });
    }

    @Put(':reviewId')
    @Authorization({ secured: true })
    @Roles([ROLE.MEMBER])
    @ApiOperation({ summary: 'Thành viên cập nhật đánh giá của mình' })
    async update(
        @Param('reviewId') reviewId: string,
        @Body() body: UpdateExpertReviewDto,
        @UserInfo() user: User,
        @ProcessId() processId: string
    ) {
        const data = await firstValueFrom(
            this.userAccessService.send<ExpertReviewResponse, UpdateExpertReviewTcpRequest>(
                TCP_USER_ACCESS_SERVICE_MESSAGE.UPDATE_EXPERT_REVIEW,
                {
                    processId,
                    data: {
                        reviewId,
                        requesterId: user.id,
                        requesterRole: user.roleName,
                        rating: body.rating,
                        comment: body.comment
                    }
                }
            ).pipe(map(response => response.data))
        );
        return new ResponseDto<ExpertReviewResponse>({ data });
    }

    @Delete(':reviewId')
    @Authorization({ secured: true })
    @Roles([ROLE.MEMBER, ROLE.ADMIN])
    @ApiOperation({ summary: 'Xóa đánh giá của thành viên hoặc bởi admin' })
    async delete(
        @Param('reviewId') reviewId: string,
        @UserInfo() user: User,
        @ProcessId() processId: string
    ) {
        const data = await firstValueFrom(
            this.userAccessService.send<{ id: string }, DeleteExpertReviewTcpRequest>(
                TCP_USER_ACCESS_SERVICE_MESSAGE.DELETE_EXPERT_REVIEW,
                {
                    processId,
                    data: {
                        reviewId,
                        requesterId: user.id,
                        requesterRole: user.roleName
                    }
                }
            ).pipe(map(response => response.data))
        );
        return new ResponseDto({ data });
    }
}
