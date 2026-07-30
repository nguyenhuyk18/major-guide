import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
    ExpertReview,
    ExpertReviewModel,
    ExpertReviewModelName
} from '@common/schemas/user-access/expert-review.schema';

@Injectable()
export class ReviewRepository {
    constructor(
        @InjectModel(ExpertReviewModelName)
        private readonly reviewModel: ExpertReviewModel
    ) { }

    create(data: Partial<ExpertReview>) {
        return this.reviewModel.create(data);
    }

    findById(id: string) {
        return this.reviewModel.findById(id).lean().exec();
    }

    updateById(id: string, data: Pick<ExpertReview, 'rating' | 'comment'>) {
        return this.reviewModel.findByIdAndUpdate(id, data, { new: true }).lean().exec();
    }

    deleteById(id: string) {
        return this.reviewModel.findByIdAndDelete(id).lean().exec();
    }

    findByExpertId(expertId: string, skip: number, limit: number) {
        return this.reviewModel.find({ expertId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
            .exec();
    }

    async getSummary(expertId: string) {
        const [summary] = await this.reviewModel.aggregate<{
            averageRating: number;
            totalReviews: number;
        }>([
            { $match: { expertId } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 }
                }
            }
        ]).exec();

        return summary
            ? {
                averageRating: Math.round(summary.averageRating * 100) / 100,
                totalReviews: summary.totalReviews
            }
            : { averageRating: 0, totalReviews: 0 };
    }
}
