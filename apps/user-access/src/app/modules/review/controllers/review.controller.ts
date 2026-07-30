import { Controller, UseInterceptors } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { TCP_USER_ACCESS_SERVICE_MESSAGE } from '@common/constant/enum/tcp-message-pattern.constant';
import { RequestParams } from '@common/decorators/request-params.decorator';
import { TcpLoggingInterceptor } from '@common/interceptors/tcpLogging.interceptors';
import {
    ExpertReviewListResponse,
    ExpertReviewResponse,
    ReviewSummary
} from '@common/interfaces/gateway/review/expert-review.dto';
import { ResponseTcp } from '@common/interfaces/tcp/common/response-tcp.interface';
import {
    CreateExpertReviewTcpRequest,
    DeleteExpertReviewTcpRequest,
    GetExpertReviewsTcpRequest,
    UpdateExpertReviewTcpRequest
} from '@common/interfaces/tcp/review/expert-review-tcp.interface';
import { ReviewService } from '../services/review.service';

@Controller()
@UseInterceptors(TcpLoggingInterceptor)
export class ReviewController {
    constructor(private readonly reviewService: ReviewService) { }

    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.CREATE_EXPERT_REVIEW)
    async create(@RequestParams() data: CreateExpertReviewTcpRequest) {
        return ResponseTcp.success<ExpertReviewResponse>(await this.reviewService.create(data));
    }

    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.UPDATE_EXPERT_REVIEW)
    async update(@RequestParams() data: UpdateExpertReviewTcpRequest) {
        return ResponseTcp.success<ExpertReviewResponse>(await this.reviewService.update(data));
    }

    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.DELETE_EXPERT_REVIEW)
    async delete(@RequestParams() data: DeleteExpertReviewTcpRequest) {
        return ResponseTcp.success(await this.reviewService.delete(data));
    }

    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.GET_EXPERT_REVIEWS)
    async getByExpert(@RequestParams() data: GetExpertReviewsTcpRequest) {
        return ResponseTcp.success<ExpertReviewListResponse>(
            await this.reviewService.getByExpert(data.expertId, data.page, data.limit)
        );
    }

    @MessagePattern(TCP_USER_ACCESS_SERVICE_MESSAGE.GET_EXPERT_REVIEW_SUMMARY)
    async getSummary(@RequestParams() data: { expertId: string }) {
        return ResponseTcp.success<ReviewSummary>(
            await this.reviewService.getSummary(data.expertId)
        );
    }
}
