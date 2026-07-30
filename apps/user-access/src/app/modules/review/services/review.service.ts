import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException
} from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { ROLE } from '@common/constant/enum/action.constant';
import { StatusAccount } from '@common/constant/enum/status-account.constant';
import {
    ExpertReviewListResponse,
    ExpertReviewResponse,
    ReviewSummary
} from '@common/interfaces/gateway/review/expert-review.dto';
import {
    CreateExpertReviewTcpRequest,
    DeleteExpertReviewTcpRequest,
    UpdateExpertReviewTcpRequest
} from '@common/interfaces/tcp/review/expert-review-tcp.interface';
import { UserRepository } from '../../user/repositories/user.repository';
import { ReviewRepository } from '../repositories/review.repository';

@Injectable()
export class ReviewService {
    constructor(
        private readonly reviewRepository: ReviewRepository,
        private readonly userRepository: UserRepository
    ) { }

    private normalizeComment(comment?: string): string | null {
        if (comment === undefined || comment === null) return null;
        const normalized = comment.trim();
        return normalized.length ? normalized : null;
    }

    private validateReview(rating: number, comment?: string): string | null {
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            throw new BadRequestException('Điểm đánh giá phải là số nguyên từ 1 đến 5');
        }

        const normalizedComment = this.normalizeComment(comment);
        if (normalizedComment && normalizedComment.length > 1000) {
            throw new BadRequestException('Nhận xét không được vượt quá 1000 ký tự');
        }
        return normalizedComment;
    }

    private async ensureExpert(expertId: string) {
        if (!ObjectId.isValid(expertId)) {
            throw new NotFoundException('Không tìm thấy chuyên gia');
        }
        const expert = await this.userRepository.getById(expertId);
        if (
            !expert ||
            expert.roleName !== ROLE.EXPERT ||
            expert.statusAccount !== StatusAccount.ACTIVE
        ) {
            throw new NotFoundException('Không tìm thấy chuyên gia đang hoạt động');
        }
        return expert;
    }

    async create(data: CreateExpertReviewTcpRequest): Promise<ExpertReviewResponse> {
        if (data.memberId === data.expertId) {
            throw new ForbiddenException('Không thể tự đánh giá chính mình');
        }
        if (!ObjectId.isValid(data.memberId)) {
            throw new ForbiddenException('Tài khoản thành viên không hợp lệ');
        }

        const [member] = await Promise.all([
            this.userRepository.getById(data.memberId),
            this.ensureExpert(data.expertId)
        ]);
        if (!member || member.roleName !== ROLE.MEMBER) {
            throw new ForbiddenException('Chỉ thành viên mới được đánh giá chuyên gia');
        }

        const comment = this.validateReview(data.rating, data.comment);
        const review = await this.reviewRepository.create({
            memberId: data.memberId,
            expertId: data.expertId,
            rating: data.rating,
            comment
        });

        return this.mapReview(review.toObject(), member);
    }

    async update(data: UpdateExpertReviewTcpRequest): Promise<ExpertReviewResponse> {
        if (!ObjectId.isValid(data.reviewId)) {
            throw new NotFoundException('Không tìm thấy đánh giá');
        }
        const review = await this.reviewRepository.findById(data.reviewId);
        if (!review) throw new NotFoundException('Không tìm thấy đánh giá');
        if (data.requesterRole !== ROLE.MEMBER || review.memberId !== data.requesterId) {
            throw new ForbiddenException('Bạn không có quyền sửa đánh giá này');
        }

        const comment = this.validateReview(data.rating, data.comment);
        const updated = await this.reviewRepository.updateById(data.reviewId, {
            rating: data.rating,
            comment
        });
        const member = await this.userRepository.getById(review.memberId);
        return this.mapReview(updated, member);
    }

    async delete(data: DeleteExpertReviewTcpRequest) {
        if (!ObjectId.isValid(data.reviewId)) {
            throw new NotFoundException('Không tìm thấy đánh giá');
        }
        const review = await this.reviewRepository.findById(data.reviewId);
        if (!review) throw new NotFoundException('Không tìm thấy đánh giá');

        const ownsReview =
            data.requesterRole === ROLE.MEMBER && review.memberId === data.requesterId;
        if (!ownsReview && data.requesterRole !== ROLE.ADMIN) {
            throw new ForbiddenException('Bạn không có quyền xóa đánh giá này');
        }

        await this.reviewRepository.deleteById(data.reviewId);
        return { id: data.reviewId };
    }

    async getByExpert(
        expertId: string,
        page = 1,
        limit = 10
    ): Promise<ExpertReviewListResponse> {
        await this.ensureExpert(expertId);
        const safePage = Number.isInteger(page) && page > 0 ? page : 1;
        const safeLimit = Number.isInteger(limit) && limit > 0
            ? Math.min(limit, 50)
            : 10;

        const summary = await this.reviewRepository.getSummary(expertId);
        const reviews = await this.reviewRepository.findByExpertId(
            expertId,
            (safePage - 1) * safeLimit,
            safeLimit
        );
        const memberIds = [...new Set(reviews.map(review => review.memberId))]
            .filter(id => ObjectId.isValid(id));
        const members = memberIds.length
            ? await this.userRepository.getByIds(memberIds)
            : [];
        const memberMap = new Map(members.map(member => [member.id, member]));

        return {
            reviews: reviews.map(review => this.mapReview(review, memberMap.get(review.memberId))),
            ...summary,
            page: safePage,
            limit: safeLimit,
            totalPages: Math.ceil(summary.totalReviews / safeLimit)
        };
    }

    getSummary(expertId: string): Promise<ReviewSummary> {
        return this.reviewRepository.getSummary(expertId);
    }

    private mapReview(review: any, member?: any): ExpertReviewResponse {
        return {
            id: review.id || review._id.toString(),
            expertId: review.expertId,
            rating: review.rating,
            comment: review.comment || undefined,
            createdAt: review.createdAt,
            updatedAt: review.updatedAt,
            reviewer: {
                id: review.memberId,
                name: member?.name,
                avatar: member?.fileAvartarUrl
            }
        };
    }
}
