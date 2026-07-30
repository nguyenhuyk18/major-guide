import { Prop, Schema } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Base, createSchema } from '../common/base.schema';

@Schema({ collection: 'expert_review' })
export class ExpertReview extends Base {
    @Prop({ type: String, required: true })
    memberId: string;

    @Prop({ type: String, required: true, index: true })
    expertId: string;

    @Prop({ type: Number, required: true, min: 1, max: 5 })
    rating: number;

    @Prop({ type: String, maxlength: 1000, default: null })
    comment?: string | null;
}

export const ExpertReviewSchema = createSchema(ExpertReview);
ExpertReviewSchema.index({ expertId: 1, createdAt: -1 });
ExpertReviewSchema.index({ memberId: 1 });

export const ExpertReviewModelName = ExpertReview.name;
export const ExpertReviewDestination = {
    name: ExpertReviewModelName,
    schema: ExpertReviewSchema
};
export type ExpertReviewModel = Model<ExpertReview>;
