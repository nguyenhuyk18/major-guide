import { Prop, Schema } from '@nestjs/mongoose'
import { Model } from 'mongoose';
import { Base, createSchema } from '../common/base.schema';
import { TRAIT } from './question.schema';

@Schema({ _id: false })
export class AnswerOption {
    @Prop({ type: String, required: true })
    questionId: string;

    @Prop({ type: Number, required: true, min: 1, max: 5 })
    score: number;
}

@Schema({ _id: false })
export class TraitScore {
    @Prop({ type: String, enum: TRAIT, required: true })
    trait: TRAIT;

    @Prop({ type: Number, default: 0 })
    score: number;

    @Prop({ type: Number, default: 0 })
    count: number;
}

@Schema({ collection: 'test_result', timestamps: true })
export class TestResult extends Base {
    @Prop({ type: String, required: true })
    testId: string;

    @Prop({ type: String, required: true })
    userId: string;

    @Prop({ type: [AnswerOption], default: [] })
    answers: AnswerOption[];

    @Prop({ type: [TraitScore], default: [] })
    traitScores: TraitScore[];

    @Prop({ type: Number, default: 0 })
    totalScore: number;

    @Prop({ type: Date, default: Date.now })
    completedAt: Date;

    @Prop({ type: Boolean, default: true })
    isCompleted: boolean;
}

export const TestResultSchema = createSchema(TestResult)

export const TestResultModelName = TestResult.name

export const TestResultDestination = {
    name: TestResultModelName,
    schema: TestResultSchema
}

export type TestResultModel = Model<TestResult>;
