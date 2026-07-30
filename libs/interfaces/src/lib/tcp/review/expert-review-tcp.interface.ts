import { ROLE } from '@common/constant/enum/action.constant';

export interface CreateExpertReviewTcpRequest {
    memberId: string;
    expertId: string;
    rating: number;
    comment?: string;
}

export interface UpdateExpertReviewTcpRequest {
    reviewId: string;
    requesterId: string;
    requesterRole: ROLE;
    rating: number;
    comment?: string;
}

export interface DeleteExpertReviewTcpRequest {
    reviewId: string;
    requesterId: string;
    requesterRole: ROLE;
}

export interface GetExpertReviewsTcpRequest {
    expertId: string;
    page?: number;
    limit?: number;
}
