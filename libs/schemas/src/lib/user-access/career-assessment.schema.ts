import { Prop, Schema } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Base, createSchema } from '../common/base.schema';

export type AssessmentStatus = 'in_progress' | 'completed';

@Schema({ _id: false })
export class AssessmentAnswer {
  @Prop({ required: true }) code: string;
  @Prop({ type: Number, min: 1, max: 5, default: null }) value: number | null;
  @Prop({ required: true }) answeredAt: Date;
  @Prop({ type: Number, default: 0 }) responseTimeMs: number;
}

@Schema({ collection: 'career_assessment', timestamps: true })
export class CareerAssessment extends Base {
  @Prop({ required: true, index: true }) userId: string;
  @Prop({ default: 'career-v4' }) assessmentVersion: string;
  @Prop({ default: 'question-bank-v3' }) questionBankVersion: string;
  @Prop({ type: String, default: 'in_progress' }) status: AssessmentStatus;
  @Prop({ type: Object, default: {} }) context: Record<string, unknown>;
  @Prop({ type: [String], default: [] }) issuedQuestionCodes: string[];
  @Prop({ type: [AssessmentAnswer], default: [] }) answers: AssessmentAnswer[];
  @Prop({ type: [[String]], default: [] }) rankingHistory: string[][];
  @Prop({ type: Object, default: null }) result: Record<string, unknown> | null;
  // Optional subject scores: { source: 'thi_thu' | 'hoc_ba', scores: { toan: 8.5, ... } }
  @Prop({ type: Object, default: null }) academic: Record<string, unknown> | null;
  @Prop({ type: Object, default: null }) feedback: Record<
    string,
    unknown
  > | null;
  @Prop({ type: Date, default: null }) completedAt: Date | null;
}

export const CareerAssessmentSchema = createSchema(CareerAssessment);
export const CareerAssessmentModelName = CareerAssessment.name;
export const CareerAssessmentDestination = {
  name: CareerAssessmentModelName,
  schema: CareerAssessmentSchema,
};
export type CareerAssessmentModel = Model<CareerAssessment>;
